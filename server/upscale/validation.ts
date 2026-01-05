export type UpscaleRequest = {
  imageBase64: string;
  imageMimeType?: string;
  strength?: number;
  upscale_multiplier?: number;
  style_preset?: string;
  mode?: 'creative' | 'standard';
};

export type ValidationResult = { ok: true } | { ok: false; status: number; message: string };

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;

function estimateBytesFromBase64(base64: string): number {
  // Base64 encoding is ~4/3 of bytes.
  return Math.floor((base64.length * 3) / 4);
}

export function validateUpscaleRequest(body: any): ValidationResult {
  if (!body || typeof body !== 'object') return { ok: false, status: 400, message: 'Invalid JSON body' };

  const imageBase64 = body.imageBase64;
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return { ok: false, status: 400, message: 'imageBase64 is required' };
  }

  const mimeType = typeof body.imageMimeType === 'string' ? body.imageMimeType : 'image/png';
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { ok: false, status: 400, message: 'Unsupported imageMimeType' };
  }

  const approxBytes = estimateBytesFromBase64(imageBase64);
  if (approxBytes > MAX_BYTES) {
    return { ok: false, status: 413, message: 'Image too large (max 5MB)' };
  }

  const strength = body.strength;
  if (strength != null && (typeof strength !== 'number' || Number.isNaN(strength) || strength < 0 || strength > 1)) {
    return { ok: false, status: 400, message: 'strength must be between 0 and 1' };
  }

  const mult = body.upscale_multiplier;
  if (mult != null && (typeof mult !== 'number' || Number.isNaN(mult) || mult < 1 || mult > 2)) {
    return { ok: false, status: 400, message: 'upscale_multiplier must be between 1 and 2' };
  }

  return { ok: true };
}
