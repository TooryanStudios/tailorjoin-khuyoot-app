import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleFabricSwap } from '../../server/fabricSwap/fabricSwapHandler.js';

async function readJsonBody(req: IncomingMessage, maxBytes = 6 * 1024 * 1024): Promise<any> {
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
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const body = await readJsonBody(req);
    const ip =
      (typeof req.headers['x-forwarded-for'] === 'string' && req.headers['x-forwarded-for'].split(',')[0].trim()) ||
      (req.socket?.remoteAddress || 'unknown');

    const { status, json } = await handleFabricSwap(body, {
      ip,
      headers: req.headers || {},
    });

    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(json));
  } catch (e: any) {
    const status = e?.statusCode || 500;
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e?.message || 'Server error' }));
  }
}
