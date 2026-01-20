import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import { getFirebaseAdminApp } from '../tryon/firebaseAdmin.js';

export type VisualizerGenerateInput = {
  imageBase64: string;
  imageMimeType: string;
  promptText: string;
  model?: 'gemini-2.5-flash-image' | 'gemini-1.5-flash';
  ip?: string;
};

export type VisualizerGenerateOutput = {
  imageBase64: string | null;
  mimeType: string | null;
  storedImageUrl?: string | null;
  recordId?: string | null;
};

const ipCounters = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limitPerMinute: number) {
  const now = Date.now();
  const entry = ipCounters.get(ip);
  if (!entry || entry.resetAt < now) {
    ipCounters.set(ip, { count: 1, resetAt: now + 60_000 });
    return;
  }
  if (entry.count >= limitPerMinute) {
    throw new Error('Rate limit exceeded. Please wait and try again.');
  }
  entry.count += 1;
}

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error('Missing GEMINI_API_KEY/GOOGLE_API_KEY on server');
  return key;
}

function inferExtension(mimeType: string | null | undefined): string {
  const ct = String(mimeType || '').toLowerCase();
  if (ct.includes('image/png')) return 'png';
  if (ct.includes('image/webp')) return 'webp';
  if (ct.includes('image/jpeg') || ct.includes('image/jpg')) return 'jpg';
  return 'png';
}

export async function saveVisualizerGeneration(params: {
  userId: string;
  imageBase64: string;
  mimeType: string;
  promptText: string;
  model: string;
  aspectLabel?: string;
  cameraInfo?: { yaw?: number; pitch?: number; distance?: number } | null;
  dofEnabled?: boolean;
  dofFocusDistance?: number;
  dofAperture?: number;
  dofFocalLength?: number;
}): Promise<{ recordId: string; imageUrl: string }> {
  const app = getFirebaseAdminApp();
  const bucket = app.storage().bucket();
  const db = app.firestore();
  const recordId = uuidv4();
  const ext = inferExtension(params.mimeType);
  const filePath = `visualizer_generations/${params.userId}/${recordId}.${ext}`;
  const file = bucket.file(filePath);

  const buffer = Buffer.from(params.imageBase64.replace(/^data:.*;base64,/, ''), 'base64');
  await file.save(buffer, {
    metadata: {
      contentType: params.mimeType || 'image/png',
      cacheControl: 'public, max-age=31536000',
    },
  });

  await file.makePublic();
  const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

  const record: any = {
    id: recordId,
    userId: params.userId,
    imageUrl,
    mimeType: params.mimeType || 'image/png',
    promptText: params.promptText || '',
    model: params.model || 'unknown',
    aspectLabel: params.aspectLabel || null,
    cameraInfo: params.cameraInfo || null,
    dofEnabled: params.dofEnabled ?? false,
    dofFocusDistance: typeof params.dofFocusDistance === 'number' ? params.dofFocusDistance : null,
    dofAperture: typeof params.dofAperture === 'number' ? params.dofAperture : null,
    dofFocalLength: typeof params.dofFocalLength === 'number' ? params.dofFocalLength : null,
    createdAt: new Date(),
  };

  await db.collection('visualizer_generations').doc(recordId).set(record);
  console.log('[Visualizer] Saved generation', { recordId, userId: params.userId, imageUrl });
  return { recordId, imageUrl };
}

export async function generateVisualizerImage(input: VisualizerGenerateInput): Promise<VisualizerGenerateOutput> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  if (input.ip) {
    checkRateLimit(input.ip, 8);
  }

  const preferred = input.model || 'gemini-2.5-flash-image';
  const candidates = Array.from(new Set([
    preferred,
    'gemini-2.5-flash-image',
    'gemini-3-pro-image-preview',
  ]));

  const start = Date.now();
  let lastErr: unknown;

  for (const model of candidates) {
    try {
      const interaction = await (ai as any).interactions.create({
        model,
        input: [
          { type: 'text', text: input.promptText },
          { type: 'image', data: input.imageBase64, mime_type: input.imageMimeType },
        ],
        response_modalities: ['image'],
      });

      const outputs: any[] = (interaction as any)?.outputs || [];
      const img = outputs.find((o: any) => o?.type === 'image' && o?.data);
      const durationMs = Date.now() - start;
      console.log('[Visualizer] model:', model, 'durationMs:', durationMs, 'promptChars:', input.promptText.length);

      if (!img) {
        lastErr = new Error('No image returned');
        continue;
      }

      return {
        imageBase64: img.data as string,
        mimeType: (img.mime_type as string) || 'image/png',
      };
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.warn('[Visualizer] Model failed:', model, msg);
      lastErr = err;
    }
  }

  if (lastErr) throw lastErr;
  return { imageBase64: null, mimeType: null };
}
