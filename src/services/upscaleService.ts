import { apiFetch } from '../api/apiFetch';
import { ApiError } from '../api/httpErrors';

export type UpscaleMode = 'creative' | 'standard';

export type UpscaleRequest = {
  imageBase64: string;
  imageMimeType: string;
  strength: number; // 0..1
  upscale_multiplier: number; // 1..2
  style_preset: string;
  mode: UpscaleMode;
};

export type UpscaleResponse = {
  imageDataUrl: string;
  mimeType: string;
};

export async function generateUpscale(payload: UpscaleRequest): Promise<UpscaleResponse> {
  try {
    const res = await apiFetch('/api/upscale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      requireAuth: true,
    });

    return (await res.json()) as UpscaleResponse;
  } catch (e) {
    if (e instanceof ApiError) {
      throw new Error(e.message || 'Upscale request failed');
    }
    throw e;
  }
}
