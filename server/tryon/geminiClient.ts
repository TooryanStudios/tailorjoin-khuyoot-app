import { GoogleGenAI } from '@google/genai';

export type GeminiTryOnInput = {
  templateBase64: string;
  templateMimeType: string;
  fabricBase64: string;
  fabricMimeType: string;
  promptText: string;
};

export type GeminiTryOnOutput = {
  imageBase64: string;
  mimeType: string;
};

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

  const model = process.env.TRYON_GEMINI_MODEL || 'gemini-3-pro-image-preview';

  // Retry a few times for transient errors. Quota issues likely won't recover,
  // but this helps when 429 is a temporary rate limit.
  const delays = [400, 900, 1800];
  let lastErr: unknown;
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      // Interactions API supports multimodal output.
      const interaction = await ai.interactions.create({
        model,
        input: [
          { type: 'text', text: input.promptText },
          { type: 'image', data: input.templateBase64, mime_type: input.templateMimeType },
          { type: 'image', data: input.fabricBase64, mime_type: input.fabricMimeType },
        ],
        response_modalities: ['image'],
      });

      const outputs: any[] = (interaction as any).outputs || [];
      const img: any = outputs.find((o) => o?.type === 'image' && o?.data);
      if (!img) {
        throw new Error('Gemini did not return an image output');
      }

      return { imageBase64: String(img.data), mimeType: String(img.mime_type || 'image/png') };
    } catch (err: any) {
      lastErr = err;
      if (attempt < delays.length && isRetryableGeminiError(err)) {
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
