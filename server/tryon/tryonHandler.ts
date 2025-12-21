import crypto from 'node:crypto';
import sharp from 'sharp';
import type { TryOnRequest, TryOnResponse } from '../../src/types/tryon';
import { getTemplateById } from './templates';
import { assertNoPersonalPhotoPolicy, isAllowedRemoteImageUrl, validateTryOnRequest } from './validation';
import { generateTryOnImage } from './geminiClient';
import { getFirestore, getStorageBucket, verifyFirebaseIdToken } from './firebaseAdmin';
import { getImageMeta } from './imageMeta';

type HandlerContext = {
  ip: string;
  headers: Record<string, string | undefined>;
};

const ipCounters = new Map<string, { count: number; resetAt: number }>();

function rateLimitKey(ctx: HandlerContext, userId: string | null) {
  return userId ? `uid:${userId}` : `ip:${ctx.ip}`;
}

function checkRateLimit(key: string, limitPerMinute: number) {
  const now = Date.now();
  const entry = ipCounters.get(key);
  if (!entry || entry.resetAt < now) {
    ipCounters.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  if (entry.count >= limitPerMinute) {
    throw new Error('Rate limit exceeded. Please wait and try again.');
  }
  entry.count += 1;
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string; buffer: Buffer }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return { base64: buffer.toString('base64'), mimeType: contentType.split(';')[0], buffer };
}

function orientedDimensions(meta: sharp.Metadata): { width?: number; height?: number } {
  const width = meta.width;
  const height = meta.height;
  if (!width || !height) return { width, height };
  // 5-8 are rotated (90/270) orientations where width/height are swapped.
  const o = meta.orientation;
  if (o && [5, 6, 7, 8].includes(o)) return { width: height, height: width };
  return { width, height };
}

