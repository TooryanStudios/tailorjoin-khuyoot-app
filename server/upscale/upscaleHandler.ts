import type { UpscaleRequest } from './validation.js';
import { validateUpscaleRequest } from './validation.js';
import { generateUpscaleImage } from '../tryon/geminiClient.js';

type HandlerContext = {
  ip: string;
  headers: Record<string, string | undefined>;
};

// Minimal IP-based rate limiting
const counters = new Map<string, { count: number; resetAt: number }>();

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

function buildUpscalePrompt(req: UpscaleRequest) {
  const mode = req.mode || 'creative';
  const style = req.style_preset || 'General';
  const strength = typeof req.strength === 'number' ? req.strength : 0.7;
  const mult = typeof req.upscale_multiplier === 'number' ? req.upscale_multiplier : 1.5;

  return `You are an expert image upscaler and detail enhancement model.

TASK:
- Upscale the input image by approximately ${mult}x.
- Preserve identity, composition, and geometry.
- Increase fine details and clarity.
- Remove compression artifacts.

STYLE PRESET: ${style}
MODE: ${mode}
CREATIVITY STRENGTH: ${strength}

RULES:
- Do not add new objects.
- Do not change the subject.
- Keep colors consistent unless the style preset implies subtle grading.

OUTPUT:
Return a single enhanced image.`;
}

export async function handleUpscale(body: any, ctx: HandlerContext): Promise<{ status: number; json: any }> {
  const validation = validateUpscaleRequest(body);
  if (!validation.ok) {
    const v = validation as { ok: false; status: number; message: string };
    return { status: v.status, json: { error: v.message } };
  }

  checkRateLimit(`ip:${ctx.ip}`, 10);

  const req: UpscaleRequest = body;

  const { imageBase64, mimeType } = await generateUpscaleImage({
    imageBase64: req.imageBase64,
    imageMimeType: req.imageMimeType || 'image/png',
    promptText: buildUpscalePrompt(req),
  });

  const dataUrl = `data:${mimeType};base64,${imageBase64}`;
  return {
    status: 200,
    json: {
      imageDataUrl: dataUrl,
      mimeType,
    },
  };
}
