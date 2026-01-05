import { GoogleGenAI } from '@google/genai';

export type GeminiTryOnInput = {
  templateBase64: string;
  templateMimeType: string;
  fabricBase64: string;
  fabricMimeType: string;
  promptText: string;
  model?: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
};

export type GeminiTryOnOutput = {
  imageBase64: string;
  mimeType: string;
};

export type GeminiUpscaleInput = {
  imageBase64: string;
  imageMimeType: string;
  promptText: string;
  model?: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
};

type SupportedAspectRatio = NonNullable<GeminiTryOnInput['aspectRatio']>;

function withAspectRatioHint(promptText: string, aspectRatio?: SupportedAspectRatio): string {
  if (!aspectRatio) return promptText;
  return `${promptText}\n\nOUTPUT ASPECT RATIO: ${aspectRatio} (Do NOT output a square image unless the template is square).`;
}

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error('Missing GEMINI_API_KEY/GOOGLE_API_KEY on server');
  return key;
}

function isQuotaOrRateLimitError(err: unknown): boolean {
  const msg = (err as any)?.message ? String((err as any).message) : String(err);
  return msg.includes('too_many_requests') || msg.includes('429') || msg.includes('quota');
}

function isRetryableGeminiError(err: unknown): boolean {
  const msg = (err as any)?.message ? String((err as any).message) : String(err);
  // Best-effort: treat rate-limit/quota and transient upstream errors as retryable.
  return isQuotaOrRateLimitError(err) || msg.includes('503') || msg.includes('UNAVAILABLE');
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateTryOnImage(input: GeminiTryOnInput): Promise<GeminiTryOnOutput> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  // Use model from input, env var, or default to Nano Banana
  const model = input.model || process.env.TRYON_GEMINI_MODEL || 'gemini-2.5-flash-image';
  
  console.log(`[Gemini] Using model: ${model}`);
  console.log(`[Gemini] Nano Banana enabled: ${model === 'gemini-2.5-flash-image' ? 'YES ✓' : 'NO (using: ' + model + ')'}`);

  // Retry a few times for transient errors. Quota issues likely won't recover,
  // but this helps when 429 is a temporary rate limit.
  const delays = [400, 900, 1800];
  let lastErr: unknown;
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      // Nano Banana accepts both image and text for image-to-image transformation
      // We pass BOTH images:
      // - Image 1: template (the garment/person photo to be edited)
      // - Image 2: fabric (the texture/pattern reference)
      const templateSizeKb = (input.templateBase64.length / 1024).toFixed(1);
      const fabricSizeKb = (input.fabricBase64.length / 1024).toFixed(1);
      console.log('[Gemini] Input parts:', {
        text: true,
        images: 2,
        templateMimeType: input.templateMimeType,
        templateSizeKb: `${templateSizeKb} KB`,
        fabricMimeType: input.fabricMimeType,
        fabricSizeKb: `${fabricSizeKb} KB`,
      });
      // 🎯 CRITICAL: Order matters for aspect ratio!
      // Gemini uses the LAST image as the dimensional reference.
      // Send fabric first, template LAST to force portrait ratio.
      const interaction = await ai.interactions.create({
        model,
        input: [
          { type: 'image', data: input.fabricBase64, mime_type: input.fabricMimeType },
          { type: 'image', data: input.templateBase64, mime_type: input.templateMimeType },
          { type: 'text', text: withAspectRatioHint(input.promptText, input.aspectRatio) + '\n\nUse the aspect ratio and dimensions of the LAST uploaded image (the template). Do NOT output a square image.' },
        ],
        response_modalities: ['image'],
      });

      const outputs: any[] = (interaction as any).outputs || [];
      const img: any = outputs.find((o) => o?.type === 'image' && o?.data);
      if (!img) throw new Error('Gemini did not return an image output');

      console.log(`[Gemini] Image generation successful with ${model}`);
      return { imageBase64: String(img.data), mimeType: String(img.mime_type || 'image/png') };
    } catch (err: any) {
      lastErr = err;
      if (attempt < delays.length && isRetryableGeminiError(err)) {
        console.log(`[Gemini] Retrying (attempt ${attempt + 1}/${delays.length})...`);
        await sleep(delays[attempt]);
        continue;
      }

      if (isQuotaOrRateLimitError(err)) {
        const e: any = new Error('Nano Banana quota/rate limit exceeded. Please try again later, or use an API key with sufficient quota/billing.');
        e.statusCode = 429;
        throw e;
      }

      throw err;
    }
  }

  throw lastErr;
}

