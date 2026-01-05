import type { FabricSwapRequest } from './validation.js';
import { validateFabricSwapRequest } from './validation.js';
import { generateFabricSwap, generateUpscaleImage } from '../tryon/geminiClient.js';
import { applyWatermark } from '../utils/watermark.js';
import { saveGeneration } from '../services/generationsService.js';
import sharp from 'sharp';

type HandlerContext = {
  ip: string;
  headers: Record<string, string | undefined>;
};

const counters = new Map<string, { count: number; resetAt: number }>();

function stripDataUrl(b64: string): string {
  return b64.replace(/^data:.*;base64,/, '');
}

async function getImageDimensions(base64: string): Promise<{ width: number; height: number } | null> {
  try {
    const buffer = Buffer.from(stripDataUrl(base64), 'base64');
    const meta = await sharp(buffer, { failOnError: false }).metadata();
    if (!meta.width || !meta.height) return null;
    return { width: meta.width, height: meta.height };
  } catch {
    return null;
  }
}

type SupportedAspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

function detectClosestAspectRatio(width: number, height: number): SupportedAspectRatio {
  const r = width / height;
  const targets: Array<{ ar: SupportedAspectRatio; value: number }> = [
    { ar: '1:1', value: 1 },
    { ar: '3:4', value: 3 / 4 },
    { ar: '4:3', value: 4 / 3 },
    { ar: '9:16', value: 9 / 16 },
    { ar: '16:9', value: 16 / 9 },
  ];
  let best = targets[0];
  let bestDiff = Math.abs(r - best.value);
  for (const t of targets.slice(1)) {
    const diff = Math.abs(r - t.value);
    if (diff < bestDiff) {
      best = t;
      bestDiff = diff;
    }
  }
  return best.ar;
}

function estimateBytesFromBase64(base64: string): number {
  return Math.floor((base64.length * 3) / 4);
}

