import admin from 'firebase-admin';

let initialized = false;

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v : undefined;
}

export function getFirebaseAdminApp(): admin.app.App {
  if (initialized && admin.apps.length) return admin.app();

  const serviceAccountJson = getEnv('FIREBASE_SERVICE_ACCOUNT_JSON');
  const projectId = getEnv('FIREBASE_PROJECT_ID');
  const clientEmail = getEnv('FIREBASE_CLIENT_EMAIL');
  const privateKey = getEnv('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

  console.log('[FirebaseAdmin] Initializing with Project ID:', projectId || (serviceAccountJson ? JSON.parse(serviceAccountJson).project_id : 'MISSING'));

  let credential: admin.credential.Credential | undefined;
  if (serviceAccountJson) {
    try {
      credential = admin.credential.cert(JSON.parse(serviceAccountJson));
      console.log('[FirebaseAdmin] Using serviceAccountJson credential');
    } catch (e: any) {
      console.error('[FirebaseAdmin] Failed to parse serviceAccountJson:', e.message);
    }
  } else if (projectId && clientEmail && privateKey) {
    credential = admin.credential.cert({ projectId, clientEmail, privateKey } as any);
    console.log('[FirebaseAdmin] Using individual env credentials');
  }

  if (!credential) {
    const errorMsg = 'Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).';
    console.error('[FirebaseAdmin] ❌ CRTICAL ERROR:', errorMsg);
    throw new Error(errorMsg);
  }

  const storageBucket = getEnv('FIREBASE_STORAGE_BUCKET');

  admin.initializeApp({
    credential,
    projectId,
    storageBucket,
  });

  initialized = true;
  return admin.app();
}

export async function verifyFirebaseIdToken(idToken: string): Promise<{ uid: string } | null> {
  try {
    const app = getFirebaseAdminApp();
    const decoded = await app.auth().verifyIdToken(idToken);
    return decoded;
  } catch (e: any) {
    if (e.code === 'auth/id-token-expired') {
      console.warn('[FirebaseAdmin] Token expired');
    } else {
      console.error('[FirebaseAdmin] Token verification failed:', e.message);
    }
    return null;
  }
}

export function getFirestore() {
  const app = getFirebaseAdminApp();
  return app.firestore();
}

export function getAuth() {
  const app = getFirebaseAdminApp();
  return app.auth();
}

export function getStorageBucket() {
  const app = getFirebaseAdminApp();
  const bucket = app.storage().bucket();
  return bucket;
}

export async function createCustomTokenForUid(uid: string): Promise<string> {
  const app = getFirebaseAdminApp();
  return app.auth().createCustomToken(uid);
}