export async function generateUpscaleImage(input: GeminiUpscaleInput): Promise<GeminiTryOnOutput> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const model = input.model || process.env.UPSCALE_GEMINI_MODEL || process.env.TRYON_GEMINI_MODEL || 'gemini-2.5-flash-image';
  console.log(`[Gemini] Upscale using model: ${model}`);

  const delays = [400, 900, 1800];
  let lastErr: unknown;
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      const imageSizeKb = (input.imageBase64.length / 1024).toFixed(1);
      console.log('[Gemini] Upscale input parts:', {
        text: true,
        images: 1,
        imageMimeType: input.imageMimeType,
        imageSizeKb: `${imageSizeKb} KB`,
      });

      const interaction = await ai.interactions.create({
        model,
        input: [
          { type: 'text', text: withAspectRatioHint(input.promptText, input.aspectRatio) },
          { type: 'image', data: input.imageBase64, mime_type: input.imageMimeType },
        ],
        response_modalities: ['image'],
      });

      const outputs: any[] = (interaction as any).outputs || [];
      const img: any = outputs.find((o) => o?.type === 'image' && o?.data);
      if (!img) throw new Error('Gemini did not return an image output');

      return { imageBase64: String(img.data), mimeType: String(img.mime_type || 'image/png') };
    } catch (err: any) {
      lastErr = err;
      if (attempt < delays.length && isRetryableGeminiError(err)) {
        console.log(`[Gemini] Upscale retrying (attempt ${attempt + 1}/${delays.length})...`);
        await sleep(delays[attempt]);
        continue;
      }

      if (isQuotaOrRateLimitError(err)) {
        const e: any = new Error('Gemini quota/rate limit exceeded. Please try again later, or use an API key with sufficient quota/billing.');
        e.statusCode = 429;
        throw e;
      }

      throw err;
    }
  }

  throw lastErr;
}

export async function generateFabricSwap(input: {
  templateBase64: string;
  templateMimeType: string;
  fabricBase64: string;
  fabricMimeType: string;
  promptText: string;
  model?: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
  aspectRatio?: SupportedAspectRatio;
}): Promise<GeminiTryOnOutput> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const model = input.model || process.env.FABRIC_SWAP_GEMINI_MODEL || 'gemini-2.5-flash-image';
  console.log(`[Gemini] Fabric Swap using model: ${model}`);

  const delays = [400, 900, 1800];
  let lastErr: unknown;
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      const templateSizeKb = (input.templateBase64.length / 1024).toFixed(1);
      const fabricSizeKb = (input.fabricBase64.length / 1024).toFixed(1);
      console.log('[Gemini] Fabric Swap input parts:', {
        text: true,
        images: 2,
        templateMimeType: input.templateMimeType,
        templateSizeKb: `${templateSizeKb} KB`,
        fabricMimeType: input.fabricMimeType,
        fabricSizeKb: `${fabricSizeKb} KB`,
      });

      // 🎯 CRITICAL: Order matters for aspect ratio!
      // Gemini uses the LAST image as the dimensional reference.
      // Send fabric first, template LAST to force portrait ratio.
      const interaction = await ai.interactions.create({
        model,
        input: [
          { type: 'image', data: input.fabricBase64, mime_type: input.fabricMimeType },
          { type: 'image', data: input.templateBase64, mime_type: input.templateMimeType },
          { type: 'text', text: withAspectRatioHint(input.promptText, input.aspectRatio) + '\n\nUse the aspect ratio and dimensions of the LAST uploaded image (the template). Do NOT output a square image.' },
        ],
        response_modalities: ['image'],
      });

      const outputs: any[] = (interaction as any).outputs || [];
      const img: any = outputs.find((o) => o?.type === 'image' && o?.data);
      if (!img) throw new Error('Gemini did not return an image output for fabric swap');

      console.log(`[Gemini] Fabric Swap successful with ${model}`);
      return { imageBase64: String(img.data), mimeType: String(img.mime_type || 'image/png') };
    } catch (err: any) {
      lastErr = err;
      if (attempt < delays.length && isRetryableGeminiError(err)) {
        console.log(`[Gemini] Fabric Swap retrying (attempt ${attempt + 1}/${delays.length})...`);
        await sleep(delays[attempt]);
        continue;
      }

      if (isQuotaOrRateLimitError(err)) {
        const e: any = new Error('Gemini quota/rate limit exceeded. Please try again later.');
        e.statusCode = 429;
        throw e;
      }

      throw err;
    }
  }

  throw lastErr;
}
