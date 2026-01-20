import 'dotenv/config';
import http from 'node:http';
import { handleTryOnFabric } from './tryon/tryonHandler';
import { handleUpscale } from './upscale/upscaleHandler';
import { handleFabricSwap } from './fabricSwap/fabricSwapHandler';
import { getFirestore, verifyFirebaseIdToken } from './tryon/firebaseAdmin';
import { generateVisualizerImage, saveVisualizerGeneration } from './visualizer/visualizerHandler';

console.log('Starting Try-On API dev server...');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
console.log('FIREBASE_STORAGE_BUCKET:', process.env.FIREBASE_STORAGE_BUCKET || 'NOT SET');
console.log('TRYON_API_PORT:', process.env.TRYON_API_PORT || '8788 (default)');

// Keep process alive
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

async function readJsonBody(req: http.IncomingMessage, maxBytes = 6 * 1024 * 1024): Promise<any> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > maxBytes) {
      const err: any = new Error('Payload too large');
      err.statusCode = 413;
      throw err;
    }
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

function setCors(res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0') return true;
  // basic private IPv4 ranges
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true;
  return false;
}

const ALLOWED_PROXY_HOSTS = new Set([
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'images.unsplash.com',
]);

async function proxyRemoteImage(urlStr: string, res: http.ServerResponse) {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid url' }));
    return;
  }

  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unsupported protocol' }));
    return;
  }

  if (isPrivateHost(u.hostname)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Host not allowed' }));
    return;
  }

  if (!ALLOWED_PROXY_HOSTS.has(u.hostname)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Host not allowed' }));
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const upstream = await fetch(u.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        // Some CDNs behave better with a UA
        'User-Agent': 'Khuyoot-DevApiServer/1.0',
      },
    });

    if (!upstream.ok) {
      res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Upstream error: ${upstream.status}` }));
      return;
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const contentLength = upstream.headers.get('content-length');

    // Safety limit
    const maxBytes = 12 * 1024 * 1024;
    if (contentLength && Number(contentLength) > maxBytes) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Image too large' }));
      return;
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.length > maxBytes) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Image too large' }));
      return;
    }

    setCors(res);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    });
    res.end(buf);
  } catch (e: any) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e?.message || 'Proxy failed' }));
  } finally {
    clearTimeout(timeout);
  }
}

async function proxyRemoteImageInfo(urlStr: string, res: http.ServerResponse) {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    setCors(res);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid url' }));
    return;
  }

  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    setCors(res);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unsupported protocol' }));
    return;
  }

  if (isPrivateHost(u.hostname) || !ALLOWED_PROXY_HOSTS.has(u.hostname)) {
    setCors(res);
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Host not allowed' }));
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    let upstream: Response | null = null;

    // Try HEAD first to avoid downloading the image.
    try {
      upstream = await fetch(u.toString(), {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Khuyoot-DevApiServer/1.0',
        },
      });
    } catch {
      upstream = null;
    }

    // Some hosts don't support HEAD; fallback to a regular GET.
    if (!upstream || (!upstream.ok && upstream.status !== 405)) {
      upstream = await fetch(u.toString(), {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Khuyoot-DevApiServer/1.0',
        },
      });
    }

    if (!upstream.ok) {
      setCors(res);
      res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Upstream error: ${upstream.status}` }));
      return;
    }

    const contentType = upstream.headers.get('content-type') || null;
    const contentLengthStr = upstream.headers.get('content-length');
    const contentLength = contentLengthStr ? Number(contentLengthStr) : null;

    setCors(res);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ contentType, contentLength }));
  } catch (e: any) {
    setCors(res);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e?.message || 'Proxy failed' }));
  } finally {
    clearTimeout(timeout);
  }
}

