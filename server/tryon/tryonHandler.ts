import crypto from 'node:crypto';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TryOnRequest, TryOnResponse } from '../../src/types/tryon';
import { getTemplateById } from './templates.js';
import { assertNoPersonalPhotoPolicy, isAllowedRemoteImageUrl, validateTryOnRequest } from './validation.js';
import { generateTryOnImage } from './geminiClient.js';
import { getFirestore, getStorageBucket, verifyFirebaseIdToken } from './firebaseAdmin.js';
import { getImageMeta } from './imageMeta.js';

async function resolveWatermarkPath(): Promise<string> {
  const candidates = [
    path.resolve(process.cwd(), 'public', 'icons', 'icon-512.png'),
    fileURLToPath(new URL('../../public/icons/icon-512.png', import.meta.url)),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // try next
    }
  }

  throw new Error(`Watermark asset not found. Tried: ${candidates.join(', ')}`);
}

type SharpFn = any;
let sharpFnPromise: Promise<SharpFn | null> | null = null;

async function getSharpFn(): Promise<SharpFn | null> {
  if (sharpFnPromise) return sharpFnPromise;

  sharpFnPromise = import('sharp')
    .then((mod: any) => (mod?.default ? mod.default : mod))
    .catch((e: any) => {
      // On some serverless environments, Sharp native binaries may be unavailable.
      // We must not crash the function; fall back to "no-sharp" mode.
      console.warn('Sharp failed to load; continuing without Sharp features (resize/tiling/watermark):', e);
      return null;
    });

  return sharpFnPromise;
}

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

function orientedDimensions(meta: { width?: number; height?: number; orientation?: number }): { width?: number; height?: number } {
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
  const colorPreservation = req.options?.colorPreservation || 'high';

  const dimensionGuidance = templateWidth && templateHeight 
    ? `Output dimensions MUST be ${templateWidth}x${templateHeight} pixels.`
    : ``;

  return `You are an expert fabric texture replacement specialist using Nano Banana (Gemini 2.5 Flash Image).

INPUTS:
- Image 1 (Template/Subject): The garment photo showing the person, pose, and original garment structure
- Image 2 (Fabric Reference): The fabric texture/pattern to apply to the garment

TASK: Replace the garment's fabric in Image 1 with the texture from Image 2. Make the replacement look photorealistic, as if the garment was originally made from the fabric shown in Image 2.

CRITICAL RULES - USE IMAGE 1 FOR:
1. Output dimensions and aspect ratio (MUST match Image 1 exactly)
2. Person, pose, face, and body (keep EXACTLY the same)
3. Garment shape, cut, draping, and wrinkles (preserve structure)
4. Shadows, highlights, and lighting (keep perfectly intact)
5. All original details: seams, stitching, buttons, zippers, collars, cuffs

CRITICAL RULES - USE IMAGE 2 FOR:
6. ONLY the fabric texture/pattern/color to apply to the garment surface
7. Map this texture naturally onto the garment's folds and shadows

FABRIC TRANSFORMATION OPTIONS:
- Scale/thickness: ${scale > 1 ? 'Make pattern larger and bolder' : scale < 1 ? 'Make pattern smaller and finer' : 'Keep pattern at normal scale'}
- Neck style: ${neck === 'modify' ? 'Adjust neckline if needed' : 'Keep neckline exactly as-is'}
- Sleeve style: ${sleeve === 'modify' ? 'Adjust sleeves if needed' : 'Keep sleeves exactly as-is'}
- Color preservation: ${colorPreservation === 'high' ? 'Maintain original garment colors' : colorPreservation === 'medium' ? 'Allow slight color shifts' : 'Allow significant color variation'}

${dimensionGuidance}

OUTPUT: A single photorealistic image matching Image 1's dimensions and structure, where only the fabric texture has been replaced with the pattern from Image 2.`;
}


