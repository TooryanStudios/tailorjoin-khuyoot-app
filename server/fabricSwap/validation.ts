export type FabricSwapRequest = {
  templateBase64: string;
  templateMimeType?: string;
  fabricBase64: string;
  fabricMimeType?: string;
  model?: 'NanoBana' | 'Pro';
  refinementPrompt?: string;
  preserveFace?: boolean;
  preservePose?: boolean;
  outputFit?: 'contain' | 'cover';
  shouldWatermark?: boolean;
  userId?: string; // For saving to Firestore
  templateId?: string; // For generation history
  fabricId?: string; // For generation history
  templateFilename?: string; // Original filename for metadata
  fabricFilename?: string; // Original filename for metadata
  debug?: boolean;
};

export type ValidationResult = { ok: true } | { ok: false; status: number; message: string };

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;

function estimateBytesFromBase64(base64: string): number {
  return Math.floor((base64.length * 3) / 4);
}

export function validateFabricSwapRequest(body: any): ValidationResult {
  if (!body || typeof body !== 'object') return { ok: false, status: 400, message: 'Invalid JSON body' };

  const templateBase64 = body.templateBase64;
  if (!templateBase64 || typeof templateBase64 !== 'string') {
    return { ok: false, status: 400, message: 'templateBase64 is required' };
  }

  const fabricBase64 = body.fabricBase64;
  if (!fabricBase64 || typeof fabricBase64 !== 'string') {
    return { ok: false, status: 400, message: 'fabricBase64 is required' };
  }

  const templateMimeType = typeof body.templateMimeType === 'string' ? body.templateMimeType : 'image/png';
  if (!ALLOWED_MIME_TYPES.has(templateMimeType)) {
    return { ok: false, status: 400, message: 'Unsupported templateMimeType' };
  }

  const fabricMimeType = typeof body.fabricMimeType === 'string' ? body.fabricMimeType : 'image/png';
  if (!ALLOWED_MIME_TYPES.has(fabricMimeType)) {
    return { ok: false, status: 400, message: 'Unsupported fabricMimeType' };
  }

  const templateBytes = estimateBytesFromBase64(templateBase64);
  if (templateBytes > MAX_BYTES) {
    return { ok: false, status: 413, message: 'Template image too large (max 5MB)' };
  }

  const fabricBytes = estimateBytesFromBase64(fabricBase64);
  if (fabricBytes > MAX_BYTES) {
    return { ok: false, status: 413, message: 'Fabric image too large (max 5MB)' };
  }

  return { ok: true };
}
