import 'dotenv/config';
import http from 'node:http';
import { Server } from 'socket.io';
import { handleTryOnFabric } from './tryon/tryonHandler';
import { handleUpscale } from './upscale/upscaleHandler';
import { handleFabricSwap } from './fabricSwap/fabricSwapHandler';
import { getUserGenerations, deleteUserGeneration } from './services/generationsService';
import { createCustomTokenForUid, getFirestore, verifyFirebaseIdToken } from './tryon/firebaseAdmin';
import { generateVisualizerImage, saveVisualizerGeneration } from './visualizer/visualizerHandler';
import { createThawaniSession, handleThawaniWebhook } from './payments/thawaniHandler';
import { setupOrderTracking } from './socketio/orderTracking';

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
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    
    // Safety timeout for body reading
    const timer = setTimeout(() => {
      reject(new Error('Body read timeout'));
    }, 10000);

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
      } catch (err) {
        resolve({});
      }
    });

    req.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function setCors(res: http.ServerResponse, req?: http.IncomingMessage) {
  const origin = req?.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

function parseCookies(cookieHeader?: string) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length === 2) {
      cookies[parts[0].trim()] = parts[1].trim();
    }
  });
  return cookies;
}

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0') return true;
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

async function proxyRemoteImage(urlStr: string, res: http.ServerResponse, req: http.IncomingMessage) {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    setCors(res, req);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid url' }));
    return;
  }

  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    setCors(res, req);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unsupported protocol' }));
    return;
  }

  if (isPrivateHost(u.hostname) || !ALLOWED_PROXY_HOSTS.has(u.hostname)) {
    setCors(res, req);
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
      headers: { 'User-Agent': 'Khuyoot-DevApiServer/1.0' },
    });

    if (!upstream.ok) {
      setCors(res, req);
      res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Upstream error: ${upstream.status}` }));
      return;
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const buf = Buffer.from(await upstream.arrayBuffer());
    setCors(res, req);
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
    res.end(buf);
  } catch (e: any) {
    setCors(res, req);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e?.message || 'Proxy failed' }));
  } finally {
    clearTimeout(timeout);
  }
}

async function proxyRemoteImageInfo(urlStr: string, res: http.ServerResponse, req: http.IncomingMessage) {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    setCors(res, req);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid url' }));
    return;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const upstream = await fetch(u.toString(), { method: 'HEAD', signal: controller.signal });
    setCors(res, req);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      contentType: upstream.headers.get('content-type'), 
      contentLength: upstream.headers.get('content-length') 
    }));
  } catch (e: any) {
    setCors(res, req);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e?.message || 'Proxy failed' }));
  } finally {
    clearTimeout(timeout);
  }
}

const port = Number(process.env.TRYON_API_PORT || 8788);

const server = http.createServer({ maxHeaderSize: 32768 }, async (req, res) => {
  try {
    if (!req.url) return;
    
    // Log health checks less verbosely
    if (!req.url.startsWith('/api/health')) {
      console.log(`[API] ${req.method} ${req.url}`);
    }

    if (req.method === 'OPTIONS') {
      setCors(res, req);
      res.writeHead(204);
      res.end();
      return;
    }

  // COOKIE LOGIN
  if (req.url.startsWith('/api/auth/login-cookie') && req.method === 'POST') {
    setCors(res, req);
    try {
      const body = await readJsonBody(req);
      const token = body.token;
      if (!token) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing token' }));
        return;
      }
      console.log('[API] Setting auth cookie...');
      const isProd = process.env.NODE_ENV === 'production';
      // SameSite=Lax is usually fine for localhost:3000 -> localhost:8788
      res.setHeader('Set-Cookie', [
        `khuyoot_auth=${token}; HttpOnly; ${isProd ? 'Secure; ' : ''}SameSite=Lax; Path=/; Max-Age=31536000`
      ]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (e: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // EXCHANGE ID TOKEN FOR FIREBASE CUSTOM TOKEN (SDK SIGN-IN)
  if (req.url.startsWith('/api/auth/custom-token') && req.method === 'POST') {                   setCors(res, req);
    try {
      const body = await readJsonBody(req);
      const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
      const token = bearer || body.token || body.idToken;
      if (!token) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing token' }));
        return;
      }

      const decoded = await verifyFirebaseIdToken(token);
      if (!decoded?.uid) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid token' }));
        return;
      }

      const customToken = await createCustomTokenForUid(decoded.uid);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ customToken }));
    } catch (e: any) {
      console.error('[API] /custom-token error:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: e?.message || 'Failed to create custom token',
        stack: process.env.NODE_ENV !== 'production' ? e?.stack : undefined 
      }));
    }
    return;
  }

  // GET ME (Cookie Auth)      
    if (req.url.startsWith('/api/auth/me') && req.method === 'GET') {
      setCors(res, req);
      
      let token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
      if (!token) {
        const cookies = parseCookies(req.headers.cookie);
        token = cookies['khuyoot_auth'];
      }
      
      console.log('[API] /me called. Token present:', !!token);

      if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No token found' }));
        return;
      }

      try {
        const decoded = await verifyFirebaseIdToken(token);
      if (!decoded) {
        console.warn('[API] Token verification failed (returned null)');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid or expired session' }));
        return;
      }

      // Fetch additional profile data (Credits) from Firestore
              let profile: any = {};
        try {
          const db = getFirestore();
          // Fetch from both 'users' and 'user_profiles'
          const [userDoc, profileDoc] = await Promise.all([
            db.collection('users').doc(decoded.uid).get(),
            db.collection('user_profiles').doc(decoded.uid).get()
          ]);
          
          if (userDoc.exists) {
            profile = { ...profile, ...userDoc.data() };
          }
          if (profileDoc.exists) {
            profile = { ...profile, ...profileDoc.data() };
          }
        } catch (dbErr) {
          console.warn('[API] Failed to fetch profile from Firestore:', dbErr);
        }

      console.log('[API] Session verified for:', (decoded as any).email || decoded.uid);
      console.log('[API] Decoded Token Claims:', JSON.stringify(decoded));
      console.log('[API] Firestore Profile from users:', JSON.stringify(profile));
      
      let role = profile.role || (decoded as any).role || 'customer';
      console.log('[API] Initial role determination:', role);
      
      console.log('[API] Final role sent to client:', role);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        uid: decoded.uid,
        email: (decoded as any).email,
        displayName: profile.name || profile.displayName || (decoded as any).name || (decoded as any).displayName || 'User',
        photoURL: profile.profileImage || profile.photoURL || profile.avatar || (decoded as any).picture || (decoded as any).photoURL || null,
        phone: profile.phone || profile.phoneNumber || profile.contactNumber || (profile as any).phone_number || null,
        phoneNumber: profile.phoneNumber || profile.phone || profile.contactNumber || null,
        contactNumber: profile.contactNumber || profile.phone || null,
        role: role,
        billing: {
          credits: profile.credit_balance ?? profile.credits ?? 0,
          tier: (profile.tier || 'free').toLowerCase(),
          subscriptionStatus: profile.subscriptionStatus || 'none'
        },
        metadata: {
          completedOrders: profile.completedOrdersCount || profile.ordersCount || 0,
          joinDate: profile.createdAt || profile.joinDate || null
        }
      }));
    } catch (e: any) {
      console.error('[API] /me error:', e.message);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Auth failed' }));
    }
    return;
  }

  // LOGOUT
  if (req.url.startsWith('/api/auth/logout') && req.method === 'POST') {
    setCors(res, req);
    const isProd = process.env.NODE_ENV === 'production';
    console.log('[API] Clearing auth cookie...');
    // Must match attributes of the login cookie to successfully clear it
    // We send multiple variations to cover potential domain/path mismatches
    res.setHeader('Set-Cookie', [
      `khuyoot_auth=; HttpOnly; ${isProd ? 'Secure; ' : ''}SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    ]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  if (req.url.startsWith('/api/health')) {
    setCors(res, req);
    try {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    } catch (e: any) {
      console.error('[API] /health error:', e);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // PROXY IMAGE
  if (req.url.startsWith('/api/proxy-image')) {
    const u = new URL(req.url, `http://localhost:${port}`).searchParams.get('url');
    if (!u) { res.writeHead(400); res.end(); return; }
    if (req.url.includes('info')) await proxyRemoteImageInfo(u, res, req);
    else await proxyRemoteImage(u, res, req);
    return;
  }

  // TRYON
  if (req.url.startsWith('/api/tryon/fabric')) {
    setCors(res, req);
    try {
      const body = await readJsonBody(req);
      const { status, json } = await handleTryOnFabric(body, { ip: 'dev', headers: req.headers as any });
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(json));
    } catch (e: any) {
      res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // VISUALIZER
  if (req.url.startsWith('/api/visualizer/generate')) {
    setCors(res, req);
    try {
      // Allow both Bearer and Cookie for generate
      let token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
      if (!token) token = parseCookies(req.headers.cookie)['khuyoot_auth'];
      
      if (!token) { res.writeHead(401); res.end(JSON.stringify({ error: 'Unauthorized' })); return; }
      const decoded = await verifyFirebaseIdToken(token);
      if (!decoded) { res.writeHead(401); res.end(JSON.stringify({ error: 'Invalid token' })); return; }
      
      const body = await readJsonBody(req);
      const { imageBase64: outBase64, mimeType } = await generateVisualizerImage({ ...body, ip: 'dev' });
      const saved = await saveVisualizerGeneration({ userId: decoded.uid, imageBase64: outBase64, mimeType: mimeType || 'image/png', ...body });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ imageBase64: outBase64, mimeType, storedImageUrl: saved.imageUrl, recordId: saved.recordId }));
    } catch (e: any) {
      res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // UPSCALE / FABRIC SWAP / HISTORY (Abbreviated for clarity, using existing handlers)
  if (req.url.startsWith('/api/upscale')) {
    setCors(res, req);
    try {
      const body = await readJsonBody(req);
      const { status, json } = await handleUpscale(body, { ip: 'dev', headers: req.headers as any });
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(json));
    } catch (e: any) { res.writeHead(500); res.end(); }
    return;
  }

  // Designer V2.1 Upscale
  if (req.url.startsWith('/api/designer-v2-1/upscale')) {
    setCors(res, req);
    try {
      const body = await readJsonBody(req);
      const { status, json } = await handleUpscale(body, { ip: 'dev', headers: req.headers as any });
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(json));
    } catch (e: any) { res.writeHead(500); res.end(); }
    return;
  }

  if (req.url.startsWith('/api/designer-v2-1/swap')) {
    setCors(res, req);
    try {
      const body = await readJsonBody(req);
      const { status, json } = await handleFabricSwap(body, { ip: 'dev', headers: req.headers as any });
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(json));
    } catch (e: any) { res.writeHead(500); res.end(); }
    return;
  }

  // DESIGNER V2.1 HISTORY
  if (req.url.startsWith('/api/designer-v2-1/history')) {
    setCors(res, req);
    try {
      // 1. Authenticate
      let token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
      if (!token) token = parseCookies(req.headers.cookie)['khuyoot_auth'];
      
      if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }

      const decoded = await verifyFirebaseIdToken(token);
      if (!decoded) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid or expired token' }));
        return;
      }

      const url = new URL(req.url, `http://localhost:${port}`);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      const jobId = pathSegments[pathSegments.length - 1] !== 'history' ? pathSegments[pathSegments.length - 1] : undefined;

      // GET LIST
      if (req.method === 'GET') {
        const limitSetting = parseInt(url.searchParams.get('limit') || '12');
        const limit = Math.min(100, Math.max(1, isNaN(limitSetting) ? 12 : limitSetting));
        
        console.log(`[API] Fetching history for ${decoded.uid}, limit: ${limit}`);
        const generations = await getUserGenerations(decoded.uid, limit);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
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
          }))
        }));
        return;
      }

      // DELETE
      if (req.method === 'DELETE' && jobId) {
        console.log(`[API] Deleting history item ${jobId} for ${decoded.uid}`);
        await deleteUserGeneration(decoded.uid, jobId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Slot cleared successfully' }));
        return;
      }

      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    } catch (e: any) {
      console.error('[API] History error:', e.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message || 'Server error' }));
    }
    return;
  }

  // THAWANI PAYMENTS
  if (req.url.startsWith('/api/payments/thawani/create-session')) {
    setCors(res, req);
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method === 'POST') {
      console.log('[API] Thawani create-session POST request received');
      try {
        // 1. Authenticate
        console.log('[API] Checking authorization...');
        let token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
        if (!token) token = parseCookies(req.headers.cookie)['khuyoot_auth'];
        
        if (!token) {
          console.log('[API] No token found');
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        console.log('[API] Verifying token...');
        const decoded = await verifyFirebaseIdToken(token);
        if (!decoded) {
          console.log('[API] Token verification failed');
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid or expired token' }));
          return;
        }

        console.log('[API] Token verified for user:', decoded.uid);
        console.log('[API] Reading request body...');
        const body = await readJsonBody(req);
        console.log('[API] Body received:', JSON.stringify(body, null, 2));
        
        console.log('[API] Creating Thawani session...');
        let result;
        try {
          result = await createThawaniSession({ ...body, userId: decoded.uid });
        } catch (sessionError: any) {
          console.error('[API] createThawaniSession threw error:', sessionError);
          console.error('[API] Session error message:', sessionError.message);
          console.error('[API] Session error stack:', sessionError.stack);
          throw sessionError;
        }
        
        console.log('[API] Thawani session created successfully');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e: any) {
        console.error('[API] Thawani Session Error:', e);
        console.error('[API] Error stack:', e.stack);
        try {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message || 'Server error' }));
        } catch (writeError) {
          console.error('[API] Failed to write error response:', writeError);
        }
      }
      return;
    }
  }

  if (req.url.startsWith('/api/payments/thawani/webhook')) {
    setCors(res, req);
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const result = await handleThawaniWebhook(body);
        res.writeHead(result.ok ? 200 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e: any) {
        console.error('[API] Thawani Webhook Error:', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Error' }));
      }
      return;
    }
  }

  // Default
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found' }));
  } catch (globalErr: any) {
    console.error('[API] UNCAUGHT GLOBAL ERROR:', globalErr);
    try {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Internal Server Error (Global)', 
          message: globalErr?.message,
          stack: globalErr?.stack 
        }));
      }
    } catch (e) {}
  }
});

// Initialize Socket.IO for real-time order tracking
const enableSocketIO = process.env.VITE_ENABLE_SOCKETIO !== 'false';
if (enableSocketIO) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });
  setupOrderTracking(io);
  console.log('[API] Socket.IO initialized on /orders namespace');
}

server.listen(port, '0.0.0.0', () => {
  console.log(`Try-On API dev server listening on http://localhost:${port}`);
});