function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function medianChannel(values: number[]): number {
  if (values.length === 0) return 255;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

function looksLikeSkinPixel(r: number, g: number, b: number): boolean {
  // Conservative, best-effort skin-tone heuristic (YCbCr + RGB constraints).
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (r < 60 || g < 30 || b < 20) return false;
  if (max - min < 15) return false;
  if (Math.abs(r - g) < 10) return false;
  if (!(r > g && r > b)) return false;

  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173;
}

async function compositePreservingTemplateBackground(params: {
  sharp: any;
  templatePng: Buffer;
  generatedPng: Buffer;
  width: number;
  height: number;
}): Promise<Buffer> {
  const { sharp, templatePng, generatedPng, width, height } = params;

  // Build a best-effort foreground mask from the template by flood-filling "background" from borders.
  // Then composite generated over template only in foreground areas (excluding skin-tone pixels).
  const MASK_W = 256;
  const scale = Math.min(1, MASK_W / Math.max(width, height));
  const w = Math.max(32, Math.round(width * scale));
  const h = Math.max(32, Math.round(height * scale));

  const tplRaw = await sharp(templatePng)
    .resize(w, h, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const data: Buffer = tplRaw.data;
  const stride = w * 3;

  // Collect border pixels to estimate background color (median is robust to outliers).
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  for (let x = 0; x < w; x++) {
    const top = x * 3;
    const bot = (h - 1) * stride + x * 3;
    rs.push(data[top], data[bot]);
    gs.push(data[top + 1], data[bot + 1]);
    bs.push(data[top + 2], data[bot + 2]);
  }
  for (let y = 0; y < h; y++) {
    const left = y * stride;
    const right = y * stride + (w - 1) * 3;
    rs.push(data[left], data[right]);
    gs.push(data[left + 1], data[right + 1]);
    bs.push(data[left + 2], data[right + 2]);
  }
  const bgR = medianChannel(rs);
  const bgG = medianChannel(gs);
  const bgB = medianChannel(bs);

  const bgVisited = new Uint8Array(w * h);
  const isBg = new Uint8Array(w * h);

  const TH = 34; // color distance threshold (max-channel distance)
  const idxOf = (x: number, y: number) => y * w + x;
  const pushIfBg = (x: number, y: number, q: number[]) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = idxOf(x, y);
    if (bgVisited[idx]) return;
    bgVisited[idx] = 1;
    const p = (y * w + x) * 3;
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const dist = Math.max(Math.abs(r - bgR), Math.abs(g - bgG), Math.abs(b - bgB));
    if (dist <= TH) {
      isBg[idx] = 1;
      q.push(x, y);
    }
  };

  const q: number[] = [];
  for (let x = 0; x < w; x++) {
    pushIfBg(x, 0, q);
    pushIfBg(x, h - 1, q);
  }
  for (let y = 0; y < h; y++) {
    pushIfBg(0, y, q);
    pushIfBg(w - 1, y, q);
  }

  // BFS flood fill
  while (q.length) {
    const y = q.pop() as number;
    const x = q.pop() as number;
    pushIfBg(x + 1, y, q);
    pushIfBg(x - 1, y, q);
    pushIfBg(x, y + 1, q);
    pushIfBg(x, y - 1, q);
  }

  // Build alpha mask: foreground (not background) = 255.
  // Exclude skin-like pixels to avoid painting faces/hands when templates include models.
  const maskA = Buffer.alloc(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = idxOf(x, y);
      const p = (y * w + x) * 3;
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      const fg = isBg[idx] ? 0 : 255;
      const skin = looksLikeSkinPixel(r, g, b);
      maskA[idx] = fg && !skin ? 255 : 0;
    }
  }

  // Convert to RGBA mask image where alpha=maskA
  const maskRgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    maskRgba[o] = 255;
    maskRgba[o + 1] = 255;
    maskRgba[o + 2] = 255;
    maskRgba[o + 3] = maskA[i];
  }

  const maskPng = await sharp(maskRgba, { raw: { width: w, height: h, channels: 4 } })
    .resize(width, height, { fit: 'fill', kernel: 'nearest' })
    .blur(1)
    .png()
    .toBuffer();

  const genMasked = await sharp(generatedPng)
    .ensureAlpha()
    .composite([{ input: maskPng, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return await sharp(templatePng)
    .ensureAlpha()
    .composite([{ input: genMasked, blend: 'over' }])
    .png()
    .toBuffer();
}

async function applyFabricScaleAndTile(
  fabricImg: { base64: string; mimeType: string; buffer: Buffer },
  fabricScale: number | undefined,
): Promise<{ base64: string; mimeType: string; buffer: Buffer }> {
  // Skip tiling on Vercel if Sharp fails to load (serverless environment limitations)
  // Fabric scale will still be passed in prompt for AI to interpret
  const scale = typeof fabricScale === 'number' ? fabricScale : 1;
  if (!Number.isFinite(scale) || scale === 1) return fabricImg;

  // Deterministic scale: physically resize and tile the fabric swatch before sending to the model.
  // This avoids relying on prompt-following for pattern scale.
  const CANVAS_SIZE = 1024;
  const MIN_TILE = 96;
  const MAX_TILE = 1024;

  try {
    const sharp = await getSharpFn();
    if (!sharp) {
      console.warn('Sharp not available in this environment; skipping fabric tiling');
      return fabricImg;
    }

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
  const serverStartTime = Date.now(); // Track server processing start time
  
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

  // Storage is optional:
  // - If configured, we upload and return a stable `resultImageUrl`.
  // - If not configured (common on preview/dev deployments), we return `resultImageDataUrl`.
  let bucket: ReturnType<typeof getStorageBucket> | null = null;
  try {
    bucket = getStorageBucket();
  } catch (e: any) {
    console.warn('Firebase Storage not configured; will return resultImageDataUrl instead of uploading:', e?.message || e);
    bucket = null;
  }

  // Resolve template image - either from predefined template, custom URL/data, or base64
  let templateImg: { base64: string; mimeType: string; buffer: Buffer };
  if (req.garmentTemplateImageBase64) {
    // Custom template provided as base64
    const mimeType = req.garmentTemplateMimeType || 'application/octet-stream';
    const buffer = Buffer.from(req.garmentTemplateImageBase64, 'base64');
    templateImg = { base64: req.garmentTemplateImageBase64, mimeType, buffer };
  } else if (req.garmentTemplateImageUrl) {
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
    const template = await getTemplateById(req.garmentTemplateId);
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
    // Use client-provided dimensions if available, otherwise extract from image
    let templateWidth = req.garmentTemplateWidth;
    let templateHeight = req.garmentTemplateHeight;

    if (!templateWidth || !templateHeight) {
      // Fallback: Get template dimensions from image (best-effort; depends on Sharp availability)
      console.log('[TryOn] No client dimensions provided, extracting from image buffer...');
      const sharp = await getSharpFn();
      const templateMetadata = sharp ? await (sharp as any)(templateImg.buffer).metadata() : null;
      const oriented = orientedDimensions(templateMetadata || {});
      templateWidth = oriented.width;
      templateHeight = oriented.height;
    }

    console.log('[TryOn] Using template dimensions:', { width: templateWidth, height: templateHeight, source: req.garmentTemplateWidth ? 'client' : 'extracted' });
    
    // Build prompt - use custom prompt if provided, otherwise use default
    const promptText = req.options?.customPrompt && req.options.customPrompt.trim()
      ? req.options.customPrompt
      : buildPrompt(req, templateWidth, templateHeight);
    
    const out = await generateTryOnImage({
      templateBase64: templateImg.base64,
      templateMimeType: templateImg.mimeType,
      fabricBase64: fabricImg.base64,
      fabricMimeType: fabricImg.mimeType,
      promptText,
      model: req.options?.model,
    });

    let outBuffer = Buffer.from(out.imageBase64, 'base64');

    // Resize generated image to match template dimensions
    try {
      const sharp = await getSharpFn();
      if (sharp && templateWidth && templateHeight) {
        const generatedMetadata = await (sharp as any)(outBuffer).metadata();
        const { width: generatedWidth, height: generatedHeight } = orientedDimensions(generatedMetadata);

        // Only resize if dimensions don't match
        if (generatedWidth !== templateWidth || generatedHeight !== templateHeight) {
          console.log(`[TryOn] Resizing generated image from ${generatedWidth}x${generatedHeight} to ${templateWidth}x${templateHeight}`);
          outBuffer = await (sharp as any)(outBuffer)
            .rotate()
            .resize(templateWidth, templateHeight, {
              fit: 'inside',
              kernel: 'lanczos3',
            })
            .png({ quality: 100, compressionLevel: 6 })
            .toBuffer();
          console.log('[TryOn] Resize complete');
        } else {
          console.log('[TryOn] Generated image dimensions already match template, no resize needed');
        }
      }
    } catch (resizeErr) {
      console.warn('[TryOn] Failed to resize generated image to match template:', resizeErr);
      // Continue with original size if resize fails
    }

    // Add watermark (logo + timing info) to the generated image (if enabled)
    try {
      const shouldAddWatermark = req.options?.watermarkEnabled !== false;
      const sharp = await getSharpFn();
      if (sharp && shouldAddWatermark) {
        const watermarkPath = await resolveWatermarkPath();

        const imgMetadata = await (sharp as any)(outBuffer).metadata();
        const imgWidth = imgMetadata.width || 1024;
        const imgHeight = imgMetadata.height || 1024;
        
        // Watermark size: 15% of image width, positioned bottom-right
        const watermarkSize = Math.floor(imgWidth * 0.15);
        const margin = Math.floor(watermarkSize * 0.2);

        const left = Math.max(0, imgWidth - watermarkSize - margin);
        const top = Math.max(0, imgHeight - watermarkSize - margin);

        const watermarkBuffer = await (sharp as any)(watermarkPath)
          .resize(watermarkSize, watermarkSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();

        // Prepare timing and model text overlay
        const composites: any[] = [
          {
            input: watermarkBuffer,
            blend: 'over',
            left,
            top,
          }
        ];

        // Calculate timing info
        const serverEndTime = Date.now();
        const serverProcessingTime = ((serverEndTime - serverStartTime) / 1000).toFixed(1);
        
        // Use client-side timing if available, otherwise use server timing
        let startTime: Date;
        let endTime: Date;
        let totalSeconds: string;
        
        if (req.options?.generationStartTime) {
          startTime = new Date(req.options.generationStartTime);
          endTime = req.options.generationEndTime 
            ? new Date(req.options.generationEndTime)
            : new Date(serverEndTime);
          const duration = req.options.generationEndTime 
            ? req.options.generationEndTime - req.options.generationStartTime
            : serverEndTime - req.options.generationStartTime;
          totalSeconds = (duration / 1000).toFixed(1);
        } else {
          // Fallback to server timing
          startTime = new Date(serverStartTime);
          endTime = new Date(serverEndTime);
          totalSeconds = serverProcessingTime;
        }
        
        const modelName = req.options?.model === 'gemini-3-pro-image-preview' ? 'Pro Image' : 'Nano Banana';
        
        const fontSize = Math.max(12, Math.floor(imgWidth * 0.015));
        const textLines = [
          `Model: ${modelName}`,
          `Start: ${startTime.toLocaleTimeString()}`,
          `End: ${endTime.toLocaleTimeString()}`,
          `Time: ${totalSeconds}s`,
        ];

        // Create text overlay using SVG
        const textSvg = `
          <svg width="${imgWidth}" height="${imgHeight}">
            <style>
              .timing-text { 
                fill: white; 
                font-family: Arial, sans-serif; 
                font-size: ${fontSize}px; 
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
              }
            </style>
            ${textLines.map((line, i) => 
              `<text x="${margin}" y="${margin + (fontSize + 4) * (i + 1)}" class="timing-text">${line}</text>`
            ).join('')}
          </svg>
        `;

        composites.push({
          input: Buffer.from(textSvg),
          blend: 'over',
          top: 0,
          left: 0,
        });

        outBuffer = await (sharp as any)(outBuffer)
          .composite(composites)
          .png()
          .toBuffer();
        
        console.log('[Watermark] Applied successfully with timing info (enabled in options)');
      } else if (!shouldAddWatermark) {
        console.log('[Watermark] Skipped (disabled in options)');
      } else {
        console.warn('[Watermark] Sharp not available; skipping watermark');
      }
    } catch (watermarkErr) {
      console.warn('[Watermark] Failed to apply watermark:', watermarkErr);
      // Continue without watermark if it fails
    }

    // Best-effort: preserve the original template background so patterns don't "bleed" everywhere.
    // This mitigates the common failure case where the model tiles the fabric across the entire canvas.
    const shouldApplyMask = req.options?.applyMask !== false;
    if (shouldApplyMask) {
      try {
        const sharp = await getSharpFn();
        if (sharp && templateWidth && templateHeight) {
          const templatePng = await (sharp as any)(templateImg.buffer).rotate().resize(templateWidth, templateHeight, { fit: 'fill' }).png().toBuffer();
          const generatedPng = await (sharp as any)(outBuffer).rotate().resize(templateWidth, templateHeight, { fit: 'fill' }).png().toBuffer();
          outBuffer = await compositePreservingTemplateBackground({
            sharp,
            templatePng,
            generatedPng,
            width: templateWidth,
            height: templateHeight,
          });
        }
      } catch (e) {
        console.warn('Failed to post-process try-on output with background-preserving composite:', e);
      }
    } else {
      console.log('applyMask=false; skipping background-preserving composite');
    }

    if (bucket) {
      // Upload to Storage
      const objectPath = `khuyoot_ai_result/${jobId}.png`;
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

      // Also upload a lightweight thumbnail for gallery views.
      let thumbnailUrl: string | undefined;
      try {
        const sharp = await getSharpFn();
        if (sharp) {
          const thumbBuffer = await (sharp as any)(outBuffer)
            .rotate()
            .resize(240, 320, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 78, mozjpeg: true })
            .toBuffer();

          const thumbPath = `khuyoot_ai_result/thumbs/${jobId}.jpg`;
          const thumbToken = crypto.randomUUID();
          await bucket.file(thumbPath).save(thumbBuffer, {
            contentType: 'image/jpeg',
            resumable: false,
            metadata: {
              metadata: {
                firebaseStorageDownloadTokens: thumbToken,
              },
            },
          });
          const encodedThumb = encodeURIComponent(thumbPath);
          thumbnailUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedThumb}?alt=media&token=${thumbToken}`;
        }
      } catch (e) {
        console.warn('Failed to generate/upload thumbnail; continuing without it:', e);
      }

      // Update Firestore
      try {
        const db = getFirestore();
        await db.collection('tryon_jobs').doc(jobId).set(
          {
            status: 'completed',
            completedAt: new Date().toISOString(),
            resultUrl,
            thumbnailUrl: thumbnailUrl || null,
          },
          { merge: true }
        );
      } catch {
        // ignore
      }

      return { status: 200, json: { jobId, status: 'completed', resultImageUrl: resultUrl, resultThumbnailUrl: thumbnailUrl } };
    }

    // No Firebase Storage: return inline data URL
    const resultImageDataUrl = `data:image/png;base64,${outBuffer.toString('base64')}`;
    return { status: 200, json: { jobId, status: 'completed', resultImageDataUrl } };
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
