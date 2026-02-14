import type { IncomingMessage, ServerResponse } from 'node:http';
import { verifyFirebaseIdToken, getFirestore } from '../../server/tryon/firebaseAdmin.js';

function parseCookies(request: IncomingMessage) {
    const list: Record<string, string> = {};
    const rc = request.headers.cookie;

    rc && rc.split(';').forEach((cookie) => {
        const parts = cookie.split('=');
        list[parts.shift()!.trim()] = decodeURI(parts.join('='));
    });

    return list;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    if (req.method === 'GET') {
        try {
            let token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
            if (!token) {
                const cookies = parseCookies(req);
                token = cookies['khuyoot_auth'];
            }

            if (!token) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'No token found' }));
                return;
            }

            const decoded = await verifyFirebaseIdToken(token);
            if (!decoded) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid or expired session' }));
                return;
            }

            // Fetch additional profile data (Credits) from Firestore
            let profile: any = {};
            try {
                const db = getFirestore();
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

            // Construct response matching devApiServer.ts logic but cleaner
            const role = profile.role || (decoded as any).role || 'customer';
            
            const responseData = {
                uid: decoded.uid,
                email: (decoded as any).email,
                displayName: profile.name || profile.displayName || (decoded as any).name || (decoded as any).displayName || 'User',
                photoURL: profile.profileImage || profile.photoURL || profile.avatar || (decoded as any).picture || (decoded as any).photoURL || null,
                phone: profile.phone || profile.phoneNumber || profile.contactNumber || (profile as any).phone_number || null,
                phoneNumber: profile.phoneNumber || profile.phone || profile.contactNumber || null,
                contactNumber: profile.contactNumber || profile.phone || null,
                role: role,
                isAdmin: role === 'admin' || role === 'super_admin' || (decoded as any).admin === true,
                isSubscribed: profile.isSubscribed || false,
                billing: {
                    credits: profile.credits ?? profile.credit_balance ?? 0,
                    tier: (profile.tier || 'free').toLowerCase(),
                    subscriptionStatus: profile.subscriptionStatus || 'none'
                },
                metadata: {
                    completedOrders: profile.completedOrders || 0,
                    lastLogin: new Date().toISOString()
                },
                preferences: profile.preferences || {},
                 // Map old credit_balance to top level credits if not present
                credits: profile.credits ?? profile.credit_balance ?? 0,
                credit_balance: profile.credit_balance ?? profile.credits ?? 0
            };

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(responseData));

        } catch (error: any) {
            console.error('API Error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    } else {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    }
}
