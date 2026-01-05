import sharp from 'sharp';
import { applyWatermark } from '../utils/watermark.js';

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

function checkRateLimit(key: string, maxPerMinute: number) {
  const now = Date.now();
  const record = counters.get(key);
  if (!record) {
    counters.set(key, { count: 1, resetAt: now + 60000 });
    return;
  }
  if (now > record.resetAt) {
    counters.set(key, { count: 1, resetAt: now + 60000 });
    return;
  }
  record.count++;
  if (record.count > maxPerMinute) {
    throw Object.assign(new Error('Rate limit exceeded: max 10 requests per minute'), { statusCode: 429 });
  }
}

async function forceImageDimensions(opts: {
  imageBase64: string;
  targetWidth: number;
  targetHeight: number;
  fit: 'contain' | 'cover';
  background?: { r: number; g: number; b: number; alpha?: number };
}): Promise<{ imageBase64: string; mimeType: string }> {
  const buffer = Buffer.from(stripDataUrl(opts.imageBase64), 'base64');
  const meta = await sharp(buffer, { failOnError: false }).metadata();
  
  if (!meta.width || !meta.height) {
    throw new Error('Invalid image or cannot determine dimensions');
  }

  const currentAR = meta.width / meta.height;
  const targetAR = opts.targetWidth / opts.targetHeight;
  const bg = opts.background || { r: 0, g: 0, b: 0, alpha: 0 };

  let resized: sharp.Sharp;
  if (opts.fit === 'contain') {
    resized = sharp(buffer, { failOnError: false })
      .resize(opts.targetWidth, opts.targetHeight, {
        fit: 'contain',
        background: bg,
        withoutEnlargement: false,
      });
  } else {
    // 'cover' mode: crop to fill
    resized = sharp(buffer, { failOnError: false })
      .resize(opts.targetWidth, opts.targetHeight, {
        fit: 'cover',
        withoutEnlargement: false,
      });
  }

  const png = await resized.png().toBuffer();
  return {
    imageBase64: png.toString('base64'),
    mimeType: 'image/png',
  };
}

export async function handleImageUpscale(body: any, ctx: HandlerContext): Promise<{ status: number; json: any }> {
  // Validate required fields
  if (!body.imageBase64 || typeof body.imageBase64 !== 'string') {
    return { 
      status: 400, 
      json: { error: 'Missing or invalid imageBase64' } 
    };
  }

  if (!body.imageMimeType || typeof body.imageMimeType !== 'string') {
    return { 
      status: 400, 
      json: { error: 'Missing or invalid imageMimeType' } 
    };
  }

  checkRateLimit(`ip:${ctx.ip}`, 10);

  const shouldReturnDebug = process.env.NODE_ENV !== 'production' || body?.debug === true;
  const t0 = Date.now();
  let tForceDimsMs: number | null = null;
  let requestedOutW: number | null = null;
  let requestedOutH: number | null = null;

  try {
    console.log('[Image Upscale] Starting upscale process...');
    
    const inputDims = await getImageDimensions(body.imageBase64);
    console.log('[Image Upscale] Input dimensions:', inputDims);

    const upscaleEngine = body.upscaleEngine || 'standard';
    const upscaleMultiplier = Math.max(1, Number(body.upscaleMultiplier || 2));
    const outputFit = body.outputFit === 'cover' ? 'cover' : 'contain';

    let finalImageBase64 = body.imageBase64;
    let finalMimeType = body.imageMimeType;

    // STEP 1: Sharp upscaling (using bicubic interpolation for best quality)
    if (inputDims) {
      const targetWidth = Math.round(inputDims.width * upscaleMultiplier);
      const targetHeight = Math.round(inputDims.height * upscaleMultiplier);

      requestedOutW = targetWidth;
      requestedOutH = targetHeight;

      console.log('[Image Upscale] Upscaling:', {
        from: `${inputDims.width}x${inputDims.height}`,
        to: `${targetWidth}x${targetHeight}`,
        multiplier: upscaleMultiplier,
        engine: upscaleEngine,
      });

      const tUpscaleStart = Date.now();

      // Use bicubic interpolation for best quality upscaling
      const buffer = Buffer.from(stripDataUrl(body.imageBase64), 'base64');
      const upscaled = await sharp(buffer, { failOnError: false })
        .resize(targetWidth, targetHeight, {
          kernel: upscaleEngine === 'creative' ? 'lanczos3' : 'cubic',
          withoutEnlargement: false,
        })
        .png()
        .toBuffer();

      finalImageBase64 = upscaled.toString('base64');
      finalMimeType = 'image/png';
      tForceDimsMs = Date.now() - tUpscaleStart;

      console.log(`[Image Upscale] Upscaling complete in ${tForceDimsMs}ms`);
    }

    // STEP 2: Apply watermark if requested
    if (body.shouldWatermark) {
      console.log('[Watermark] Applying watermark to upscaled image...');
      const tWatermarkStart = Date.now();
      const outputBuffer = Buffer.from(finalImageBase64, 'base64');
      const watermarkedBuffer = await applyWatermark(outputBuffer, true, 'Khuyoot');
      finalImageBase64 = watermarkedBuffer.toString('base64');
      const tWatermarkMs = Date.now() - tWatermarkStart;
      console.log(`[Watermark] Applied in ${tWatermarkMs}ms`);
    }

    const totalMs = Date.now() - t0;

    const response: any = {
      imageDataUrl: `data:${finalMimeType};base64,${finalImageBase64}`,
      mimeType: finalMimeType,
      success: true,
    };

    if (shouldReturnDebug) {
      response.debug = {
        timing: {
          upscaleMs: tForceDimsMs,
          totalMs,
        },
        dimensions: {
          input: inputDims,
          requested: {
            outW: requestedOutW,
            outH: requestedOutH,
            multiplier: upscaleMultiplier,
          },
        },
        settings: {
          upscaleEngine,
          shouldWatermark: body.shouldWatermark,
        },
      };
    }

    console.log(`[Image Upscale] Complete in ${totalMs}ms`);
    return { status: 200, json: response };

  } catch (e: any) {
    console.error('[Image Upscale] Error:', e);
    return {
      status: 500,
      json: { error: e?.message || 'Upscaling failed' },
    };
  }
}
