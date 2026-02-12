import type { FabricSwapRequest } from './validation.js';
import { validateFabricSwapRequest } from './validation.js';
import { generateFabricSwap, generateUpscaleImage } from '../tryon/geminiClient.js';
import { applyWatermark } from '../utils/watermark.js';
import { saveGeneration } from '../services/generationsService.js';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

type HandlerContext = {
  ip: string;
  headers: Record<string, string | undefined>;
};

const counters = new Map<string, { count: number; resetAt: number }>();

function stripDataUrl(b64: string): string {
  return b64.replace(/^data:.*;base64,/, '');
}

// Normalize MIME types to supported formats
function normalizeMimeType(type: string | undefined): string {
  const normalized = (type || '').toLowerCase().trim();
  if (normalized === 'image/jpg') return 'image/jpeg';
  if (normalized === 'image/jpeg') return 'image/jpeg';
  if (normalized === 'image/png') return 'image/png';
  if (normalized === 'image/webp') return 'image/webp';
  // Default to PNG for unknown types or empty strings
  return 'image/png';
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
    .jpeg({ 
      quality: 90, 
      mozjpeg: true,
      progressive: true 
    })
    .toBuffer();

  return { imageBase64: outputBuffer.toString('base64'), mimeType: 'image/jpeg' };
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
  const dimensionText = dimensions ? `approximately ${dimensions.width}x${dimensions.height}px` : 'the same as the template';

  const basePrompt = `You are a professional fashion designer AI. Your task is to replace the clothing in the template image with the fabric/pattern provided in the second image.

REQUIREMENTS:
1. OUTPUT DIMENSIONS: Generate an output image that is ${dimensionText}. Keep the dimensions as close as possible to the template.
2. MAINTAIN THE COMPOSITION: Keep the same composition, aspect ratio, and field of view as the template image.
3. PRESERVE THE FACE: Keep the face exactly as shown in the template.
4. PRESERVE THE POSE: Maintain the exact body pose and posture from the template.
5. PRESERVE THE BACKGROUND: Keep the background and environment exactly as shown.
6. FABRIC REPLACEMENT: Replace only the clothing/garment with the new fabric pattern from the second image. The fabric should drape naturally over the body.

${req.refinementPrompt ? `Additional Instructions: ${req.refinementPrompt}` : ''}

Generate a professional, natural-looking fabric swap that maintains all the original composition and person details.`;

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
    
    // Normalize MIME types to supported formats before any API calls
    if (req.templateMimeType) {
      req.templateMimeType = normalizeMimeType(req.templateMimeType);
    }
    if (req.fabricMimeType) {
      req.fabricMimeType = normalizeMimeType(req.fabricMimeType);
    }

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
    const fabricSwapPrompt = buildFabricSwapPrompt(req, templateDims);
    console.log('[Fabric Swap] Full prompt being sent to Gemini:', fabricSwapPrompt.substring(0, 500) + '...');
    
    console.log('[Fabric Swap] Calling generateFabricSwap with:');
    console.log('  - templateBase64 length:', req.templateBase64?.length || 0);
    console.log('  - templateMimeType:', req.templateMimeType);
    console.log('  - fabricBase64 length:', req.fabricBase64?.length || 0);
    console.log('  - fabricMimeType:', req.fabricMimeType);
    console.log('  - model:', req.model === 'Pro' ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash-image');
    console.log('  - aspectRatio:', templateAspectRatio);
    
    let imageBase64: string;
    let mimeType: string;
    try {
      const result = await generateFabricSwap({
        templateBase64: req.templateBase64,
        templateMimeType: req.templateMimeType,
        fabricBase64: req.fabricBase64,
        fabricMimeType: req.fabricMimeType,
        promptText: fabricSwapPrompt,
        model: req.model === 'Pro' ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash-image', // Both use same for now
        aspectRatio: templateAspectRatio,
      });
      imageBase64 = result.imageBase64;
      mimeType = result.mimeType;
      console.log('[Fabric Swap] ✅ generateFabricSwap succeeded');
    } catch (err: any) {
      console.error('[Fabric Swap] ❌ generateFabricSwap failed:', err?.message || err);
      throw err;
    }
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
    console.log('[SHARP RESIZE] Target dimensions:', { targetWidth, targetHeight, fit: outputFit });
    
    const tForceStart = Date.now();
    try {
      const metaBefore = await sharp(Buffer.from(finalImageBase64, 'base64')).metadata().catch(() => null);
      console.log('[SHARP RESIZE] BEFORE:', metaBefore);
      
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
      
      const metaAfter = await sharp(Buffer.from(finalImageBase64, 'base64')).metadata().catch(() => null);
      console.log('[SHARP RESIZE] AFTER:', metaAfter);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (err: any) {
      console.error('[SHARP RESIZE] ❌ Failed:', err?.message || err);
      console.error('[SHARP RESIZE] Stack:', err?.stack);
      throw err;
    }
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
      console.log('[Fabric Swap] BACKGROUNDING GENERATION SAVE');
      console.log('[Fabric Swap] userId:', req.userId);
      
      const jobId = uuidv4();
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'khuyoot-app.appspot.com';
      
      // Predicted URLs so the frontend gets them immediately
      generationUrls = {
        jobId,
        fullImageUrl: `https://storage.googleapis.com/${bucketName}/generations/${req.userId}/${jobId}_result.png`,
        thumbnailUrl: `https://storage.googleapis.com/${bucketName}/generations/${req.userId}/${jobId}_thumb.webp`,
        templateUrl: req.templateMimeType ? `https://storage.googleapis.com/${bucketName}/generations/${req.userId}/${jobId}_template.${req.templateMimeType.split('/')[1] || 'png'}` : undefined,
        fabricUrl: req.fabricMimeType ? `https://storage.googleapis.com/${bucketName}/generations/${req.userId}/${jobId}_fabric.${req.fabricMimeType.split('/')[1] || 'png'}` : undefined,
      };
      
      // FIRE AND FORGET - Don't await the storage uploads before responding to user
      saveGeneration({
        jobId, // Pass our pre-generated ID
        imageBase64: finalImageBase64,
        userId: req.userId,
        model: req.model || 'NanoBana',
        templateId: req.templateId,
        fabricId: req.fabricId,
        upscaleEnabled: false,
        templateBase64: req.templateBase64,
        templateMimeType: req.templateMimeType,
        fabricBase64: req.fabricBase64,
        fabricMimeType: req.fabricMimeType,
        refinementPrompt: req.refinementPrompt,
        outputFit: req.outputFit === 'cover' ? 'cover' : 'contain',
        preserveFace: true,
        preservePose: true,
        shouldWatermark: req.shouldWatermark || false,
        processingTimeMs: tSwapMs || 0,
        originalTemplateFilename: (req as any).templateFilename,
        originalFabricFilename: (req as any).fabricFilename,
        isBackground: true, // NEW: Tell service to return URLs immediately
      }).catch(err => {
        console.error('[Background Save] ❌ FAILED:', err?.message || err);
      });
      
      console.log('[Fabric Swap] ✅ Response prepared (Save continuing in background)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (err: any) {
      console.error('[Fabric Swap] ❌ ERROR PREPARING SAVE:', err?.message || err);
    }
  } else {
    console.warn('[Fabric Swap] ⚠️ No userId provided - skipping database save');
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

