import 'dotenv/config';
import { randomUUID } from 'crypto';

import { getFirestore, getStorageBucket } from '../server/tryon/firebaseAdmin.ts';

type TryOnTemplateDoc = {
  id?: string;
  name?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  enabled?: boolean;
};

function parseArgs(argv: string[]) {
  const out = {
    dry: false,
    limit: undefined as number | undefined,
  };
  for (const a of argv) {
    if (a === '--dry') out.dry = true;
    if (a.startsWith('--limit=')) {
      const n = Number(a.slice('--limit='.length));
      if (Number.isFinite(n) && n > 0) out.limit = n;
    }
  }
  return out;
}

function getObjectPathFromUrl(url: string): { bucket?: string; path?: string } | null {
  const u = String(url || '').trim();
  if (!u) return null;

  if (u.startsWith('gs://')) {
    // gs://bucket/path/to/object
    const rest = u.slice('gs://'.length);
    const idx = rest.indexOf('/');
    if (idx <= 0) return null;
    return { bucket: rest.slice(0, idx), path: rest.slice(idx + 1) };
  }

  if (u.startsWith('tryon_templates/')) {
    return { path: u };
  }

  // Already a direct URL or a non-storage URL.
  return null;
}

function isAlreadyHttpsDownloadUrl(url: string): boolean {
  const u = String(url || '').trim();
  return u.startsWith('https://firebasestorage.googleapis.com/') || u.startsWith('https://storage.googleapis.com/');
}

async function ensureDownloadUrlForObject(params: { objectPath: string; bucketName: string; dry: boolean }): Promise<string> {
  const { objectPath, bucketName, dry } = params;
  const bucket = getStorageBucket();
  const file = bucket.file(objectPath);

  const [metadata] = await file.getMetadata();
  const existingMeta = (metadata as any)?.metadata || {};
  let tokens: string | undefined = existingMeta?.firebaseStorageDownloadTokens;

  if (!tokens || typeof tokens !== 'string' || !tokens.trim()) {
    const token = randomUUID();
    tokens = token;
    if (!dry) {
      await file.setMetadata({
        metadata: {
          ...existingMeta,
          firebaseStorageDownloadTokens: token,
        },
      });
    }
  }

  const token = String(tokens).split(',')[0].trim();
  const encodedPath = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${encodeURIComponent(token)}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const db = getFirestore();
  const bucket = getStorageBucket();
  const bucketName = bucket.name;

  console.log(`[tryon url migrate] bucket=${bucketName} dry=${args.dry} limit=${args.limit ?? '∞'}`);

  const snap = await db.collection('tryon_garment_templates').get();
  const docs = snap.docs;

  console.log(`[found] ${docs.length} template documents`);

  let touched = 0;
  for (const d of docs) {
    if (args.limit && touched >= args.limit) break;

    const data = (d.data() || {}) as TryOnTemplateDoc;
    const id = d.id;

    const imageUrlFull = String(data.imageUrl || '');
    const thumbnailUrlFull = String(data.thumbnailUrl || '');
    console.log(`[checking] ${id}:`);
    console.log(`  imageUrl="${imageUrlFull}"`);
    console.log(`  thumbnailUrl="${thumbnailUrlFull}"`);

    const patch: Partial<TryOnTemplateDoc> = {};

    const imageUrl = String(data.imageUrl || '').trim();
    if (imageUrl && !isAlreadyHttpsDownloadUrl(imageUrl)) {
      const parsed = getObjectPathFromUrl(imageUrl);
      if (parsed?.path) {
        const resolved = await ensureDownloadUrlForObject({ objectPath: parsed.path, bucketName, dry: args.dry });
        patch.imageUrl = resolved;
      }
    }

    const thumbnailUrl = String(data.thumbnailUrl || '').trim();
    if (thumbnailUrl && !isAlreadyHttpsDownloadUrl(thumbnailUrl)) {
      const parsed = getObjectPathFromUrl(thumbnailUrl);
      if (parsed?.path) {
        const resolved = await ensureDownloadUrlForObject({ objectPath: parsed.path, bucketName, dry: args.dry });
        patch.thumbnailUrl = resolved;
      }
    }

    if (Object.keys(patch).length > 0) {
      touched++;
      console.log(`[update] ${id}`, patch);
      if (!args.dry) {
        await db.collection('tryon_garment_templates').doc(id).set(patch, { merge: true });
      }
    }
  }

  console.log(`[done] updated=${touched} (dry=${args.dry})`);
}

main().catch((e) => {
  console.error('[tryon url migrate] failed', e);
  process.exitCode = 1;
});
