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

  let credential: admin.credential.Credential | undefined;
  if (serviceAccountJson) {
    credential = admin.credential.cert(JSON.parse(serviceAccountJson));
  } else if (projectId && clientEmail && privateKey) {
    credential = admin.credential.cert({ projectId, clientEmail, privateKey } as any);
  }

  if (!credential) {
    throw new Error(
      'Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).'
    );
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
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

export function getFirestore() {
  const app = getFirebaseAdminApp();
  return app.firestore();
}

export function getStorageBucket() {
  const app = getFirebaseAdminApp();
  const bucket = app.storage().bucket();
  return bucket;
}