const port = Number(process.env.TRYON_API_PORT || 8788);

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(404);
    res.end();
    return;
  }

  if (req.method === 'OPTIONS') {
    setCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url.startsWith('/api/proxy-image')) {
    if (req.method !== 'GET') {
      setCors(res);
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    const parsed = new URL(req.url, 'http://localhost');
    const url = parsed.searchParams.get('url');
    if (!url) {
      setCors(res);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing url' }));
      return;
    }

    await proxyRemoteImage(url, res);
    return;
  }

  if (req.url.startsWith('/api/proxy-image-info')) {
    if (req.method !== 'GET') {
      setCors(res);
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    const parsed = new URL(req.url, 'http://localhost');
    const url = parsed.searchParams.get('url');
    if (!url) {
      setCors(res);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing url' }));
      return;
    }

    await proxyRemoteImageInfo(url, res);
    return;
  }

  if (req.url.startsWith('/api/tryon/fabric')) {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    try {
      const body = await readJsonBody(req);
      const ip =
        (typeof req.headers['x-forwarded-for'] === 'string' && req.headers['x-forwarded-for'].split(',')[0].trim()) ||
        (req.socket?.remoteAddress || 'unknown');

      const { status, json } = await handleTryOnFabric(body, {
        ip,
        headers: (req.headers as any) || {},
      });

      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(json));
    } catch (e: any) {
      res.writeHead(e?.statusCode || 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ jobId: 'n/a', status: 'failed', error: e?.message || 'Server error' }));
    }
    return;
  }

  if (req.url.startsWith('/api/visualizer/generate')) {
    if (req.method !== 'POST') {
      setCors(res);
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    try {
      const authHeader = String(req.headers.authorization || '');
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
      if (!token) {
        setCors(res);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing Authorization bearer token' }));
        return;
      }

      const decoded = await verifyFirebaseIdToken(token);
      if (!decoded?.uid) {
        setCors(res);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid token' }));
        return;
      }

      const body = await readJsonBody(req);
      const imageBase64 = body?.imageBase64;
      const imageMimeType = body?.imageMimeType || 'image/png';
      const promptText = body?.promptText || '';
      const model = body?.model || 'gemini-1.5-flash';
      const aspectLabel = body?.aspectLabel || null;
      const cameraInfo = body?.cameraInfo || null;
      const dofEnabled = body?.dofEnabled ?? false;
      const dofFocusDistance = body?.dofFocusDistance;
      const dofAperture = body?.dofAperture;
      const dofFocalLength = body?.dofFocalLength;

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        setCors(res);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing imageBase64' }));
        return;
      }

      const ip =
        (typeof req.headers['x-forwarded-for'] === 'string' && req.headers['x-forwarded-for'].split(',')[0].trim()) ||
        (req.socket?.remoteAddress || 'unknown');

      const { imageBase64: outBase64, mimeType } = await generateVisualizerImage({
        imageBase64,
        imageMimeType,
        promptText,
        model,
        ip,
      });

      if (!outBase64) {
        setCors(res);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No image returned' }));
        return;
      }

      const saved = await saveVisualizerGeneration({
        userId: decoded.uid,
        imageBase64: outBase64,
        mimeType: mimeType || 'image/png',
        promptText,
        model,
        aspectLabel,
        cameraInfo,
        dofEnabled,
        dofFocusDistance,
        dofAperture,
        dofFocalLength,
      });

      setCors(res);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        imageBase64: outBase64,
        mimeType,
        storedImageUrl: saved.imageUrl,
        recordId: saved.recordId,
      }));
    } catch (e: any) {
      setCors(res);
      res.writeHead(e?.statusCode || 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e?.message || 'Server error' }));
    }
    return;
  }

  if (req.url.startsWith('/api/visualizer/presets/delete')) {
    if (req.method !== 'POST') {
      setCors(res);
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    try {
      const authHeader = String(req.headers.authorization || '');
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
      if (!token) {
        setCors(res);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing Authorization bearer token' }));
        return;
      }

      const decoded = await verifyFirebaseIdToken(token);
      if (!decoded?.uid) {
        setCors(res);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid token' }));
        return;
      }

      const body = await readJsonBody(req, 64 * 1024);
      const presetId = String(body?.presetId || '').trim();
      if (!presetId) {
        setCors(res);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing presetId' }));
        return;
      }

      const db = getFirestore();
      const docRef = db.collection('visualizer_camera_presets').doc(presetId);
      const snap = await docRef.get();
      if (!snap.exists) {
        setCors(res);
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Preset not found' }));
        return;
      }

      const data = snap.data() as any;
      if (!data || data.userId !== decoded.uid) {
        setCors(res);
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not allowed' }));
        return;
      }

      await docRef.delete();
      setCors(res);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (e: any) {
      setCors(res);
      res.writeHead(e?.statusCode || 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e?.message || 'Server error' }));
    }
    return;
  }
  
  // Upscale endpoint
  if (req.url.startsWith('/api/upscale') && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const ip =
        (typeof req.headers['x-forwarded-for'] === 'string' && req.headers['x-forwarded-for'].split(',')[0].trim()) ||
        (req.socket?.remoteAddress || 'unknown');

      const { status, json } = await handleUpscale(body, { ip, headers: req.headers as any });
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(json));
    } catch (err: any) {
      res.writeHead(err?.statusCode || 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err?.message || 'Server error' }));
    }
    return;
  }

  // Designer V2.1 Fabric Swap endpoint
  if (req.url.startsWith('/api/designer-v2-1/swap') && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const ip =
        (typeof req.headers['x-forwarded-for'] === 'string' && req.headers['x-forwarded-for'].split(',')[0].trim()) ||
        (req.socket?.remoteAddress || 'unknown');

      const { status, json } = await handleFabricSwap(body, { ip, headers: req.headers as any });
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(json));
    } catch (err: any) {
      res.writeHead(err?.statusCode || 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err?.message || 'Server error' }));
    }
    return;
  }

  // Designer V2.1 History endpoint
  if (req.url.startsWith('/api/designer-v2-1/history') && (req.method === 'GET' || req.method === 'DELETE')) {
    try {
      const historyHandler = await import('../api/designer-v2-1/history.js');
      await historyHandler.default(req as any, res);
    } catch (err: any) {
      res.writeHead(err?.statusCode || 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err?.message || 'Server error' }));
    }
    return;
  }

  // Designer V2.1 Upscale endpoint
  if (req.url.startsWith('/api/designer-v2-1/upscale') && req.method === 'POST') {
    try {
      const upscaleHandler = await import('../api/designer-v2-1/upscale.js');
      await upscaleHandler.default(req as any, res);
    } catch (err: any) {
      res.writeHead(err?.statusCode || 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err?.message || 'Server error' }));
    }
    return;
  }

  // Credits: Upgrade bonus (adds 200 credits to the authenticated user)
  if (req.url.startsWith('/api/credits/upgrade-bonus') && req.method === 'POST') {
    setCors(res);
    try {
      const authHeader = String(req.headers.authorization || '');
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
      if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing Authorization bearer token' }));
        return;
      }

      const decoded = await verifyFirebaseIdToken(token);
      if (!decoded?.uid) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid token' }));
        return;
      }

      // Body is optional; allow overriding amount for dev, default 200.
      let body: any = {};
      try {
        body = await readJsonBody(req, 64 * 1024);
      } catch {
        body = {};
      }

      const uid = decoded.uid;
      const amountRaw = typeof body?.amount === 'number' ? body.amount : 200;
      const amount = Math.max(1, Math.floor(amountRaw));
      const reason = typeof body?.reason === 'string' && body.reason.trim() ? body.reason.trim() : 'Upgrade bonus';

      const db = getFirestore();
      const profileRef = db.collection('user_profiles').doc(uid);
      const txRef = db.collection('credit_transactions').doc();

      const result = await db.runTransaction(async (tx) => {
        const snap = await tx.get(profileRef);
        const current = snap.exists ? (snap.data() as any) : null;
        const currentBalance = current && typeof current.credit_balance === 'number' ? current.credit_balance : 0;
        const newBalance = Math.max(0, currentBalance + amount);

        if (snap.exists) {
          tx.set(
            profileRef,
            {
              user_id: uid,
              credit_balance: newBalance,
              updatedAt: new Date(),
            },
            { merge: true }
          );
        } else {
          tx.set(profileRef, {
            user_id: uid,
            credit_balance: newBalance,
            tier: 'Free',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        tx.set(txRef, {
          transaction_id: txRef.id,
          user_id: uid,
          amount,
          action_type: 'UPGRADE_BONUS',
          status: 'completed',
          meta: {
            reason,
            source: 'upgrade_modal',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return { new_balance: newBalance, transaction_id: txRef.id };
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, ...result }));
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err?.message || 'Server error' }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.on('error', (err: any) => {
  console.error('Server error:', err);
});

server.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`Try-On API dev server listening on http://localhost:${port}`);
  console.log('Server is ready to accept connections.');
});
