import type { IncomingMessage, ServerResponse } from 'node:http';

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

export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
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
            const body = req.body || await readJsonBody(req);
            const { token } = body;

            if (!token) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing token' }));
                return;
            }

            // Set the cookie
            // Note: In Vercel, "Set-Cookie" header works.
            // Secure cookie for production
            const isProd = process.env.NODE_ENV === 'production';
            const cookieValue = `khuyoot_auth=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${isProd ? '; Secure' : ''}`;
            
            res.setHeader('Set-Cookie', cookieValue);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
        } catch (error: any) {
            console.error('Login cookie error:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    } else {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    }
}
