import type { IncomingMessage, ServerResponse } from 'node:http';
import { verifyFirebaseIdToken, createCustomTokenForUid } from '../../server/tryon/firebaseAdmin.js';

async function readJsonBody(req: IncomingMessage, maxBytes = 1024 * 100): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    const timer = setTimeout(() => reject(new Error('Body read timeout')), 10000);

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        clearTimeout(timer);
        reject(new Error('Payload too large'));
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      clearTimeout(timer);
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
      const token = bearer || body.token || body.idToken;

      if (!token) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing token' }));
        return;
      }

      const decoded = await verifyFirebaseIdToken(token);
      if (!decoded?.uid) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Invalid token' }));
        return;
      }

      const customToken = await createCustomTokenForUid(decoded.uid);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ customToken }));
    } catch (e: any) {
      console.error('[API] /custom-token error:', e);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        error: e?.message || 'Failed to create custom token',
        stack: process.env.NODE_ENV !== 'production' ? e?.stack : undefined 
      }));
    }
    return;
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}