async function forceImageDimensions(params: {
  imageBase64: string;
  targetWidth: number;
  targetHeight: number;
  fit: 'contain' | 'cover';
  background?: { r: number; g: number; b: number; alpha: number };
}): Promise<{ imageBase64: string; mimeType: string }> {
  const inputBuffer = Buffer.from(params.imageBase64, 'base64');

  const image = sharp(inputBuffer, { failOn: 'none' });
  const meta = await image.metadata();

  if (meta.width === params.targetWidth && meta.height === params.targetHeight) {
    // Keep original format if already exact.
    return { imageBase64: params.imageBase64, mimeType: meta.format ? `image/${meta.format}` : 'image/png' };
  }

  const outputBuffer = await image
    .resize({
      width: params.targetWidth,
      height: params.targetHeight,
      fit: params.fit,
      background: params.background ?? { r: 0, g: 0, b: 0, alpha: 0 },
      position: 'centre',
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();

  return { imageBase64: outputBuffer.toString('base64'), mimeType: 'image/png' };
}

function checkRateLimit(key: string, limitPerMinute: number) {
  const now = Date.now();
  const entry = counters.get(key);
  if (!entry || entry.resetAt < now) {
    counters.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  if (entry.count >= limitPerMinute) throw new Error('Rate limit exceeded. Please wait and try again.');
  entry.count += 1;
}

function buildFabricSwapPrompt(req: FabricSwapRequest, dimensions: { width: number; height: number } | null) {
  const dimensionText = dimensions ? `exactly ${dimensions.width}x${dimensions.height}px` : 'the same as the template';

  const basePrompt = `You are a professional fashion designer AI. Your task is to replace the clothing in the template image with the fabric/pattern provided in the second image.

CRITICAL REQUIREMENTS:
1. OUTPUT DIMENSIONS: The output image MUST be ${dimensionText}. Do not resize, crop, or modify the dimensions under any circumstances.
2. MAINTAIN THE EXACT FRAME: Keep the exact same composition, aspect ratio, and field of view as the template image. Do NOT crop, zoom, or pan the image.
3. PRESERVE THE FACE: Keep the face exactly as shown in the template. Do not alter or modify any facial features, expression, or position.
4. PRESERVE THE POSE: Maintain the exact body pose, posture, and proportions from the template. Do not change the model's position or stance.
5. PRESERVE THE BACKGROUND: Keep the background, scenery, and environment exactly as shown in the template image.
6. FABRIC REPLACEMENT: Only replace the clothing/garment with the new fabric pattern from the second image. The fabric should drape naturally over the body shape, following the contours and folds.

Model Quality: ${req.model === 'Pro' ? 'High-Definition with maximum detail preservation' : 'Fast processing with good quality'}

${req.refinementPrompt ? `Additional Instructions: ${req.refinementPrompt}` : ''}

IMPORTANT: The output image dimensions MUST be ${dimensionText}. This is non-negotiable. No cropping, zooming, or resizing allowed.`;

  return basePrompt;
}

export async function handleFabricSwap(body: any, ctx: HandlerContext): Promise<{ status: number; json: any }> {
  try {
    const validation = validateFabricSwapRequest(body);
    if (!validation.ok) {
      const v = validation as { ok: false; status: number; message: string };
      return { status: v.status, json: { error: v.message } };
    }

    checkRateLimit(`ip:${ctx.ip}`, 10);

    const req: FabricSwapRequest = body;

    const templateDims = await getImageDimensions(req.templateBase64);
    const templateAspectRatio: SupportedAspectRatio | undefined = templateDims
      ? detectClosestAspectRatio(templateDims.width, templateDims.height)
      : undefined;

    const shouldReturnDebug = process.env.NODE_ENV !== 'production' || (req as any)?.debug === true;
    const t0 = Date.now();
    let tSwapMs: number | null = null;
    let tUpscaleMs: number | null = null;
    let tForceDimsMs: number | null = null;
    let requestedOutW: number | null = null;
    let requestedOutH: number | null = null;

    console.log('[Fabric Swap] Processing with model:', req.model);
    console.log('[Fabric Swap] Refinement prompt:', req.refinementPrompt || 'None');
    if (templateDims) console.log('[Fabric Swap] Template dimensions:', templateDims);
    if (templateAspectRatio) console.log('[Fabric Swap] Template aspect ratio:', templateAspectRatio);

    // STEP 1: Fabric Swap
    const tSwapStart = Date.now();
    const { imageBase64, mimeType } = await generateFabricSwap({
    templateBase64: req.templateBase64,
    templateMimeType: req.templateMimeType,
    fabricBase64: req.fabricBase64,
    fabricMimeType: req.fabricMimeType,
    promptText: buildFabricSwapPrompt(req, templateDims),
    model: req.model === 'Pro' ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash-image', // Both use same for now
    aspectRatio: templateAspectRatio,
  });
  tSwapMs = Date.now() - tSwapStart;

  // STEP 2: Force exact output dimensions
  let finalImageBase64 = imageBase64;
  let finalMimeType = mimeType;

  // STEP 2: Force exact output dimensions (template only, no multiplier)
  if (templateDims) {
    const targetWidth = templateDims.width;
    const targetHeight = templateDims.height;

    requestedOutW = targetWidth;
    requestedOutH = targetHeight;

    // Default to contain server-side to avoid accidental cropping.
    const outputFit: 'contain' | 'cover' = req.outputFit === 'cover' ? 'cover' : 'contain';

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[SHARP RESIZE] BEFORE:', await sharp(Buffer.from(finalImageBase64, 'base64')).metadata());
    console.log('[SHARP RESIZE] TARGET:', { targetWidth, targetHeight, fit: outputFit });
    
    const tForceStart = Date.now();
    const forced = await forceImageDimensions({
      imageBase64: finalImageBase64,
      targetWidth,
      targetHeight,
      fit: outputFit,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
    tForceDimsMs = Date.now() - tForceStart;

    finalImageBase64 = forced.imageBase64;
    finalMimeType = forced.mimeType;
    
    console.log('[SHARP RESIZE] AFTER:', await sharp(Buffer.from(finalImageBase64, 'base64')).metadata());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  // STAGE D: Apply watermark if requested (Final Pass - BEFORE returning to frontend)
  if (req.shouldWatermark) {
    console.log('[Watermark] Stage D: Applying watermark...');
    const tWatermarkStart = Date.now();
    const outputBuffer = Buffer.from(finalImageBase64, 'base64');
    const watermarkedBuffer = await applyWatermark(outputBuffer, true, 'Khuyoot');
    finalImageBase64 = watermarkedBuffer.toString('base64');
    const tWatermarkMs = Date.now() - tWatermarkStart;
    console.log(`[Watermark] Applied in ${tWatermarkMs}ms`);
  }

  const templateBuffer = Buffer.from(stripDataUrl(req.templateBase64), 'base64');
  const outputBuffer = Buffer.from(finalImageBase64, 'base64');

  const [tplMeta, outMeta] = await Promise.all([
    sharp(templateBuffer, { failOnError: false }).metadata().catch(() => null),
    sharp(outputBuffer, { failOnError: false }).metadata().catch(() => null),
  ]);

  const dataUrl = `data:${finalMimeType};base64,${finalImageBase64}`;
  
  // STAGE E: Save to Firestore and Firebase Storage if userId provided
  let generationUrls: { jobId?: string; fullImageUrl?: string; thumbnailUrl?: string; templateUrl?: string; fabricUrl?: string } = {};
  if (req.userId) {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[DEBUG] [Fabric Swap] ATTEMPTING TO SAVE GENERATION');
      console.log('[DEBUG] [Fabric Swap] userId:', req.userId);
      console.log('[DEBUG] [Fabric Swap] Has templateBase64:', !!req.templateBase64);
      console.log('[DEBUG] [Fabric Swap] Has fabricBase64:', !!req.fabricBase64);
      console.log('[DEBUG] [Fabric Swap] Has finalImageBase64:', !!finalImageBase64);
      
      generationUrls = await saveGeneration({
        imageBase64: finalImageBase64,
        userId: req.userId,
        model: req.model || 'NanoBana',
        templateId: req.templateId,
        fabricId: req.fabricId,
        upscaleEnabled: false,
        // Pass template and fabric images for history comparison
        templateBase64: req.templateBase64,
        templateMimeType: req.templateMimeType,
        fabricBase64: req.fabricBase64,
        fabricMimeType: req.fabricMimeType,
        // Pass settings for enhanced metadata
        refinementPrompt: req.refinementPrompt,
        outputFit: req.outputFit === 'cover' ? 'cover' : 'contain',
        preserveFace: true,
        preservePose: true,
        shouldWatermark: req.shouldWatermark || false,
        processingTimeMs: tSwapMs || 0,
        originalTemplateFilename: req.templateFilename,
        originalFabricFilename: req.fabricFilename,
      });
      
      console.log('[DEBUG] [Fabric Swap] ✅ Generation saved successfully!');
      console.log('[DEBUG] [Fabric Swap] jobId:', generationUrls.jobId);
      console.log('[DEBUG] [Fabric Swap] fullImageUrl:', generationUrls.fullImageUrl);
      console.log('[DEBUG] [Fabric Swap] thumbnailUrl:', generationUrls.thumbnailUrl);
      console.log('[DEBUG] [Fabric Swap] templateUrl:', generationUrls.templateUrl);
      console.log('[DEBUG] [Fabric Swap] fabricUrl:', generationUrls.fabricUrl);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (err: any) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('[DEBUG] [Fabric Swap] ❌ FAILED TO SAVE GENERATION');
      console.error('[DEBUG] [Fabric Swap] Error:', err?.message || err);
      console.error('[DEBUG] [Fabric Swap] Stack:', err?.stack);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      // Don't fail the request if saving fails - still return the image
    }
  } else {
    console.warn('[DEBUG] [Fabric Swap] ⚠️ No userId provided - skipping database save');
  }

    return {
      status: 200,
      json: {
        imageDataUrl: dataUrl,
        mimeType: finalMimeType,
        jobId: generationUrls.jobId,
        fullImageUrl: generationUrls.fullImageUrl,
        thumbnailUrl: generationUrls.thumbnailUrl,
        templateUrl: generationUrls.templateUrl,
        fabricUrl: generationUrls.fabricUrl,
        debug: shouldReturnDebug
          ? {
              dimensions: {
                template: { w: tplMeta?.width ?? null, h: tplMeta?.height ?? null },
                output: { w: outMeta?.width ?? null, h: outMeta?.height ?? null },
                requested: {
                  outW: requestedOutW,
                  outH: requestedOutH,
                  fit: req.outputFit === 'cover' ? 'cover' : 'contain',
                },
              },
              timingsMs: {
                swap: tSwapMs,
                upscale: tUpscaleMs,
                forceDims: tForceDimsMs,
                total: Date.now() - t0,
              },
              template: {
                mimeType: req.templateMimeType,
                bytes: estimateBytesFromBase64(req.templateBase64),
                dimensions: templateDims,
              },
              fabric: {
                mimeType: req.fabricMimeType,
                bytes: estimateBytesFromBase64(req.fabricBase64),
              },
              output: {
                mimeType: finalMimeType,
                fit: req.outputFit === 'cover' ? 'cover' : 'contain',
                multiplier: (req as any).shouldUpscale ? Number((req as any).upscaleMultiplier || 2) : 1,
                aspectRatio: templateAspectRatio,
              },
              model: req.model,
            }
          : undefined,
      },
    };
  } catch (err: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('[Fabric Swap] ❌ ERROR IN handleFabricSwap');
    console.error('[Fabric Swap] Error message:', err?.message || err);
    console.error('[Fabric Swap] Error stack:', err?.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Return proper error response
    return {
      status: err?.statusCode || 500,
      json: { error: err?.message || 'Fabric swap failed' }
    };
  }
}

