import type { IncomingMessage, ServerResponse } from 'node:http';
import { verifyFirebaseIdToken } from '../../server/tryon/firebaseAdmin.js';
import { getUserGenerations, deleteUserGeneration } from '../../server/services/generationsService.js';

async function readJsonBody(req: IncomingMessage, maxBytes = 1 * 1024 * 1024): Promise<any> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > maxBytes) {
      throw Object.assign(new Error('Payload too large'), { statusCode: 413 });
    }
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

export default async function handler(req: IncomingMessage & { method?: string; headers: any }, res: ServerResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    // Extract auth token from header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

    if (!token) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing authorization token' }));
      return;
    }

    // Verify Firebase token
    const verified = await verifyFirebaseIdToken(token);
    if (!verified) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid token' }));
      return;
    }

    const url = new URL(req.url || '', 'http://localhost');
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const jobId = pathSegments[pathSegments.length - 1] !== 'history' ? pathSegments[pathSegments.length - 1] : undefined;

    if (req.method === 'GET') {
      const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '12')));
      const generations = await getUserGenerations(verified.uid, limit);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: true,
          count: generations.length,
          generations: generations.map((g) => ({
            jobId: g.jobId,
            fullImageUrl: g.fullImageUrl,
            thumbnailUrl: g.thumbnailUrl,
            templateUrl: g.templateUrl,
            fabricUrl: g.fabricUrl,
            templateId: g.templateId,
            fabricId: g.fabricId,
            settings: g.settings,
            createdAt: g.createdAt.toISOString(),
          })),
        })
      );
      return;
    }

    if (req.method === 'DELETE' && jobId) {
      await deleteUserGeneration(verified.uid, jobId);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, message: 'Slot cleared successfully' }));
      return;
    }

    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  } catch (e: any) {
    const status = e?.statusCode || 500;
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e?.message || 'Server error' }));
  }
}
