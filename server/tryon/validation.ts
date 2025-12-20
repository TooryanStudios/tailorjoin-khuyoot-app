import type { TryOnRequest } from '../../src/types/tryon';

export type ValidationResult = { ok: true } | { ok: false; status: number; message: string };

const MAX_BASE64_BYTES = 5 * 1024 * 1024; // 5MB

export function validateTryOnRequest(body: any): ValidationResult {
  const req = body as TryOnRequest;

  if (!req || typeof req !== 'object') {
    return { ok: false, status: 400, message: 'Invalid JSON body' };
  }

  if (!req.garmentTemplateId || typeof req.garmentTemplateId !== 'string') {
    return { ok: false, status: 400, message: 'garmentTemplateId is required' };
  }

  const hasBase64 = typeof req.fabricImageBase64 === 'string' && req.fabricImageBase64.length > 0;
  const hasUrl = typeof req.fabricImageUrl === 'string' && req.fabricImageUrl.length > 0;
  if (!hasBase64 && !hasUrl) {
    return { ok: false, status: 400, message: 'fabricImageBase64 or fabricImageUrl is required' };
  }
  if (hasBase64 && hasUrl) {
    return { ok: false, status: 400, message: 'Provide only one of fabricImageBase64 or fabricImageUrl' };
  }

  if (hasBase64) {
    const mime = (req.fabricMimeType || '').toLowerCase();
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
      return { ok: false, status: 400, message: 'Unsupported fabricMimeType' };
    }

    // Approx bytes: base64Len * 3/4
    const approxBytes = Math.floor((req.fabricImageBase64!.length * 3) / 4);
    if (approxBytes > MAX_BASE64_BYTES) {
      return { ok: false, status: 413, message: 'Fabric image too large (max 5MB)' };
    }
  }

  const scale = req.options?.fabricScale;
  if (typeof scale === 'number') {
    if (Number.isNaN(scale) || scale < 0.5 || scale > 3) {
      return { ok: false, status: 400, message: 'fabricScale must be between 0.5 and 3' };
    }
  }

  return { ok: true };
}

export function isAllowedRemoteImageUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;

    // SSRF guard: allow only known hosts.
    const host = url.hostname.toLowerCase();
    const allowedHosts = [
      'images.unsplash.com',
      'firebasestorage.googleapis.com',
      'storage.googleapis.com',
      'localhost',
      '127.0.0.1',
    ];

    if (!allowedHosts.includes(host)) return false;

    return true;
  } catch {
    return false;
  }
}

export function assertNoPersonalPhotoPolicy(meta: { width?: number; height?: number; filename?: string | null }) {
  // Minimal best-effort policy (no ML):
  // - We cannot reliably detect faces/people here.
  // - So we apply a conservative shape heuristic to reduce obvious personal-photo uploads.
  // - Keep it lenient enough to allow typical fabric photos (often rectangular).
  const { width, height } = meta;
  if (typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0) {
    const ratio = width / height;
    // Reject only extreme portrait/landscape ratios.
    // Examples allowed: 4:5 (0.8), 3:4 (0.75), 16:9 (1.78)
    // Examples rejected: 9:16 (0.56) and very wide banners.
    if (ratio < 0.6 || ratio > 2.2) {
      throw new Error('Fabric image looks like a personal photo. Upload a close-up fabric swatch (square/near-square recommended).');
    }
  }
}
