import 'dotenv/config';
import http from 'node:http';
import { handleTryOnFabric } from './tryon/tryonHandler';

console.log('Starting Try-On API dev server...');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
console.log('FIREBASE_STORAGE_BUCKET:', process.env.FIREBASE_STORAGE_BUCKET || 'NOT SET');
console.log('TRYON_API_PORT:', process.env.TRYON_API_PORT || '8787 (default)');

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

const port = Number(process.env.TRYON_API_PORT || 8787);

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(404);
    res.end();
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