function buildPrompt(req: TryOnRequest, templateWidth?: number, templateHeight?: number) {
  const scale = req.options?.fabricScale ?? 1;
  const neck = req.options?.neckStyle || 'keep';
  const sleeve = req.options?.sleeveStyle || 'keep';
  const emb = req.options?.embroideryStyle || 'keep';

  const dimensionGuidance = templateWidth && templateHeight 
    ? `CRITICAL: Output image MUST be exactly ${templateWidth}x${templateHeight} pixels to match the template dimensions. Preserve the exact aspect ratio of Image A. Do NOT stretch, squish, or distort the garment or person.`
    : `CRITICAL: Output image MUST match the exact dimensions and aspect ratio of Image A. Do NOT stretch, squish, or distort the garment or person.`;

  return `You are a professional fashion product renderer.
Task: Replace ONLY the garment fabric area in Image A with the fabric pattern from Image B.
Keep garment shape, folds, lighting, shadows, and background unchanged.
Do not add people. Do not change body/face (none exists).
Preserve exact neckline and sleeve geometry unless options specify change.
${dimensionGuidance}
Options:
- fabric scale: ${scale}
- neck style: ${neck}
- sleeve style: ${sleeve}
- embroidery style: ${emb}
Output a single photorealistic image.`;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

async function applyFabricScaleAndTile(
  fabricImg: { base64: string; mimeType: string; buffer: Buffer },
  fabricScale: number | undefined,
): Promise<{ base64: string; mimeType: string; buffer: Buffer }> {
  const scale = typeof fabricScale === 'number' ? fabricScale : 1;
  if (!Number.isFinite(scale) || scale === 1) return fabricImg;

  // Deterministic scale: physically resize and tile the fabric swatch before sending to the model.
  // This avoids relying on prompt-following for pattern scale.
  const CANVAS_SIZE = 1024;
  const MIN_TILE = 96;
  const MAX_TILE = 1024;

  try {
    const meta = await (sharp as any)(fabricImg.buffer).metadata();
    const baseW = typeof meta.width === 'number' && meta.width > 0 ? meta.width : 512;
    const baseH = typeof meta.height === 'number' && meta.height > 0 ? meta.height : 512;

    const tileW = clampNumber(Math.round(baseW * scale), MIN_TILE, MAX_TILE);
    const tileH = clampNumber(Math.round(baseH * scale), MIN_TILE, MAX_TILE);

    const tileBuffer = await (sharp as any)(fabricImg.buffer)
      .rotate()
      .resize(tileW, tileH, { fit: 'fill', kernel: 'lanczos3' })
      .png()
      .toBuffer();

    const tiledBuffer = await (sharp as any)({
      create: {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([
        {
          input: tileBuffer,
          tile: true,
          blend: 'over',
        },
      ])
      .png()
      .toBuffer();

    return {
      base64: tiledBuffer.toString('base64'),
      mimeType: 'image/png',
      buffer: tiledBuffer,
    };
  } catch (e) {
    console.warn('Failed to apply deterministic fabric scale; falling back to original fabric image:', e);
    return fabricImg;
  }
}

export async function handleTryOnFabric(body: any, ctx: HandlerContext): Promise<{ status: number; json: TryOnResponse }> {
  const validation = validateTryOnRequest(body);
  if (validation.ok !== true) {
    const v = validation as Extract<typeof validation, { ok: false }>;
    return { status: v.status, json: { jobId: 'n/a', status: 'failed', error: v.message } };
  }

  const req = body as TryOnRequest;

  // Auth (optional but preferred)
  const authHeader = ctx.headers.authorization || ctx.headers.Authorization;
  let userId: string | null = null;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    const verified = await verifyFirebaseIdToken(token);
    if (verified) userId = verified.uid;
  }

  // Rate limit: stricter for anonymous
  checkRateLimit(rateLimitKey(ctx, userId), userId ? 10 : 3);

  const jobId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  // Storage is required for returning a result URL; fail fast if Admin creds/bucket are not configured.
  let bucket: ReturnType<typeof getStorageBucket>;
  try {
    bucket = getStorageBucket();
  } catch (e: any) {
    return {
      status: 500,
      json: {
        jobId,
        status: 'failed',
        error:
          e?.message ||
          'Missing Firebase Admin credentials / storage bucket. Set FIREBASE_SERVICE_ACCOUNT_JSON (or split vars) and FIREBASE_STORAGE_BUCKET in .env.',
      },
    };
  }

  // Resolve template image - either from predefined template or custom URL/data
  let templateImg: { base64: string; mimeType: string; buffer: Buffer };
  if (req.garmentTemplateImageUrl) {
    // Custom template provided as URL or data URL
    if (req.garmentTemplateImageUrl.startsWith('data:')) {
      // Data URL format: data:image/png;base64,xxxxx
      const matches = req.garmentTemplateImageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return { status: 400, json: { jobId, status: 'failed', error: 'Invalid garmentTemplateImageUrl data URL format' } };
      }
      const mimeType = matches[1];
      const base64 = matches[2];
      const buffer = Buffer.from(base64, 'base64');
      templateImg = { base64, mimeType, buffer };
    } else {
      // Regular URL
      if (!isAllowedRemoteImageUrl(req.garmentTemplateImageUrl)) {
        return { status: 400, json: { jobId, status: 'failed', error: 'garmentTemplateImageUrl is not allowed' } };
      }
      templateImg = await fetchImageAsBase64(req.garmentTemplateImageUrl);
    }
  } else {
    // Use predefined template
    const template = getTemplateById(req.garmentTemplateId);
    if (!template) {
      return { status: 400, json: { jobId: 'n/a', status: 'failed', error: 'Unknown garmentTemplateId' } };
    }
    templateImg = await fetchImageAsBase64(template.imageUrl);
  }

  let fabricImg: { base64: string; mimeType: string; buffer: Buffer };
  if (req.fabricImageBase64) {
    const mimeType = req.fabricMimeType || 'application/octet-stream';
    const buffer = Buffer.from(req.fabricImageBase64, 'base64');
    fabricImg = { base64: req.fabricImageBase64, mimeType, buffer };
  } else {
    const url = req.fabricImageUrl!;
    if (!isAllowedRemoteImageUrl(url)) {
      return { status: 400, json: { jobId: jobId, status: 'failed', error: 'fabricImageUrl is not allowed' } };
    }
    fabricImg = await fetchImageAsBase64(url);
  }

  // Minimal personal-photo rejection (best-effort)
  try {
    const meta = getImageMeta(fabricImg.buffer, fabricImg.mimeType);
    assertNoPersonalPhotoPolicy({ ...meta, filename: null });
  } catch (e: any) {
    const message = e?.message || 'Fabric image rejected by policy';
    return { status: 400, json: { jobId, status: 'failed', error: message } };
  }

  // Apply fabric scale deterministically (resize + tile) so the pattern size changes reliably.
  fabricImg = await applyFabricScaleAndTile(fabricImg, req.options?.fabricScale);

  // Create Firestore job doc (status: processing)
  try {
    const db = getFirestore();
    await db.collection('tryon_jobs').doc(jobId).set({
      createdAt,
      status: 'processing',
      userId: userId || null,
      garmentTemplateId: req.garmentTemplateId,
      options: req.options || {},
      source: req.fabricImageBase64 ? 'base64' : 'url',
    });
  } catch {
    // Non-fatal; still attempt generation.
  }

  try {
    // Get template dimensions to pass to prompt
    const templateMetadata = await (sharp as any)(templateImg.buffer).metadata();
    const { width: templateWidth, height: templateHeight } = orientedDimensions(templateMetadata);
    
    const promptText = buildPrompt(req, templateWidth, templateHeight);
    const out = await generateTryOnImage({
      templateBase64: templateImg.base64,
      templateMimeType: templateImg.mimeType,
      fabricBase64: fabricImg.base64,
      fabricMimeType: fabricImg.mimeType,
      promptText,
    });

    let outBuffer = Buffer.from(out.imageBase64, 'base64');

    // Resize generated image to match template dimensions
    try {
      const generatedMetadata = await (sharp as any)(outBuffer).metadata();

      const { width: generatedWidth, height: generatedHeight } = orientedDimensions(generatedMetadata);

      // Only resize if dimensions don't match
      if (templateWidth && templateHeight && 
          (generatedWidth !== templateWidth || generatedHeight !== templateHeight)) {
        console.log(`Resizing generated image from ${generatedWidth}x${generatedHeight} to ${templateWidth}x${templateHeight}`);
        outBuffer = await (sharp as any)(outBuffer)
          .rotate()
          .resize(templateWidth, templateHeight, {
            fit: 'contain', // Preserve aspect ratio - fit inside dimensions
            background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background for letterboxing
            kernel: 'lanczos3', // High-quality resampling
          })
          .png()
          .toBuffer();
      }
    } catch (resizeErr) {
      console.warn('Failed to resize generated image to match template:', resizeErr);
      // Continue with original size if resize fails
    }

    // Add watermark (logo) to the generated image
    try {
      const watermarkPath = new URL('../../public/icons/icon-512.png', import.meta.url).pathname;
      const imgMetadata = await (sharp as any)(outBuffer).metadata();
      const imgWidth = imgMetadata.width || 1024;
      const imgHeight = imgMetadata.height || 1024;
      
      // Watermark size: 15% of image width, positioned bottom-right
      const watermarkSize = Math.floor(imgWidth * 0.15);
      const margin = Math.floor(watermarkSize * 0.2);

      const watermarkBuffer = await (sharp as any)(watermarkPath)
        .resize(watermarkSize, watermarkSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      outBuffer = await (sharp as any)(outBuffer)
        .composite([
          {
            input: watermarkBuffer,
            gravity: 'southeast',
            blend: 'over',
            left: margin,
            top: margin,
          }
        ])
        .png()
        .toBuffer();
      
      console.log('Watermark applied successfully');
    } catch (watermarkErr) {
      console.warn('Failed to apply watermark:', watermarkErr);
      // Continue without watermark if it fails
    }

    // Upload to Storage
    const objectPath = `tryon_results/${jobId}.png`;
    const token = crypto.randomUUID();
    await bucket.file(objectPath).save(outBuffer, {
      contentType: 'image/png',
      resumable: false,
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    });

    const bucketName = bucket.name;
    const encodedPath = encodeURIComponent(objectPath);
    const resultUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;

    // Update Firestore
    try {
      const db = getFirestore();
      await db.collection('tryon_jobs').doc(jobId).set(
        {
          status: 'completed',
          completedAt: new Date().toISOString(),
          resultUrl,
        },
        { merge: true }
      );
    } catch {
      // ignore
    }

    return { status: 200, json: { jobId, status: 'completed', resultImageUrl: resultUrl } };
  } catch (e: any) {
    const err = e?.message || 'Try-on failed';
    const statusCode = typeof e?.statusCode === 'number' ? e.statusCode : 500;
    try {
      const db = getFirestore();
      await db.collection('tryon_jobs').doc(jobId).set(
        {
          status: 'failed',
          failedAt: new Date().toISOString(),
          error: err,
        },
        { merge: true }
      );
    } catch {
      // ignore
    }

    return { status: statusCode, json: { jobId, status: 'failed', error: err } };
  }
}
