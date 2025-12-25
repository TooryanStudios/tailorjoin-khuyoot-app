import 'dotenv/config';
import http from 'node:http';
import { handleTryOnFabric } from './tryon/tryonHandler';

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
