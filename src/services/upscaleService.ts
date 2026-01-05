import { firebaseService } from '../../services/firebase';

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
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  try {
    const auth = firebaseService.auth;
    const currentUser = auth?.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Auth optional.
  }

  const res = await fetch('/api/upscale', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data: any = await res.json().catch(() => null);
      const message = data && (data.error || data.message) ? (data.error || data.message) : '';
      throw new Error(message || `Upscale request failed (${res.status})`);
    }

    const text = await res.text().catch(() => '');
    throw new Error(text || `Upscale request failed (${res.status})`);
  }

  return (await res.json()) as UpscaleResponse;
}
