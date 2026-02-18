import * as firebaseApp from 'firebase/app';
console.log('🔥 [Firebase Service] Initializing root service...');
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  signInWithCustomToken,
  User as FirebaseUser,
  deleteUser,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
  getDocFromCache,
  getDocFromServer,
  addDoc,
  deleteDoc,
  orderBy,
  limit,
  updateDoc, 
  deleteField,
  setLogLevel,
  collectionGroup,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { getStorage, ref as storageRef, deleteObject, listAll, getDownloadURL, uploadBytes, uploadBytesResumable } from 'firebase/storage';
import { urlCache } from '../src/utils/urlCache';
import { User, Product, UserRole, AppSettings, MeasurementTemplate } from '../types';
import { MOCK_PRODUCTS } from './mockService';
import { applyUserDefaults } from '../utils/userDefaults';

// Firebase Configuration - Using Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Diagnostic switch: allow forcing the app into a no-Firebase mode for debugging.
// Usage: add `?disableFirebase=1` to the URL, or set localStorage `khuyoot:diag:disableFirebase=1`.
const DIAG_DISABLE_FIREBASE_KEY = 'khuyoot:diag:disableFirebase';

function isFirebaseDisabledByDiagnostics(): boolean {
  try {
    // Never allow disabling Firebase in production via query/localStorage.
    if (import.meta.env.PROD) return false;
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location?.search ?? '');
    if (params.get('disableFirebase') === '1') return true;
    if (params.get('firebase') === '0') return true;
    return localStorage.getItem(DIAG_DISABLE_FIREBASE_KEY) === '1';
  } catch {
    return false;
  }
}

const FIREBASE_DIAGNOSTIC_DISABLED = isFirebaseDisabledByDiagnostics();

const UI_AUTH_CACHE_KEY = 'khuyoot:ui:auth_cache';

function getStoredIdTokenCandidate(): string | null {
  try {
    const direct = localStorage.getItem('khuyoot:auth:token');
    if (direct) return direct;
  } catch {}

  try {
    const rawCache = localStorage.getItem(UI_AUTH_CACHE_KEY);
    if (rawCache) {
      const parsed = JSON.parse(rawCache);
      const token = typeof parsed?.idToken === 'string' ? parsed.idToken : null;
      if (token) return token;
    }
  } catch {}

  try {
    const authKey = `firebase:authUser:${firebaseConfig.apiKey || ''}:[DEFAULT]`;
    const rawAuth = localStorage.getItem(authKey);
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth);
      const token = parsed?.stsTokenManager?.accessToken;
      if (typeof token === 'string' && token) return token;
    }
  } catch {}

  return null;
}

// Detect private browsing mode where IndexedDB/localStorage might be blocked
function isPrivateBrowsingMode(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    // Test localStorage access
    const testKey = '__pb_test__';
    try {
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
    } catch {
      // localStorage is blocked or throws - likely private browsing
      return true;
    }

    // Test IndexedDB access (more reliable for Safari Private)
    if (!window.indexedDB) {
      return true;
    }

    return false;
  } catch {
    return true; // If detection fails, assume private browsing
  }
}

const PRIVATE_BROWSING_MODE = isPrivateBrowsingMode();

function isPersistenceDisabledByQuery(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location?.search ?? '');
    return params.get('persistence') === '0' || params.get('offline') === '0';
  } catch {
    return false;
  }
}

const PERSISTENCE_DISABLED = isPersistenceDisabledByQuery() || PRIVATE_BROWSING_MODE;

function getTestMode(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('testMode');
  } catch {
    return null;
  }
}

const TEST_MODE = getTestMode();

// DEV-only: Avoid IndexedDB persistence to prevent auth init hanging when IDB is blocked.
// Defaults:
// - PROD: local persistence (IndexedDB)
// - DEV: local persistence (IndexedDB) to share auth across tabs
// Overrides (DEV only):
// - ?authp=local|session|memory
// - localStorage khuyoot:diag:authPersistence = local|session|memory
const DIAG_AUTH_PERSISTENCE_KEY = 'khuyoot:diag:authPersistence';

function getAuthPersistenceMode(): 'local' | 'session' | 'memory' {
  try {
    if (typeof window === 'undefined') return import.meta.env.PROD ? 'local' : 'session';

    // CRITICAL: Force memory persistence in private browsing mode
    if (PRIVATE_BROWSING_MODE) {
      console.warn('[Firebase] Private browsing detected - using in-memory auth persistence');
      return 'memory';
    }

    const host = window.location?.hostname || '';
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';
    // Allow diagnostics and safer defaults on localhost even for PROD builds (e.g., preview/SPA deployments).
    const allowDiagnostics = !import.meta.env.PROD || isLocalHost;
    if (!allowDiagnostics) return 'local';

    const params = new URLSearchParams(window.location?.search ?? '');
    const fromQuery = (params.get('authp') || params.get('authPersistence') || '').toLowerCase();
    if (fromQuery === 'local' || fromQuery === 'session' || fromQuery === 'memory') return fromQuery;
    try {
      const fromStorage = String(localStorage.getItem(DIAG_AUTH_PERSISTENCE_KEY) || '').toLowerCase();
      // Avoid accidental "memory" persistence sticking across refreshes; only allow memory via query param.
      if (fromStorage === 'local' || fromStorage === 'session') return fromStorage;
    } catch {}
    // Default: on localhost use local to share auth across tabs; override via ?authp=session if needed.
    return isLocalHost ? 'local' : (import.meta.env.PROD ? 'local' : 'local');
  } catch {
    return import.meta.env.PROD ? 'local' : 'local';
  }
}

function getAuthPersistence() {
  const mode = getAuthPersistenceMode();
  if (mode === 'memory') return inMemoryPersistence;
  if (mode === 'session') return browserSessionPersistence;
  return browserLocalPersistence;
}

// Initialize Firebase
let app;
let auth: any;
let db: any;
let storage: any;
let isFirebaseInitialized = false;

// Simple timeout wrapper to prevent hanging Firestore calls
const withTimeoutReject = <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)),
  ]);
};

function inferImageExtensionFromContentType(contentType: string | undefined | null): string {
  const ct = String(contentType || '').toLowerCase();
  if (ct.includes('image/png')) return 'png';
  if (ct.includes('image/webp')) return 'webp';
  if (ct.includes('image/avif')) return 'avif';
  if (ct.includes('image/jpeg') || ct.includes('image/jpg')) return 'jpg';
  return 'jpg';
}

type AuthProbeResult = {
  ok: boolean;
  status?: number;
  timedOut?: boolean;
  error?: string;
};

const probeEndpoint = async (url: string, init: RequestInit, timeoutMs = 8000): Promise<AuthProbeResult> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const resp = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timeoutId);
    // Any response means network path is reachable (even 400/401/403)
    return { ok: true, status: resp.status };
  } catch (e: any) {
    const timedOut = e?.name === 'AbortError';
    return { ok: false, timedOut, error: e?.message || String(e) };
  }
};

function sanitizeStoragePathSegment(value: string): string {
  return String(value || '')
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function sanitizeFirestoreDocId(value: string): string {
  // Firestore doc ids cannot contain '/' and should be reasonably short.
  // Keep it permissive but safe.
  const base = String(value || '').trim();
  if (!base) return '';
  return base.replace(/[\/]/g, '_').slice(0, 256);
}

function normalizeVec3(input: any, fallback: [number, number, number]): [number, number, number] {
  if (Array.isArray(input) && input.length >= 3) {
    const vals = input.slice(0, 3).map((v) => Number(v));
    if (vals.every((v) => Number.isFinite(v))) return vals as [number, number, number];
  }
  if (input && typeof input === 'object') {
    const x = Number((input as any).x);
    const y = Number((input as any).y);
    const z = Number((input as any).z);
    if ([x, y, z].every((v) => Number.isFinite(v))) return [x, y, z];
  }
  return fallback;
}

const LOCAL_MEASUREMENT_TEMPLATES_KEY = 'khuyoot_measurement_templates';

const SAMPLE_MEASUREMENT_TEMPLATES: MeasurementTemplate[] = [
  {
    id: 'sample-dishdasha',
    name: 'قالب دشداشة أساسي',
    productType: 'dishdasha',
    baseImageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=60',
    points: [
      { id: 'neck', label: 'محيط الرقبة', x: 0.48, y: 0.1, direction: -90, order: 1 },
      { id: 'shoulder', label: 'الكتف', x: 0.36, y: 0.16, direction: 0, order: 2 },
      { id: 'chest', label: 'الصدر', x: 0.52, y: 0.25, direction: 90, order: 3 },
      { id: 'waist', label: 'الخصر', x: 0.5, y: 0.4, direction: 110, order: 4 },
      { id: 'hip', label: 'الحوض', x: 0.5, y: 0.52, direction: 120, order: 5 },
      { id: 'length', label: 'الطول', x: 0.62, y: 0.8, direction: 180, order: 6 }
    ],
    description: 'نموذج افتراضي لقياسات الدشداشة يمكن نسخه والتعديل عليه.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const loadLocalMeasurementTemplates = (): MeasurementTemplate[] => {
  if (typeof localStorage === 'undefined') return SAMPLE_MEASUREMENT_TEMPLATES;
  try {
    const raw = localStorage.getItem(LOCAL_MEASUREMENT_TEMPLATES_KEY);
    if (!raw) return SAMPLE_MEASUREMENT_TEMPLATES;
    const parsed = JSON.parse(raw) as MeasurementTemplate[];
    if (!Array.isArray(parsed) || parsed.length === 0) return SAMPLE_MEASUREMENT_TEMPLATES;
    return parsed;
  } catch (error) {
    console.warn('Unable to read measurement templates from local storage', error);
    return SAMPLE_MEASUREMENT_TEMPLATES;
  }
};

const persistLocalMeasurementTemplates = (templates: MeasurementTemplate[]) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_MEASUREMENT_TEMPLATES_KEY, JSON.stringify(templates));
  } catch (error) {
    console.warn('Unable to persist measurement templates locally', error);
  }
};

try {
  if (FIREBASE_DIAGNOSTIC_DISABLED) {
    console.warn('[Firebase] Disabled by diagnostics (skip initializeApp)');
    isFirebaseInitialized = false;
  } else {
    // Make initialization idempotent (important for Vite HMR and multi-entry bundles).
    app = firebaseApp.getApps().length ? firebaseApp.getApp() : firebaseApp.initializeApp(firebaseConfig);

    // Critical: use initializeAuth so we can select persistence before the auth instance
    // decides to open IndexedDB. This prevents "stuck initializing" in DEV.
    try {
      const persistence = getAuthPersistence();
      // IMPORTANT: pass as array to avoid SDK defaulting to IndexedDB persistence.
      auth = initializeAuth(app, { persistence: [persistence] }); 
      if (!import.meta.env.PROD) {
        console.log('[Firebase] Auth persistence:', getAuthPersistenceMode());
      }
    } catch (e) {
      // Fallback for HMR / already-initialized cases.
      auth = getAuth(app); 
      if (!import.meta.env.PROD) {
        console.warn('[Firebase] initializeAuth failed; using getAuth fallback', e);
      }

      // Best-effort: ensure persistence matches our desired mode even in fallback.
      try {
        const persistence = getAuthPersistence();
        setPersistence(auth, persistence).catch((err) => {
          if (!import.meta.env.PROD) {
            console.warn('[Firebase] setPersistence failed in fallback', err);
          }
        });
      } catch {
        // ignore
      }
    }

    // Initialize Firestore with Persistent Local Cache (IndexedDB)
    // This allows getDocFromCache to work and avoids the 25s "Offline Sync" hang on refresh.
    try {
      if (PERSISTENCE_DISABLED || TEST_MODE === 'D') {
        db = getFirestore(app);
        const reason = PRIVATE_BROWSING_MODE ? 'Private Browsing Mode' : (TEST_MODE === 'D' ? 'Test Mode D' : 'persistence=0');
        console.warn(`[Firebase] Firestore persistence disabled (${reason})`);
      } else {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
          })
        });
        console.log('[Firebase] Firestore initialized with Multi-Tab Persistence');
      }
    } catch (e: any) {
      if (e.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time with older settings,
        // but persistentMultipleTabManager should handle it. Fallback just in case.
        db = getFirestore(app);
        console.warn('[Firebase] Firestore persistence fallback', e);
      } else {
        db = getFirestore(app);
        console.error('[Firebase] Firestore initialization failed, using default', e);
      }
    }

    // Reduce Firestore log noise (especially offline warnings) to errors only
    try { setLogLevel('error'); } catch {}
    storage = getStorage(app);
    isFirebaseInitialized = true;
  }
} catch (error) {
  console.error("❌ Firebase Initialization Error:", error);
  console.error("🔧 Check your .env file and Firebase config");
}

// Helper to map Firebase User to App User (Basic)
export const mapFirebaseUser = (fbUser: FirebaseUser): User => {
  return {
    id: fbUser.uid,
    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
    email: fbUser.email || '',
    avatar: fbUser.photoURL || undefined,
    isGuest: false,
    joinDate: fbUser.metadata.creationTime ? new Date(fbUser.metadata.creationTime).toLocaleDateString('ar-OM') : new Date().toLocaleDateString('ar-OM'),
    role: 'user' // Default, will be overwritten by Firestore fetch
  };
};

// Export db and storage for use in other services
export { db, storage };

// Module-scoped normalization helper to avoid `this` binding pitfalls
function normalizeProductForSave(payload: any): any {
  const out: any = { ...payload };

  const arr = Array.isArray(out.images) ? out.images.filter(Boolean) : [];
  const legacy = Array.isArray(out.imageUrls) ? out.imageUrls.filter(Boolean) : [];

  if (arr.length === 0 && legacy.length > 0) {
    out.images = legacy.slice();
  } else if (arr.length > 0) {
    out.images = arr;
  } else if (out.image) {
    out.images = [out.image];
  } else {
    out.images = [];
  }

  if (typeof out.coverImageIndex !== 'number' || out.coverImageIndex < 0 || out.coverImageIndex >= out.images.length) {
    out.coverImageIndex = 0;
  }
  if (!out.image || (out.images.length > 0 && out.image !== out.images[out.coverImageIndex])) {
    out.image = out.images[out.coverImageIndex] || out.image || '';
  }

  if (!out.categoryId) {
    out.categoryId = (typeof out.category === 'string' && out.category.trim()) ? out.category : 'dishdasha';
  }

  // Firestore does not allow `undefined` values.
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }

  return out;
}

export const firebaseService = {
  isInitialized: () => isFirebaseInitialized,
  // Use getter to always return current auth instance (fixes race condition)
  get auth() { return auth; },

  // --- Order Management ---

  async getOrder(orderId: string): Promise<any | null> {
    if (!isFirebaseInitialized) return null;
    try {
      const orderRef = doc(db, 'orders', orderId);
      const snap = await getDoc(orderRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() };
    } catch (e) {
      console.error('firebaseService.getOrder error', e);
      return null;
    }
  },

  async updateOrder(orderId: string, updates: any): Promise<void> {
    if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error('firebaseService.updateOrder error', e);
      throw e;
    }
  },

  async permanentlyDeleteAccount(userId: string): Promise<void> {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error('Not authenticated or user mismatch');
    }

    const uid = sanitizeFirestoreDocId(userId);

    // 1. Storage Cleanup - Handle what we can
    try {
      // Delete avatar
      const avatarRef = storageRef(storage, `avatars/${uid}.webp`);
      await deleteObject(avatarRef).catch(() => {});

      // Delete user product folders if any (listing usually requires specific rules, but we'll try)
      // Products usually under products/{tailorId}/...
      // Portraits/Generations might be elsewhere.
    } catch (e) {
      console.warn('[Cleanup] Storage cleanup partially skipped or failed', e);
    }

    // 2. Firestore Cleanup - Delete associated documents
    const collectionsToCleanup = [
      { name: 'orders', field: 'userId' },
      { name: 'visualizer_generations', field: 'userId' },
      { name: 'visualizer_camera_presets', field: 'userId' },
      { name: 'credit_transactions', field: 'user_id' },
      { name: 'measurement_profiles', field: 'userId' },
      { name: 'wishlist', field: 'userId' },
      { name: 'product_likes', field: 'userId' },
      { name: 'design_analytics', field: 'userId' },
      { name: 'notifications', field: 'userId' },
      { name: 'family_profiles', field: 'headUserId' }
    ];

    for (const collInfo of collectionsToCleanup) {
      try {
        const q = query(collection(db, collInfo.name), where(collInfo.field, '==', uid));
        const snap = await getDocs(q);
        const batch = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(batch);
      } catch (e) {
        console.warn(`[Cleanup] Failed to clean up collection: ${collInfo.name}`, e);
      }
    }

    // Special case: subcollections (users/{userId}/designs)
    try {
      const designColl = collection(db, `users/${uid}/designs`);
      const designSnap = await getDocs(designColl);
      const designBatch = designSnap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(designBatch);
    } catch (e) {
      console.warn('[Cleanup] Failed to clean up designs subcollection', e);
    }

    // Delete user profile
    try {
      await deleteDoc(doc(db, 'user_profiles', uid));
    } catch (e) {
      console.warn('[Cleanup] Failed to delete user_profile document', e);
    }

    // 3. Final Step: Delete the Auth user
    // Note: Re-authentication may be required if the session is old.
    try {
      await deleteUser(currentUser);
    } catch (e: any) {
      console.error('Final deleteUser failed', e);
      if (e.code === 'auth/requires-recent-login') {
        throw new Error('REAUTHENTICATION_REQUIRED');
      }
      throw e;
    }
  },

  async deleteUserAIHistory(userId: string): Promise<void> {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    const uid = sanitizeFirestoreDocId(userId);

    // AI/Designer related collections
    const collections = [
      { name: 'visualizer_generations', field: 'userId' },
      { name: 'visualizer_camera_presets', field: 'userId' },
      { name: 'design_analytics', field: 'userId' }
    ];

    for (const collInfo of collections) {
      try {
        const q = query(collection(db, collInfo.name), where(collInfo.field, '==', uid));
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map(d => deleteDoc(d.ref).catch(() => {})));
      } catch (e) {
        console.warn(`[AI Cleanup] ${collInfo.name} failed`, e);
      }
    }

    // Subcollection: users/{id}/designs
    try {
      const designColl = collection(db, `users/${uid}/designs`);
      const designSnap = await getDocs(designColl);
      await Promise.all(designSnap.docs.map(d => deleteDoc(d.ref).catch(() => {})));
    } catch (e) {
      console.warn('[AI Cleanup] designs failed', e);
    }
  },

    async ensureFirebaseSessionFromStoredToken(): Promise<any> {
      if (!isFirebaseInitialized) return null;
      if (auth.currentUser) return auth.currentUser;

      const idToken = getStoredIdTokenCandidate();
      if (!idToken) return null;

      try {
        const res = await fetch('/api/auth/custom-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({ idToken }),
        });

        if (!res.ok) {
          return null;
        }

        const data = await res.json();
        const customToken = typeof data?.customToken === 'string' ? data.customToken : '';
        if (!customToken) return null;

        const credential = await signInWithCustomToken(auth, customToken);
        return credential?.user || auth.currentUser;
      } catch (error) {
        console.warn('[Firebase] Failed to restore SDK auth session from stored token:', error);
        return null;
      }
    },

    async waitForAuth(maxWaitMs = 1500): Promise<any> {
      if (!isFirebaseInitialized) return null;
      if (auth.currentUser) return auth.currentUser;
      await this.ensureFirebaseSessionFromStoredToken();
      if (auth.currentUser) return auth.currentUser;
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          unsub();
          resolve(auth.currentUser);
        }, maxWaitMs);
        const unsub = onAuthStateChanged(auth, (user) => {
          clearTimeout(timeout);
          unsub();
          resolve(user);
        });
      });
    },

  async changePassword(newPassword: string): Promise<void> {
    if (!isFirebaseInitialized || !auth.currentUser) {
      throw new Error('User not authenticated');
    }
    
    try {
      const user = auth.currentUser;
      await updatePassword(user, newPassword);
    } catch (error: any) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  // ============================================================
  // CREDIT SYSTEM (global_settings, user_profiles, credit_transactions)
  // ============================================================

  async getCreditPricing(): Promise<Record<string, { credit_cost: number; is_active: boolean }>> {
    if (!isFirebaseInitialized) return {};
    try {
      const refCol = collection(db, 'global_settings');
      const snap = await getDocs(refCol);
      const out: Record<string, { credit_cost: number; is_active: boolean }> = {};
      snap.docs.forEach((d) => {
        const data: any = d.data() || {};
        out[d.id] = {
          credit_cost: typeof data.credit_cost === 'number' ? data.credit_cost : 0,
          is_active: data.is_active !== false,
        };
      });
      return out;
    } catch (e) {
      console.warn('[CreditSystem] getCreditPricing failed', e);
      return {};
    }
  },

  // ============================================================
  // VISUALIZER CAMERA PRESETS
  // ============================================================

  async saveVisualizerCameraPreset(params: {
    name: string;
    cameraPosition: [number, number, number];
    cameraTarget: [number, number, number];
    cameraFov: number;
    cameraInfo?: { yaw?: number; pitch?: number; distance?: number } | null;
    dofEnabled?: boolean;
    dofFocusDistance?: number;
    dofAperture?: number;
    dofFocalLength?: number;
    thumbnailDataUrl?: string | null;
  }): Promise<{ id: string }> {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    if (!auth.currentUser) throw new Error('Not authenticated');

    const name = String(params?.name || '').trim();
    if (!name) throw new Error('Preset name is required');

    const uid = auth.currentUser.uid;
    const payload = {
      userId: uid,
      name,
      cameraPosition: normalizeVec3(params.cameraPosition, [0, 2, 5]),
      cameraTarget: normalizeVec3(params.cameraTarget, [0, 2, 0]),
      cameraFov: params.cameraFov,
      cameraInfo: params.cameraInfo || null,
      dofEnabled: params.dofEnabled ?? false,
      dofFocusDistance: typeof params.dofFocusDistance === 'number' ? params.dofFocusDistance : 5,
      dofAperture: typeof params.dofAperture === 'number' ? params.dofAperture : 2.8,
      dofFocalLength: typeof params.dofFocalLength === 'number' ? params.dofFocalLength : 50,
      thumbnailDataUrl: params.thumbnailDataUrl || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const refCol = collection(db, 'visualizer_camera_presets');
    const docRef = await addDoc(refCol, payload as any);
    return { id: docRef.id };
  },

  async getVisualizerCameraPresets(): Promise<Array<{ id: string; name: string; cameraPosition: [number, number, number]; cameraTarget: [number, number, number]; cameraFov: number; cameraInfo?: { yaw?: number; pitch?: number; distance?: number } | null; dofEnabled?: boolean; dofFocusDistance?: number; dofAperture?: number; dofFocalLength?: number; thumbnailDataUrl?: string | null }>> {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    if (!auth.currentUser) throw new Error('Not authenticated');

    const uid = auth.currentUser.uid;
    const refCol = collection(db, 'visualizer_camera_presets');
    const q = query(refCol, where('userId', '==', uid), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data: any = d.data() || {};
      return {
        id: d.id,
        name: String(data.name || ''),
        cameraPosition: normalizeVec3(data.cameraPosition, [0, 2, 5]),
        cameraTarget: normalizeVec3(data.cameraTarget, [0, 2, 0]),
        cameraFov: typeof data.cameraFov === 'number' ? data.cameraFov : 45,
        cameraInfo: data.cameraInfo || null,
        dofEnabled: data.dofEnabled ?? false,
        dofFocusDistance: typeof data.dofFocusDistance === 'number' ? data.dofFocusDistance : 5,
        dofAperture: typeof data.dofAperture === 'number' ? data.dofAperture : 2.8,
        dofFocalLength: typeof data.dofFocalLength === 'number' ? data.dofFocalLength : 50,
        thumbnailDataUrl: typeof data.thumbnailDataUrl === 'string' ? data.thumbnailDataUrl : null,
      };
    });
  },

  async deleteVisualizerCameraPreset(id: string): Promise<void> {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    if (!auth.currentUser) throw new Error('Not authenticated');
    const docId = sanitizeFirestoreDocId(id);
    if (!docId) throw new Error('Invalid preset id');
    const refDoc = doc(db, 'visualizer_camera_presets', docId);
    await deleteDoc(refDoc);
  },

  async getVisualizerGenerations(limitCount: number = 20): Promise<Array<{ id: string; imageUrl: string; promptText: string; createdAt: number; aspectLabel?: string | null }>> {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    if (!auth.currentUser) throw new Error('Not authenticated');

    const uid = auth.currentUser.uid;
    const refCol = collection(db, 'visualizer_generations');
    const q = query(refCol, where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data: any = d.data() || {};
      const createdAt = data?.createdAt?.toMillis ? data.createdAt.toMillis() : (data?.createdAt ? Date.parse(data.createdAt) : Date.now());
      return {
        id: d.id,
        imageUrl: String(data.imageUrl || ''),
        promptText: String(data.promptText || ''),
        createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
        aspectLabel: data.aspectLabel ?? null,
      };
    });
  },

  async upsertCreditPricing(params: { feature_name: string; credit_cost: number; is_active?: boolean }): Promise<void> {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    const feature = sanitizeFirestoreDocId(params.feature_name);
    if (!feature) throw new Error('feature_name is required');
    const refDoc = doc(db, 'global_settings', feature);
    await setDoc(
      refDoc,
      {
        feature_name: feature,
        credit_cost: Math.max(0, Math.floor(Number(params.credit_cost || 0))),
        is_active: params.is_active !== false,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  async getUserCreditProfile(userId: string): Promise<{ user_id: string; credit_balance: number; tier?: string } | null> {
    if (!isFirebaseInitialized) return null;
    const uid = sanitizeFirestoreDocId(userId);
    if (!uid) return null;
    await this.waitForAuth(4000);
    console.log('[CreditSystem] getUserCreditProfile:', { uid, hasCurrentUser: !!auth.currentUser, currentUserUid: auth.currentUser?.uid });
    try {
      const refDoc = doc(db, 'user_profiles', uid);
      const snap = await getDoc(refDoc);
      console.log('[CreditSystem] Firestore doc exists:', snap.exists());
      if (!snap.exists()) return null;
      const data: any = snap.data() || {};
      const profile = {
        user_id: uid,
        credit_balance: typeof data.credit_balance === 'number' ? data.credit_balance : 0,
        tier: typeof data.tier === 'string' ? data.tier : undefined,
      };
      console.log('[CreditSystem] Profile loaded:', profile);
      return profile;
    } catch (e) {
      console.error('[CreditSystem] getUserCreditProfile failed:', e);
      return null;
    }
  },

  async ensureUserCreditProfile(userId: string): Promise<void> {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    const uid = sanitizeFirestoreDocId(userId);
    if (!uid) throw new Error('userId is required');
    const refDoc = doc(db, 'user_profiles', uid);
    const snap = await getDoc(refDoc);
    if (snap.exists()) return;
    
    // Starter balance for new users.
    const INITIAL_CREDITS = 90;
    
    await setDoc(
      refDoc,
      {
        user_id: uid,
        credit_balance: INITIAL_CREDITS,
        tier: 'Free',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  async reserveCredits(params: {
    userId: string;
    actionType: string;
    cost: number;
    meta?: Record<string, any>;
  }): Promise<{ transaction_id: string; new_balance: number }>
  {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    const uid = sanitizeFirestoreDocId(params.userId);
    const action = sanitizeFirestoreDocId(params.actionType);
    const cost = Math.max(0, Math.floor(Number(params.cost || 0)));
    if (!uid) throw new Error('userId is required');
    if (!action) throw new Error('actionType is required');
    if (cost <= 0) throw new Error('cost must be > 0');
    await this.waitForAuth(4000);
    if (!auth.currentUser || auth.currentUser.uid !== uid) {
      throw new Error('AUTH_REQUIRED');
    }

    const profileRef = doc(db, 'user_profiles', uid);
    const txRef = doc(collection(db, 'credit_transactions'));

    const result = await runTransaction(db, async (tx) => {
      const profileSnap = await tx.get(profileRef);
      const current = profileSnap.exists() ? (profileSnap.data() as any) : null;
      const currentBalance = current && typeof current.credit_balance === 'number' ? current.credit_balance : 0;
      if (currentBalance < cost) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      // Apply hold by decrementing now, then finalize or refund later.
      const newBalance = currentBalance - cost;
      if (profileSnap.exists()) {
        tx.update(profileRef, {
          credit_balance: newBalance,
          last_credit_tx: txRef.id,
          last_credit_action: action,
          last_credit_cost: cost,
          last_credit_op: 'reserve',
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.set(profileRef, {
          user_id: uid,
          credit_balance: newBalance,
          tier: 'Free',
          last_credit_tx: txRef.id,
          last_credit_action: action,
          last_credit_cost: cost,
          last_credit_op: 'reserve',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      tx.set(txRef, {
        transaction_id: txRef.id,
        user_id: uid,
        amount: -cost,
        action_type: action,
        status: 'pending',
        meta: params.meta || {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { transaction_id: txRef.id, new_balance: newBalance };
    });

    return result;
  },

  async finalizeCreditTransaction(params: { transactionId: string }): Promise<void> {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    const id = sanitizeFirestoreDocId(params.transactionId);
    if (!id) throw new Error('transactionId is required');
    await this.waitForAuth(4000);
    if (!auth.currentUser) throw new Error('AUTH_REQUIRED');
    const refDoc = doc(db, 'credit_transactions', id);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(refDoc);
      if (!snap.exists()) return;
      const data: any = snap.data() || {};
      if (data.status !== 'pending') return;
      tx.update(refDoc, { status: 'completed', updatedAt: serverTimestamp() });
    });
  },

  async refundCreditTransaction(params: { transactionId: string }): Promise<void> {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    const id = sanitizeFirestoreDocId(params.transactionId);
    if (!id) throw new Error('transactionId is required');
    await this.waitForAuth(4000);
    if (!auth.currentUser) throw new Error('AUTH_REQUIRED');
    const txRef = doc(db, 'credit_transactions', id);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(txRef);
      if (!snap.exists()) return;
      const data: any = snap.data() || {};
      if (data.status !== 'pending') return;
      const uid = String(data.user_id || '');
      const amount = typeof data.amount === 'number' ? data.amount : 0;
      const refund = Math.abs(amount);
      if (!uid || refund <= 0) {
        tx.update(txRef, { status: 'failed', updatedAt: serverTimestamp() });
        return;
      }

      const profileRef = doc(db, 'user_profiles', uid);
      const profileSnap = await tx.get(profileRef);
      const current = profileSnap.exists() ? (profileSnap.data() as any) : null;
      const currentBalance = current && typeof current.credit_balance === 'number' ? current.credit_balance : 0;
      const newBalance = currentBalance + refund;

      if (profileSnap.exists()) {
        tx.update(profileRef, {
          credit_balance: newBalance,
          last_credit_tx: id,
          last_credit_action: String(data.action_type || ''),
          last_credit_cost: refund,
          last_credit_op: 'refund',
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.set(profileRef, {
          user_id: uid,
          credit_balance: newBalance,
          tier: 'Free',
          last_credit_tx: id,
          last_credit_action: String(data.action_type || ''),
          last_credit_cost: refund,
          last_credit_op: 'refund',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      tx.update(txRef, { status: 'failed', updatedAt: serverTimestamp() });
    });
  },

  async adminAdjustCredits(params: {
    userId: string;
    amount: number;
    reason: string;
    adminId?: string;
  }): Promise<{ new_balance: number; transaction_id: string }>
  {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    const uid = sanitizeFirestoreDocId(params.userId);
    if (!uid) throw new Error('userId is required');
    await this.waitForAuth(4000);
    if (!auth.currentUser || auth.currentUser.uid !== uid) {
      throw new Error('AUTH_REQUIRED');
    }
    const amount = Math.floor(Number(params.amount || 0));
    if (!Number.isFinite(amount) || amount === 0) throw new Error('amount must be a non-zero integer');

    const reason = String(params.reason || '').trim();
    if (!reason) throw new Error('reason is required');

    const profileRef = doc(db, 'user_profiles', uid);
    const txRef = doc(collection(db, 'credit_transactions'));

    const result = await runTransaction(db, async (tx) => {
      const profileSnap = await tx.get(profileRef);
      const current = profileSnap.exists() ? (profileSnap.data() as any) : null;
      const currentBalance = current && typeof current.credit_balance === 'number' ? current.credit_balance : 0;
      const newBalance = Math.max(0, currentBalance + amount);

      if (profileSnap.exists()) {
        tx.update(profileRef, { credit_balance: newBalance, updatedAt: serverTimestamp() });
      } else {
        tx.set(profileRef, {
          user_id: uid,
          credit_balance: newBalance,
          tier: 'Free',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      tx.set(txRef, {
        transaction_id: txRef.id,
        user_id: uid,
        amount,
        action_type: 'MANUAL_ADJUSTMENT',
        status: 'completed',
        meta: {
          reason,
          admin_id: params.adminId || null,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { new_balance: newBalance, transaction_id: txRef.id };
    });

    return result;
  },

  /**
   * Purchase credits for a user (user-accessible)
   * Creates a completed purchase transaction, updates credit balance, and tracks purchase history
   */
  async purchaseCredits(params: {
    userId: string;
    amount: number;
    packageType?: string;
    packageName?: string;
    amountPaid?: number;
    paymentMethod?: string;
    paymentReference?: string;
    isSubscription?: boolean;
    subscriptionPeriod?: { start: string; end: string };
  }): Promise<{ new_balance: number; transaction_id: string; purchase_id: string }>
  {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    const uid = sanitizeFirestoreDocId(params.userId);
    if (!uid) throw new Error('userId is required');
    await this.waitForAuth(4000);
    if (!auth.currentUser || auth.currentUser.uid !== uid) {
      throw new Error('AUTH_REQUIRED');
    }
    await this.ensureUserCreditProfile(uid);
    const amount = Math.floor(Number(params.amount || 0));
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount must be a positive integer');

    const profileRef = doc(db, 'user_profiles', uid);
    const txRef = doc(collection(db, 'credit_transactions'));
    const purchaseRef = doc(collection(db, 'purchase_history'));

    const result = await runTransaction(db, async (tx) => {
      const profileSnap = await tx.get(profileRef);
      const current = profileSnap.exists() ? (profileSnap.data() as any) : null;
      const currentBalance = current && typeof current.credit_balance === 'number' ? current.credit_balance : 0;
      const newBalance = currentBalance + amount;

      // Create the purchase transaction (omit undefined fields)
      const txData: any = {
        transaction_id: txRef.id,
        user_id: uid,
        amount,
        action_type: 'purchase',
        status: 'completed',
        meta: {
          purchase_type: params.packageType || 'credit_package',
          package_name: params.packageName || 'Custom Package',
          amount_paid: params.amountPaid || 0,
          is_subscription: params.isSubscription || false,
          timestamp: Date.now(),
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Add optional meta fields only if defined
      if (params.paymentMethod) txData.meta.payment_method = params.paymentMethod;
      if (params.paymentReference) txData.meta.payment_reference = params.paymentReference;
      
      tx.set(txRef, txData);

      // Create detailed purchase history record (omit undefined fields)
      const purchaseData: any = {
        purchase_id: purchaseRef.id,
        transaction_id: txRef.id,
        user_id: uid,
        
        // Package details
        package_type: params.packageType || 'custom',
        package_name: params.packageName || 'Custom Package',
        
        // Financial info
        amount_paid: params.amountPaid || 0,
        currency: 'OMR',
        credits_purchased: amount,
        
        // Balance tracking
        balance_before: currentBalance,
        balance_after: newBalance,
        
        // Status and payment
        status: 'completed',
        payment_method: params.paymentMethod || 'other',
        
        // Timestamps
        purchase_date: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Subscription info
        is_subscription: params.isSubscription || false,
      };
      
      // Add optional fields only if defined
      if (params.paymentReference) purchaseData.payment_reference = params.paymentReference;
      if (params.subscriptionPeriod?.start) purchaseData.subscription_period_start = params.subscriptionPeriod.start;
      if (params.subscriptionPeriod?.end) purchaseData.subscription_period_end = params.subscriptionPeriod.end;
      
      tx.set(purchaseRef, purchaseData);

      // Update user profile with PURCHASE operation
      if (profileSnap.exists()) {
        tx.update(profileRef, { 
          credit_balance: newBalance, 
          last_credit_op: 'purchase',
          last_credit_tx: txRef.id,
          last_purchase_id: purchaseRef.id,
          updatedAt: serverTimestamp() 
        });
      } else {
        tx.set(profileRef, {
          user_id: uid,
          credit_balance: newBalance,
          last_credit_op: 'purchase',
          last_credit_tx: txRef.id,
          last_purchase_id: purchaseRef.id,
          tier: 'Free',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      return { new_balance: newBalance, transaction_id: txRef.id, purchase_id: purchaseRef.id };
    });

    return result;
  },

  /**
   * Get purchase history for a user
   */
  async getPurchaseHistory(params: {
    userId: string;
    limit?: number;
  }): Promise<any[]> {
    if (!isFirebaseInitialized) return [];
    const uid = sanitizeFirestoreDocId(params.userId);
    if (!uid) return [];
    await this.waitForAuth(4000);
    if (!auth.currentUser || auth.currentUser.uid !== uid) return [];

    try {
      const historyRef = collection(db, 'purchase_history');
      const q = query(
        historyRef,
        where('user_id', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(params.limit || 50)
      );
      const snapshot = await getDocs(q);
      console.log('📦 getPurchaseHistory: Found', snapshot.docs.length, 'records for user:', uid);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ getPurchaseHistory error:', error);
      return [];
    }
  },

  /**
   * Get credit transactions for a user (fallback for legacy purchases)
   */
  async getCreditTransactions(params: {
    userId: string;
    limit?: number;
  }): Promise<any[]> {
    if (!isFirebaseInitialized) return [];
    const uid = sanitizeFirestoreDocId(params.userId);
    if (!uid) return [];
    await this.waitForAuth(4000);
    if (!auth.currentUser || auth.currentUser.uid !== uid) return [];

    try {
      const txRef = collection(db, 'credit_transactions');
      const q = query(
        txRef,
        where('user_id', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(params.limit || 50)
      );
      const snapshot = await getDocs(q);
      console.log('📝 getCreditTransactions: Found', snapshot.docs.length, 'records for user:', uid);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ getCreditTransactions error:', error);
      return [];
    }
  },
  
  async findUserByLoginId(loginId: string): Promise<{ uid: string; email: string | '' } | null> {
    if (!isFirebaseInitialized) return null;
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('loginId', '==', loginId));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const docSnap = snap.docs[0];
      const data: any = docSnap.data();
      return { uid: docSnap.id, email: data.email || '' };
    } catch (e) {
      console.error('findUserByLoginId error', e);
      return null;
    }
  },

  async findUserByEmail(email: string): Promise<{ uid: string; email: string | '' } | null> {
    if (!isFirebaseInitialized) return null;
    try {
      const normalized = String(email || '').trim().toLowerCase();
      if (!normalized) return null;
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', normalized));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const docSnap = snap.docs[0];
      const data: any = docSnap.data();
      return { uid: docSnap.id, email: data.email || '' };
    } catch (e) {
      console.error('findUserByEmail error', e);
      return null;
    }
  },

  async findUserByPhone(phoneDigits: string): Promise<{ uid: string; email: string | '' } | null> {
    if (!isFirebaseInitialized) return null;
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', phoneDigits));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const docSnap = snap.docs[0];
      const data: any = docSnap.data();
      return { uid: docSnap.id, email: data.email || '' };
    } catch (e) {
      console.error('findUserByPhone error', e);
      return null;
    }
  },

  async getUserById(uid: string): Promise<any | null> {
    if (!isFirebaseInitialized) return null;
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return null;
      return snap.data();
    } catch (e) {
      console.error('getUserById error', e);
      return null;
    }
  },
  generateTempEmailFromPhone(phoneDigits: string): string {
    const digits = (phoneDigits || '').replace(/[^0-9]/g, '');
    return `${digits}@khuyoot.app`;
  },

  async diagnoseAuthConnectivity(): Promise<{
    online: boolean;
    apiKeyPrefix: string;
    projectId: string;
    authDomain: string;
    origin: string;
    href: string;
    identityToolkitV1: AuthProbeResult;
    identityToolkitV3: AuthProbeResult;
    secureToken: AuthProbeResult;
    persistenceMode: string;
  }> {
    const apiKey = firebaseConfig.apiKey || '';
    const apiKeyPrefix = apiKey ? apiKey.slice(0, 8) : 'missing';
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const origin = typeof window !== 'undefined' ? (window.location?.origin || '') : '';
    const href = typeof window !== 'undefined' ? (window.location?.href || '') : '';

    // Firebase Auth has historically used the v1 endpoint below.
    // Some networks/extensions will allow identitytoolkit.googleapis.com but block www.googleapis.com,
    // and some API-key restriction errors return non-CORS responses that surface as "network-request-failed".
    const identityEndpointV1 = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const identityEndpointV3 = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=${apiKey}`;
    const secureTokenEndpoint = `https://securetoken.googleapis.com/v1/token?key=${apiKey}`;

    const identityToolkitV1 = await probeEndpoint(
      identityEndpointV1,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Use a dummy payload; a 400 response still indicates reachability.
        body: JSON.stringify({ email: 'probe@khuyoot.app', password: 'invalid', returnSecureToken: true }),
      },
      8000
    );

    const identityToolkitV3 = await probeEndpoint(
      identityEndpointV3,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Dummy payload; endpoint should respond with JSON error if reachable.
        body: JSON.stringify({ email: 'probe@khuyoot.app', password: 'invalid', returnSecureToken: true }),
      },
      8000
    );

    const secureToken = await probeEndpoint(
      secureTokenEndpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        // Dummy payload to check reachability.
        body: 'grant_type=refresh_token&refresh_token=invalid',
      },
      8000
    );

    return {
      online,
      apiKeyPrefix,
      projectId: firebaseConfig.projectId || 'missing',
      authDomain: firebaseConfig.authDomain || 'missing',
      origin,
      href,
      identityToolkitV1,
      identityToolkitV3,
      secureToken,
      persistenceMode: getAuthPersistenceMode(),
    };
  },
  
  async login(email: string, pass: string): Promise<User> {
    if (!isFirebaseInitialized) throw new Error("Firebase not configured");

    // NOTE: Using REST API bypass because signInWithEmailAndPassword hangs in some environments.
    // See: src/services/authBypass.ts for detailed explanation.
    try {
      const { signInWithEmailPasswordBypass } = await import('../src/services/authBypass');
      const result = await signInWithEmailPasswordBypass(email, pass);

      // Best effort: wait for Firebase SDK auth session, but do not fail login if delayed.
      // AuthProvider listens to auth-bypass-login and can complete session restoration.
      const sdkUser = await this.waitForAuth(5000);
      const expectedUid = result.user?.uid;
      if (!sdkUser || (expectedUid && sdkUser.uid !== expectedUid)) {
        console.warn('[Firebase] SDK session sync delayed after REST login; continuing with REST session data');
      }
      
      // Return immediately with user data from REST API response
      // The SDK's onAuthStateChanged will fire asynchronously when it picks up the stored tokens
      const user: User = {
        id: sdkUser?.uid || result.user?.uid,
        name: email.split('@')[0], // Will be updated by Firestore fetch
        email: email,
        avatar: undefined,
        isGuest: false,
        joinDate: new Date().toLocaleDateString('ar-OM'),
        role: 'user' // Will be updated by Firestore fetch
      };
      
      return user;
    } catch (error) {
      console.error('[Firebase] REST bypass failed, falling back to SDK:', error);
      // Fallback to SDK method (though it may hang)
      const credential = await signInWithEmailAndPassword(auth, email, pass);
      return mapFirebaseUser(credential.user);
    }
  },

  async register(email: string, pass: string, name: string, role: UserRole, merchantInfo?: any): Promise<User> {
    if (!isFirebaseInitialized) throw new Error("Firebase not configured");
    
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(credential.user, { displayName: name });
    
    // Save User Data to Firestore
    try {
      const userData: any = {
        id: credential.user.uid,
        uid: credential.user.uid,
        name,
        email,
        role: role,
        joinDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        profileImage: '',
        boardImage: '',
        bio: '',
        createdByAdmin: false,
        requirePasswordChange: false
      };

      // Add merchant info if provided
      if (merchantInfo) {
        if (merchantInfo.shopType) userData.shopType = merchantInfo.shopType;
        if (merchantInfo.phone) userData.phone = merchantInfo.phone;
        if (merchantInfo.loginId) userData.loginId = merchantInfo.loginId;
        if (merchantInfo.gender) userData.gender = merchantInfo.gender; // حفظ الجنس
        if (merchantInfo.region) userData.region = merchantInfo.region; // حفظ المنطقة
        if (merchantInfo.ageGroup) userData.ageGroup = merchantInfo.ageGroup; // حفظ الفئة العمرية
        if (merchantInfo.tailorGender) userData.tailorGender = merchantInfo.tailorGender; // حفظ تخصص الخياط
        if (merchantInfo.location) userData.location = merchantInfo.location;
        if (merchantInfo.specialization) userData.specialization = merchantInfo.specialization;
        if (merchantInfo.experience) userData.experience = merchantInfo.experience || '';
        
        // For tailor role, add shopName (same as name if not provided)
        if (role === 'tailor' && !userData.shopName) {
          userData.shopName = name;
        }
        
        // For merchants, set approval status as pending
        if (role === 'tailor' || role === 'shop') {
          userData.approvalStatus = 'pending';
        }
      }

      await setDoc(doc(db, 'users', credential.user.uid), userData);
      await this.ensureUserCreditProfile(credential.user.uid);
    } catch (e) {
      console.error("Error saving user data", e);
    }

    const user = mapFirebaseUser(credential.user);
    user.role = role;
    if (merchantInfo?.phone) user.phone = merchantInfo.phone;
    if (merchantInfo?.gender) user.gender = merchantInfo.gender; // إضافة الجنس للكائن المرتجع
    if (merchantInfo?.tailorGender) user.tailorGender = merchantInfo.tailorGender; // إضافة تخصص الخياط
    if (merchantInfo?.shopType) user.shopType = merchantInfo.shopType;
    return user;
  },

  async getUserProfile(uid: string): Promise<User | null> {
    if (!isFirebaseInitialized) return null;

    const LS_KEY = `khuyoot:user-profile:${uid}`;

    // SOLUTION C: LocalStorage Mirror (Immediate return)
    if (TEST_MODE === 'C') {
      try {
        const cached = localStorage.getItem(LS_KEY);
        if (cached) {
          console.log(`[FirebaseService] [Test C] Returning identity from LocalStorage mirror`);
          return JSON.parse(cached);
        }
      } catch (e) { /* ignore */ }
    }

    try {
      // FORCE SERVER FETCH for profiles to avoid stale "customer" roles from cache
      const userRef = doc(db, 'users', uid);
      const profileRef = doc(db, 'user_profiles', uid);
      
      let userSnap;
      let profileSnap;

      try {
        [userSnap, profileSnap] = await Promise.all([
          getDocFromServer(userRef),
          getDocFromServer(profileRef)
        ]);
        console.log(`[FirebaseService] User profile loaded from SERVER for ${uid}`);
      } catch (serverError) {
        // Fallback to cache if server is offline
        console.warn(`[FirebaseService] Server fetch failed for profile, trying cache:`, serverError);
        [userSnap, profileSnap] = await Promise.all([
          getDocFromCache(userRef),
          getDocFromCache(profileRef)
        ]);
      }

      if (userSnap.exists() || profileSnap.exists()) {
        const userData = userSnap.exists() ? userSnap.data() : {};
        const profileData = profileSnap.exists() ? profileSnap.data() : {};
        
        // Merge them carefully to avoid overwriting valid data with null/undefined
        const merged = { ...userData };
        Object.keys(profileData).forEach(key => {
          if (profileData[key] !== undefined && profileData[key] !== null) {
            merged[key] = profileData[key];
          }
        });

        // Ensure phone field consistency
        const anyPhone = merged.phone || (merged as any).phoneNumber || (merged as any).phone_number || (merged as any).contactNumber ||
                         userData.phone || (userData as any).phoneNumber || 
                         profileData.phone || (profileData as any).phoneNumber;
        
        if (anyPhone) {
          merged.phone = anyPhone;
          (merged as any).phoneNumber = anyPhone;
          (merged as any).contactNumber = anyPhone;
        }
        
        // Apply defaults to ensure all fields exist
        const normalizedUser = applyUserDefaults(merged, uid);

        // PERSIST Mirror for Solution C
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(normalizedUser));
        } catch (e) {}

        return normalizedUser as any;
      }
      return null;
    } catch (e) {
      console.error("Error fetching user profile", e);
      return null;
    }
  },

  async updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    try {
        const updates: any = { ...data };
        
        // Ensure phone naming consistency across different systems
        const anyPhone = (data as any).phone || (data as any).phoneNumber || (data as any).phone_number || (data as any).contactNumber;
        if (anyPhone) {
            updates.phone = anyPhone;
            updates.phoneNumber = anyPhone;
            updates.phone_number = anyPhone;
            updates.contactNumber = anyPhone;
        }

        // Ensure image naming consistency across different systems
        const anyImage = (data as any).avatar || (data as any).profileImage || (data as any).photoURL;
        if (anyImage) {
            updates.avatar = anyImage;
            updates.profileImage = anyImage;
            updates.photoURL = anyImage;
        }
        
        const userRef = doc(db, 'users', uid);
        const profileRef = doc(db, 'user_profiles', uid);
        await Promise.all([
          setDoc(userRef, updates, { merge: true }),
          setDoc(profileRef, updates, { merge: true })
        ]);
        
        // Also update auth profile if name/photo changed
        if (auth.currentUser && (updates.name || updates.profileImage)) {
            await updateProfile(auth.currentUser, {
                displayName: updates.name || auth.currentUser.displayName,
                photoURL: updates.profileImage || auth.currentUser.photoURL
            });
        }
    } catch (e) {
        console.error("Error updating profile", e);
        throw e;
    }
  },

  async getUser(uid: string): Promise<User | null> {
    return this.getUserProfile(uid);
  },

  async logout(): Promise<void> {
    if (!isFirebaseInitialized) return;
    
    // Clear localStorage auth data
    const API_KEY = 'AIzaSyB_SsoGd22clhuuqKHPQ_eyEEB8-YHOJvI';
    const authKey = `firebase:authUser:${API_KEY}:[DEFAULT]`;
    localStorage.removeItem(authKey);
    
    console.log('🚪 Logout: localStorage cleared');
    
    // Trigger custom event to notify AuthProvider immediately
    window.dispatchEvent(new Event('auth-bypass-logout'));
    
    // Also call SDK signOut (will run in background)
    signOut(auth).catch(console.warn);
  },

  async getProducts(category?: string): Promise<Product[]> {
    if (!isFirebaseInitialized) {
      return new Promise(resolve => {
        if (category && category !== 'all') {
          resolve(MOCK_PRODUCTS.filter(p => p.category === category));
        } else {
          resolve(MOCK_PRODUCTS);
        }
      });
    }

    try {
      const products: Product[] = [];
      const seenIds = new Set<string>();
      const approvedUserIds = new Set<string>();

      // 1. First, get all approved users (tailors/shops)
      const usersRef = collection(db, 'users');
      const approvedQuery = query(usersRef, where('approvalStatus', '==', 'approved'));
      const approvedSnapshot = await withTimeoutReject(
        getDocs(approvedQuery),
        10000,
        'getProducts: approved users query'
      );
      approvedSnapshot.forEach(doc => {
        approvedUserIds.add(doc.id);
      });

      // 2. Get products from new structure: users/{userId}/products subcollections
      const productsGroup = collectionGroup(db, 'products');
      
      let q;
      if (category && category !== 'all') {
        q = query(productsGroup, where('category', '==', category));
      } else {
        q = query(productsGroup);
      }

      // Fetch without artificial timeout; ensure we wait for Firestore response
      const snapshot = await withTimeoutReject(
        getDocs(q),
        10000,
        'getProducts: products query'
      );
      
      snapshot.forEach(doc => {
        const data = doc.data() as any;
        // Filter out drafts
        if (data.isDraft !== true) {
          // Check if this is from subcollection (has parent path)
          const isSubcollection = doc.ref.path.includes('users/');
          
          if (isSubcollection) {
            // Extract userId from path: users/{userId}/products/{productId}
            const pathParts = doc.ref.path.split('/');
            const userId = pathParts[1]; // users/[userId]/products/productId
            
            // Only include products from approved users
            if (approvedUserIds.has(userId)) {
              products.push({ 
                id: doc.id, 
                ...data,
                tailorId: userId, // Ensure tailorId is set from the path
                _isOldStructure: false 
              } as Product);
              seenIds.add(doc.id);
            }
          } else {
            // This is from root collection
            if (!seenIds.has(doc.id)) {
              products.push({ 
                id: doc.id, 
                ...data,
                _isOldStructure: true 
              } as Product);
              seenIds.add(doc.id);
            }
          }
        }
      });
      
      // 3. Sort by createdAt/updatedAt ascending (oldest first)
      products.sort((a, b) => {
        const aData = a as any;
        const bData = b as any;
        
        // Extract timestamp - handle Firestore Timestamp, ISO string, or number
        const getTime = (data: any) => {
          const timestamp = data.createdAt || data.updatedAt;
          if (!timestamp) return 0;
          
          // If it's a Firestore Timestamp object
          if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().getTime();
          }
          // If it's an ISO string
          if (typeof timestamp === 'string') {
            return new Date(timestamp).getTime();
          }
          // If it's already a number
          if (typeof timestamp === 'number') {
            return timestamp;
          }
          return 0;
        };
        
        const aTime = getTime(aData);
        const bTime = getTime(bData);
        return bTime - aTime; // Newest first
      });
      
      try { console.log(`✅ Firebase products fetched: ${products.length} (from ${approvedUserIds.size} approved users)`); } catch {}
      return products;
    } catch (error) {
      console.error("Error fetching products from Firebase:", error);
      throw error;
    }
  },

  // Admin: fetch all products across all shops (including drafts)
  async getAllProducts(): Promise<any[]> {
    if (!isFirebaseInitialized) {
      return MOCK_PRODUCTS as any[];
    }
    try {
      const productsGroup = collectionGroup(db, 'products');
      const snapshot = await getDocs(productsGroup);
      const products: any[] = [];
      snapshot.forEach(d => {
        const data = d.data() as any;
        products.push({ id: d.id, ...data });
      });
      return products;
    } catch (error) {
      console.error('Error fetching all products:', error);
      return [];
    }
  },

  // جلب كل منتجات التاجر (بما فيها المسودات) - للاستخدام في صفحة إدارة المنتجات
  async getProductsByTailorId(tailorId: string): Promise<Product[]> {
    if (!isFirebaseInitialized) {
      console.warn("Firebase not initialized, returning mock data");
      return MOCK_PRODUCTS.filter(p => p.tailorId === tailorId);
    }

    try {
      // Query from users/{tailorId}/products subcollection
      const productsRef = collection(db, `users/${tailorId}/products`);
      const snapshot = await getDocs(productsRef);
      
      if (snapshot.empty) {
        return [];
      }

      const products: Product[] = [];
      snapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() } as Product);
      });
      
      return products;
    } catch (error) {
      console.error("Error fetching tailor products:", error);
      return [];
    }
  },

    // --- Order Drafts (Firebase-backed with local mirror) ---
    async saveOrderDraft(draft: any): Promise<string> {
      try {
        const id = draft.id || `draft_${Date.now()}`;
        const uid = draft.userId || 'guest';
        if (isFirebaseInitialized) {
          await setDoc(doc(db, 'orderDrafts', `${uid}__${id}`), { ...draft, id });
        }
        // Local mirror per user
        try {
          const key = `order_drafts_${uid}`;
          const existing = JSON.parse(localStorage.getItem(key) || '[]');
          const filtered = Array.isArray(existing) ? existing.filter((d: any) => d.id !== id) : [];
          localStorage.setItem(key, JSON.stringify([...filtered, { ...draft, id }]));
        } catch {}
        return id;
      } catch (e) {
        console.warn('[firebaseService.saveOrderDraft] failed:', e);
        throw e;
      }
    },

    async loadOrderDrafts(userId: string): Promise<any[]> {
      const uid = userId || 'guest';
      // Prefer Firebase, fallback to local
      try {
        if (isFirebaseInitialized) {
          const qSnap = await getDocs(query(collection(db, 'orderDrafts'), where('userId', '==', uid)));
          const arr = qSnap.docs.map(d => ({ id: (d.data() as any).id || d.id, ...(d.data() as any) }));
          if (arr.length > 0) return arr;
        }
      } catch (e) {
        console.warn('[firebaseService.loadOrderDrafts] Firebase failed:', e);
      }
      try {
        const key = `order_drafts_${uid}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(existing) ? existing : [];
      } catch {
        return [];
      }
    },

  // جلب منتج واحد بناءً على ID
  async getProduct(productId: string): Promise<Product | null> {
    if (!isFirebaseInitialized) {
      console.warn("Firebase not initialized, returning mock data");
      const mockProduct = MOCK_PRODUCTS.find(p => p.id === productId);
      return mockProduct || null;
    }

    try {
      // First, try to find in collectionGroup (users/{userId}/products subcollections)
      const productsGroup = collectionGroup(db, 'products');
      const snapshot = await getDocs(productsGroup);
      
      let foundProduct: Product | null = null;
      snapshot.forEach(doc => {
        if (doc.id === productId && !foundProduct) {
          foundProduct = { id: doc.id, ...doc.data() } as Product;
        }
      });
      
      if (foundProduct) {
        console.log('[getProduct] Found in subcollection:', productId);
        return foundProduct;
      }
      
      // Fallback: Try root-level products collection (for legacy data)
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        console.log('[getProduct] Found in root collection:', productId);
        return { id: productSnap.id, ...productSnap.data() } as Product;
      } else {
        console.log('[getProduct] Product not found in Firebase, checking mock data');
        const mockProduct = MOCK_PRODUCTS.find(p => p.id === productId);
        return mockProduct || null;
      }
    } catch (error) {
      console.error("[getProduct] Error fetching product:", error);
      const mockProduct = MOCK_PRODUCTS.find(p => p.id === productId);
      return mockProduct || null;
    }
  },

  // Normalization handled via module-scoped helper

  async addProduct(product: Product): Promise<string> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const { id, tailorId, ...productData } = product;
      
      if (!tailorId) {
        throw new Error('tailorId is required to add a product');
      }
      
      // Normalize payload to ensure schema conformity
      const normalized = normalizeProductForSave(productData);

      // Save to users/{tailorId}/products subcollection
      const productsRef = collection(db, `users/${tailorId}/products`);
      
      const docRef = await addDoc(productsRef, {
        ...normalized,
        tailorId, // Keep tailorId in the document for reference
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('Product added successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error adding product:", error);
      throw error;
    }
  },

  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const { tailorId, ...updateData } = updates;
      
      if (!tailorId) {
        throw new Error('tailorId is required to update a product');
      }
      
      // Defensive normalization for any provided fields (without overriding unrelated fields)
      const normalizedPartial = normalizeProductForSave(updateData);

      // Update in users/{tailorId}/products subcollection
      const productRef = doc(db, `users/${tailorId}/products`, productId);
      await setDoc(productRef, {
        ...normalizedPartial,
        tailorId, // Keep tailorId in the document
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log('Product updated successfully');
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  async deleteProduct(productId: string, tailorId?: string): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      if (!tailorId) {
        throw new Error('tailorId is required to delete a product');
      }
      
      // Delete from users/{tailorId}/products subcollection
      const productRef = doc(db, `users/${tailorId}/products`, productId);
      await deleteDoc(productRef);
      console.log('Product deleted successfully');
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },

  // Delete product from old root products collection
  async deleteOldProduct(productId: string): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const productRef = doc(db, 'products', productId);
      await deleteDoc(productRef);
      console.log('Old product deleted successfully from root collection');
    } catch (error) {
      console.error("Error deleting old product:", error);
      throw error;
    }
  },

  // --- Global App Settings ---

  async getGlobalSettings(): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
      storiesEnabled: true,
      maintenanceMode: false,
      allowNewRegistrations: true,
      designerEnabled: true,
      cartEnabled: true,
      showHeader: true,
      showFooter: true,
      designerCardsRail: {
        enabled: true,
        title: 'Explore',
        maxCards: 12,
        cardWidthPx: 220,
        cardHeightPx: 140,
        cardRadiusPx: 16,
        gapPx: 12,
        paddingXPx: 16,
        cards: [],
      },
      aiTryOn: {
        driverPrompt: '',
        limits: {
          free: {
            maxPremiumTemplatesBrowse: 4,
            maxRecents: 3,
            maxGenerationsStored: 4,
          },
          subscribed: {
            // Keep generous defaults; can be tuned from Admin > Settings.
            maxPremiumTemplatesBrowse: 999999,
            maxRecents: 9,
            maxGenerationsStored: 50,
          },
        },
        premiumFeatures: {
          watermarkRemoval: true,
          hdExport: true,
          priorityQueue: true,
          batchGeneration: true,
          presets: true,
        },
      },
      // Globally managed product categories used by homepage filters and join flow
      productCategories: [
        { id: 'dishdasha', name: 'الدشاديش' },
        { id: 'jacket', name: 'الجاكيت' },
        { id: 'abaya', name: 'العبايات' },
        { id: 'kids', name: 'الأطفال' },
        { id: 'shoes', name: 'الأحذية' },
      ],
      matchingMeasurementsVideoUrl: '',
      helpVideo: {
        enabled: true,
        url: 'https://www.youtube.com/watch?v=6eZtn5Du8O4',
        buttonText: 'شاهد'
      }
    };

    if (!isFirebaseInitialized) return defaultSettings;

    try {
      const settingsRef = doc(db, 'system', 'settings');

      // Add a defensive timeout so UI never hangs on slow networks
      const TIMEOUT_MS = 2500;
      const withTimeout = <T>(p: Promise<T>, fallback: T, timeoutMs: number) => {
        return Promise.race([
          p,
          new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs))
        ]);
      };

      const fetchSettings = (async () => {
        // OPTIMIZATION: Try cache first to avoid waiting for sync block
        try {
          const cachedSnap = await getDocFromCache(settingsRef);
          if (cachedSnap.exists()) {
            return { ...defaultSettings, ...cachedSnap.data() } as AppSettings;
          }
        } catch (e) {
          // ignore cache errors/misses
        }

        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
          const loadedSettings = { ...defaultSettings, ...docSnap.data() } as AppSettings;
          return loadedSettings;
        } else {
          await setDoc(settingsRef, defaultSettings);
          return defaultSettings;
        }
      })();

      // If Firestore is slow/unreachable, fall back quickly to defaults
      const settings = await withTimeout(fetchSettings, defaultSettings, TIMEOUT_MS);
      return settings;
    } catch (error) {
      console.error("Error fetching settings:", error);
      return defaultSettings;
    }
  },

  // --- Global App Settings (Strict / No-Fallback) ---

  async getGlobalSettingsStrict(options?: { timeoutMs?: number }): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
      storiesEnabled: true,
      maintenanceMode: false,
      allowNewRegistrations: true,
      designerEnabled: true,
      cartEnabled: true,
      showHeader: true,
      showFooter: true,
      designerCardsRail: {
        enabled: true,
        title: 'Explore',
        maxCards: 12,
        cardWidthPx: 220,
        cardHeightPx: 140,
        cardRadiusPx: 16,
        gapPx: 12,
        paddingXPx: 16,
        cards: [],
      },
      aiTryOn: {
        driverPrompt: '',
        limits: {
          free: {
            maxPremiumTemplatesBrowse: 4,
            maxRecents: 3,
            maxGenerationsStored: 4,
          },
          subscribed: {
            maxPremiumTemplatesBrowse: 999999,
            maxRecents: 9,
            maxGenerationsStored: 50,
          },
        },
        premiumFeatures: {
          watermarkRemoval: true,
          hdExport: true,
          priorityQueue: true,
          batchGeneration: true,
          presets: true,
        },
      },
      productCategories: [
        { id: 'dishdasha', name: 'الدشاديش' },
        { id: 'jacket', name: 'الجاكيت' },
        { id: 'abaya', name: 'العبايات' },
        { id: 'kids', name: 'الأطفال' },
        { id: 'shoes', name: 'الأحذية' },
      ],
      matchingMeasurementsVideoUrl: '',
      helpVideo: {
        enabled: true,
        url: 'https://www.youtube.com/watch?v=6eZtn5Du8O4',
        buttonText: 'شاهد'
      }
    };

    if (!isFirebaseInitialized) return defaultSettings;

    const timeoutMs = typeof options?.timeoutMs === 'number' ? options.timeoutMs : 15000;

    const settingsRef = doc(db, 'system', 'settings');
    const fetchSettings = (async () => {
      // OPTIMIZATION: Try cache first to avoid waiting for sync engine
      try {
        const cachedSnap = await getDocFromCache(settingsRef);
        if (cachedSnap.exists()) {
          console.log('[FirebaseService] Global settings (strict) loaded from cache');
          return { ...defaultSettings, ...cachedSnap.data() } as AppSettings;
        }
      } catch (e) {
        // ignore cache miss
      }

      const docSnap = await getDoc(settingsRef);
      if (docSnap.exists()) {
        return { ...defaultSettings, ...docSnap.data() } as AppSettings;
      }
      await setDoc(settingsRef, defaultSettings);
      return defaultSettings;
    })();

    if (!timeoutMs || timeoutMs <= 0) {
      return fetchSettings;
    }

    return Promise.race([
      fetchSettings,
      new Promise<AppSettings>((_, reject) =>
        setTimeout(() => reject(new Error('Global settings fetch timed out')), timeoutMs)
      ),
    ]);
  },

  async saveGlobalSettings(settings: AppSettings): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    const settingsRef = doc(db, 'system', 'settings');
    await setDoc(settingsRef, settings, { merge: true });
  },

  async getProductCategories(level?: number): Promise<any[]> {
    if (!isFirebaseInitialized) {
      // Fallback to defaults from global settings
      return [
        { id: 'dishdasha', name: 'الدشاديش', nameEn: 'Dishdasha' },
        { id: 'jacket', name: 'الجاكيت', nameEn: 'Jacket' },
        { id: 'abaya', name: 'العبايات', nameEn: 'Abaya' },
        { id: 'kids', name: 'الأطفال', nameEn: 'Kids' },
        { id: 'shoes', name: 'الأحذية', nameEn: 'Shoes' },
      ];
    }

    try {
      const collRef = collection(db, 'productCategories');
      let q;
      if (level !== undefined) {
        q = query(collRef, where('level', '==', level), where('isActive', '==', true));
      } else {
        q = query(collRef, where('isActive', '==', true));
      }
      
      const snapshot = await getDocs(q);
      const categories: any[] = [];
      snapshot.forEach(docSnap => {
        categories.push({ id: docSnap.id, ...docSnap.data() });
      });
      
      return categories.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error("Error fetching product categories:", error);
      return [];
    }
  },

  // --- Measurements Management ---

  async getMeasurements(userId: string): Promise<any[]> {
    if (!isFirebaseInitialized) return [];
    
    try {
      // Query measurements as subcollection under user's document
      const measurementsRef = collection(db, `users/${userId}/measurements`);
      const snapshot = await getDocs(measurementsRef);
      
      const measurements: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Filter out soft-deleted measurements
        if (!data.deleted) {
          measurements.push({ id: doc.id, ...data });
        }
      });
      
      return measurements;
    } catch (error) {
      console.error("Error fetching measurements:", error);
      return [];
    }
  },

  async saveMeasurement(measurement: any): Promise<string> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const removeUndefinedDeep = (value: any): any => {
        if (Array.isArray(value)) {
          return value.map((item) => removeUndefinedDeep(item)).filter((item) => item !== undefined);
        }

        if (value && typeof value === 'object') {
          return Object.entries(value).reduce((acc, [key, nestedValue]) => {
            if (nestedValue === undefined) return acc;
            acc[key] = removeUndefinedDeep(nestedValue);
            return acc;
          }, {} as Record<string, any>);
        }

        return value;
      };

      const cleanMeasurement = removeUndefinedDeep(measurement);
      const userId = cleanMeasurement.userId;
      if (!userId) throw new Error("userId is required for measurements");
      
      if (cleanMeasurement.id && cleanMeasurement.id.startsWith('measurement_')) {
        // New measurement - create with auto ID
        const measurementsRef = collection(db, `users/${userId}/measurements`);
        const docRef = doc(measurementsRef, cleanMeasurement.id);
        await setDoc(docRef, cleanMeasurement);
        return cleanMeasurement.id;
      } else if (cleanMeasurement.id) {
        // Update existing measurement
        const measurementRef = doc(db, `users/${userId}/measurements`, cleanMeasurement.id);
        await setDoc(measurementRef, cleanMeasurement, { merge: true });
        return cleanMeasurement.id;
      } else {
        // Create new with Firestore auto ID
        const measurementsRef = collection(db, `users/${userId}/measurements`);
        const docRef = doc(measurementsRef);
        await setDoc(docRef, { ...cleanMeasurement, id: docRef.id });
        return docRef.id;
      }
    } catch (error) {
      console.error("Error saving measurement:", error);
      throw error;
    }
  },

  async deleteMeasurement(measurementId: string, userId?: string): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      // If userId is not provided, we can't delete from subcollection
      // Try to get it from the current auth user
      const currentUserId = userId || auth?.currentUser?.uid;
      if (!currentUserId) throw new Error("userId is required to delete measurement");
      
      const measurementRef = doc(db, `users/${currentUserId}/measurements`, measurementId);
      await setDoc(measurementRef, { deleted: true }, { merge: true });
    } catch (error) {
      console.error("Error deleting measurement:", error);
      throw error;
    }
  },

  // --- Family Measurements Management ---

  async getFamilyMembers(userId: string): Promise<any[]> {
    if (!isFirebaseInitialized) return [];
    
    try {
      // Query family members as subcollection under user's document
      const familyRef = collection(db, `users/${userId}/family_members`);
      const snapshot = await getDocs(familyRef);
      
      const members: any[] = [];
      snapshot.forEach(doc => {
        members.push({ id: doc.id, ...doc.data() });
      });
      
      return members;
    } catch (error: any) {
      // Suppress permission errors specifically (common for non-customer roles or rule mismatches)
      if (error?.code !== 'permission-denied') {
        console.error("Error fetching family members:", error);
      }
      return [];
    }
  },

  async saveFamilyMember(member: any): Promise<string> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const userId = member.userId;
      if (!userId) throw new Error("userId is required for family members");
      
      const familyRef = collection(db, `users/${userId}/family_members`);
      const docRef = doc(familyRef, member.id);
      await setDoc(docRef, member);
      return member.id;
    } catch (error) {
      console.error("Error saving family member:", error);
      throw error;
    }
  },

  async deleteFamilyMember(memberId: string, userId: string): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      if (!userId) throw new Error("userId is required to delete family member");
      
      const memberRef = doc(db, `users/${userId}/family_members`, memberId);
      await deleteDoc(memberRef);
    } catch (error) {
      console.error("Error deleting family member:", error);
      throw error;
    }
  },

  async getAllUsers(): Promise<User[]> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const users: User[] = [];
      querySnapshot.forEach((docSnap) => {
        const rawData = docSnap.data();
        // Apply defaults to ensure all fields exist
        const normalizedUser = applyUserDefaults(rawData, docSnap.id);
        users.push(normalizedUser as any);
      });
      
      return users;
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  },

  async upgradeUserToMerchant(userId: string, merchantInfo: {
    shopType: string;
    location: string;
    specialization?: string;
    experience?: string;
  }): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const userRef = doc(db, 'users', userId);
      
      // Determine role based on shopType
      const role = merchantInfo.shopType === 'tailor' ? 'tailor' : 'shop';

      // Update user document with merchant info
      await setDoc(userRef, {
        role: role, // Change role to merchant (tailor or shop)
        shopType: merchantInfo.shopType,
        location: merchantInfo.location,
        specialization: merchantInfo.specialization || '',
        experience: merchantInfo.experience || '',
        approvalStatus: 'approved', // Auto-approve admin conversions
        upgradedAt: new Date().toISOString()
      }, { merge: true });
      
      console.log(`User ${userId} upgraded to merchant successfully`);
    } catch (error) {
      console.error("Error upgrading user to merchant:", error);
      throw error;
    }
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const userRef = doc(db, 'users', userId);
      
      console.log('🔍 Raw updates received:', updates);
      
      // Process updates: remove undefined, preserve empty strings for image fields
      const cleanedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
        console.log(`  Processing ${key}:`, value, typeof value);
        if (value === undefined) {
          // Skip undefined values
          console.log(`    ⏭️ Skipping ${key} (undefined)`);
          return acc;
        }
        
        // Check for image fields first - preserve empty strings for these
        if (key === 'profileImage' || key === 'boardImage') {
          if (value === '' || value === null) {
            console.log(`    📸 Keeping ${key} as empty string (image field)`);
            acc[key] = '';
          } else {
            console.log(`    ✅ Keeping ${key}:`, value);
            acc[key] = value;
          }
          return acc;
        }
        
        // For other fields, delete if empty
        if (value === '' || value === null) {
          console.log(`    🗑️ Deleting ${key} (empty)`);
          acc[key] = deleteField();
        } else {
          console.log(`    ✅ Keeping ${key}:`, value);
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      console.log('📦 Cleaned updates to send:', cleanedUpdates);
      
      const finalUpdate = {
        ...cleanedUpdates,
        updatedAt: new Date().toISOString()
      };
      
      console.log('📨 Final update object:', finalUpdate);
      
      await updateDoc(userRef, finalUpdate);
      
      console.log(`✅ User ${userId} updated successfully`);
    } catch (error) {
      console.error("❌ Error updating user:", error);
      throw error;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      // 1. Delete all products and their images from Storage
      const productsRef = collection(db, `users/${userId}/products`);
      const productsSnapshot = await getDocs(productsRef);
      
      for (const productDoc of productsSnapshot.docs) {
        const productData = productDoc.data();
        
        // Delete product images from Storage
        const images = productData.images || productData.imageUrls || [];
        for (const imageUrl of images) {
          try {
            // Extract path from URL
            if (imageUrl && typeof imageUrl === 'string' && imageUrl.includes('firebase')) {
              const imagePath = imageUrl.split('/o/')[1]?.split('?')[0];
              if (imagePath) {
                const decodedPath = decodeURIComponent(imagePath);
                const imageRef = storageRef(storage, decodedPath);
                await deleteObject(imageRef);
              }
            }
          } catch (imgError) {
            // Ignore individual image deletion errors
          }
        }
        
        // Delete product document
        await deleteDoc(productDoc.ref);
      }
      
      // 2. Delete other subcollections
      const subcollections = ['designs', 'clientMeasurements', 'measurements', 'materials', 'orders', 'notifications'];
      
      for (const subcollectionName of subcollections) {
        try {
          const subcollectionRef = collection(db, `users/${userId}/${subcollectionName}`);
          const subcollectionSnapshot = await getDocs(subcollectionRef);
          
          for (const subDoc of subcollectionSnapshot.docs) {
            await deleteDoc(subDoc.ref);
          }
        } catch (subError) {
          // Ignore subcollection deletion errors
        }
      }
      
      // 3. Delete user profile images from Storage
      try {
        const userFolderRef = storageRef(storage, `users/${userId}`);
        const userFiles = await listAll(userFolderRef);
        
        for (const fileRef of userFiles.items) {
          try {
            await deleteObject(fileRef);
          } catch (fileError) {
            // Ignore individual file deletion errors
          }
        }
      } catch (storageError) {
        // Ignore storage folder access errors
      }
      
      // 4. Finally, delete the user document
      await deleteDoc(doc(db, 'users', userId));
    } catch (error: any) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  async getPendingMerchants(): Promise<User[]> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('approvalStatus', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      
      const merchants: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        merchants.push({
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone,
          profileImage: data.profileImage,
          isGuest: false,
          joinDate: data.joinDate ? new Date(data.joinDate).toLocaleDateString('ar-OM') : new Date().toLocaleDateString('ar-OM'),
          role: data.role || 'user',
          shopType: data.shopType,
          location: data.location,
          region: data.region,
          ageGroup: data.ageGroup,
          specialization: data.specialization,
          experience: data.experience,
          approvalStatus: data.approvalStatus,
          bio: data.bio,
          rating: data.rating,
          reviewsCount: data.reviewsCount
        });
      });
      
      return merchants;
    } catch (error) {
      console.error("Error getting pending merchants:", error);
      throw error;
    }
  },

  async updateMerchantStatus(merchantId: string, status: 'approved' | 'rejected', reason?: string): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const userRef = doc(db, 'users', merchantId);
      
      const updateData: any = {
        approvalStatus: status,
        reviewedAt: new Date().toISOString()
      };
      
      if (reason) {
        updateData.rejectionReason = reason;
      }
      
      await setDoc(userRef, updateData, { merge: true });
      
      console.log(`Merchant ${merchantId} status updated to ${status}`);
    } catch (error) {
      console.error("Error updating merchant status:", error);
      throw error;
    }
  },

  async getMeasurementTemplates(productType?: string): Promise<MeasurementTemplate[]> {
    const normalizeTemplate = (template: any, fallbackId?: string): MeasurementTemplate => {
      const basePoints = Array.isArray(template?.points) ? template.points : [];
      const baseArrows = Array.isArray(template?.arrows) ? template.arrows : [];

      const rawVariations = Array.isArray(template?.variations)
        ? template.variations
        : Array.isArray(template?.variationImageUrls)
          ? template.variationImageUrls.map((imageUrl: string, index: number) => ({
              id: `legacy-${index}`,
              name: `متغيّر ${index + 1}`,
              imageUrl,
              enabled: true,
              points: basePoints,
              arrows: baseArrows,
            }))
          : [];

      const normalizedVariations = rawVariations
        .filter((variation: any) => variation && typeof variation.imageUrl === 'string' && variation.imageUrl.length > 0)
        .map((variation: any, index: number) => {
          const hasAbsolutePoints = Array.isArray(variation.points);
          const hasAbsoluteArrows = Array.isArray(variation.arrows);

          const offsetPointsX = Number(variation.pointsOffset?.x || 0);
          const offsetPointsY = Number(variation.pointsOffset?.y || 0);
          const offsetArrowsX = Number(variation.arrowsOffset?.x || 0);
          const offsetArrowsY = Number(variation.arrowsOffset?.y || 0);

          const variationPoints = hasAbsolutePoints
            ? variation.points
            : basePoints.map((point: any) => ({
                ...point,
                x: Math.min(1, Math.max(0, Number(point.x || 0) + offsetPointsX)),
                y: Math.min(1, Math.max(0, Number(point.y || 0) + offsetPointsY)),
              }));

          const variationArrows = hasAbsoluteArrows
            ? variation.arrows
            : baseArrows.map((arrow: any) => ({
                ...arrow,
                startX: Math.min(1, Math.max(0, Number(arrow.startX || 0) + offsetArrowsX)),
                startY: Math.min(1, Math.max(0, Number(arrow.startY || 0) + offsetArrowsY)),
                endX: Math.min(1, Math.max(0, Number(arrow.endX || 0) + offsetArrowsX)),
                endY: Math.min(1, Math.max(0, Number(arrow.endY || 0) + offsetArrowsY)),
              }));

          return {
            id: String(variation.id || `variation-${index}`),
            name: String(variation.name || `متغيّر ${index + 1}`),
            imageUrl: String(variation.imageUrl),
            enabled: variation.enabled !== false,
            points: variationPoints,
            arrows: variationArrows,
          };
        });

      return {
        ...(template || {}),
        id: template?.id || fallbackId,
        productType: (template?.productType as any) || 'dishdasha',
        variations: normalizedVariations,
      } as MeasurementTemplate;
    };

    if (!isFirebaseInitialized) {
      const templates = loadLocalMeasurementTemplates().map((t) => normalizeTemplate(t, t.id));
      return productType ? templates.filter(t => t.productType === productType) : templates;
    }

    try {
      const templatesRef = collection(db, 'measurementTemplates');
      const snapshot = await getDocs(templatesRef);
      if (snapshot.empty) {
        const localTemplates = loadLocalMeasurementTemplates().map((t) => normalizeTemplate(t, t.id));
        return productType ? localTemplates.filter(t => t.productType === productType) : localTemplates;
      }

      const templates: MeasurementTemplate[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        templates.push(normalizeTemplate(data, docSnap.id));
      });
      return productType ? templates.filter(t => t.productType === productType) : templates;
    } catch (error) {
      console.warn('Error fetching measurement templates, using local fallback:', error);
      const localTemplates = loadLocalMeasurementTemplates().map((t) => normalizeTemplate(t, t.id));
      return productType ? localTemplates.filter(t => t.productType === productType) : localTemplates;
    }
  },

  async getMeasurementTemplateById(templateId: string): Promise<MeasurementTemplate | null> {
    const normalizeTemplate = (template: any, fallbackId?: string): MeasurementTemplate => {
      const basePoints = Array.isArray(template?.points) ? template.points : [];
      const baseArrows = Array.isArray(template?.arrows) ? template.arrows : [];

      const rawVariations = Array.isArray(template?.variations)
        ? template.variations
        : Array.isArray(template?.variationImageUrls)
          ? template.variationImageUrls.map((imageUrl: string, index: number) => ({
              id: `legacy-${index}`,
              name: `متغيّر ${index + 1}`,
              imageUrl,
              enabled: true,
              points: basePoints,
              arrows: baseArrows,
            }))
          : [];

      const normalizedVariations = rawVariations
        .filter((variation: any) => variation && typeof variation.imageUrl === 'string' && variation.imageUrl.length > 0)
        .map((variation: any, index: number) => {
          const hasAbsolutePoints = Array.isArray(variation.points);
          const hasAbsoluteArrows = Array.isArray(variation.arrows);

          const offsetPointsX = Number(variation.pointsOffset?.x || 0);
          const offsetPointsY = Number(variation.pointsOffset?.y || 0);
          const offsetArrowsX = Number(variation.arrowsOffset?.x || 0);
          const offsetArrowsY = Number(variation.arrowsOffset?.y || 0);

          const variationPoints = hasAbsolutePoints
            ? variation.points
            : basePoints.map((point: any) => ({
                ...point,
                x: Math.min(1, Math.max(0, Number(point.x || 0) + offsetPointsX)),
                y: Math.min(1, Math.max(0, Number(point.y || 0) + offsetPointsY)),
              }));

          const variationArrows = hasAbsoluteArrows
            ? variation.arrows
            : baseArrows.map((arrow: any) => ({
                ...arrow,
                startX: Math.min(1, Math.max(0, Number(arrow.startX || 0) + offsetArrowsX)),
                startY: Math.min(1, Math.max(0, Number(arrow.startY || 0) + offsetArrowsY)),
                endX: Math.min(1, Math.max(0, Number(arrow.endX || 0) + offsetArrowsX)),
                endY: Math.min(1, Math.max(0, Number(arrow.endY || 0) + offsetArrowsY)),
              }));

          return {
            id: String(variation.id || `variation-${index}`),
            name: String(variation.name || `متغيّر ${index + 1}`),
            imageUrl: String(variation.imageUrl),
            enabled: variation.enabled !== false,
            points: variationPoints,
            arrows: variationArrows,
          };
        });

      return {
        ...(template || {}),
        id: template?.id || fallbackId,
        productType: (template?.productType as any) || 'dishdasha',
        variations: normalizedVariations,
      } as MeasurementTemplate;
    };

    if (!templateId) return null;

    if (!isFirebaseInitialized) {
      const localTemplate = loadLocalMeasurementTemplates().find((t) => t.id === templateId);
      return localTemplate ? normalizeTemplate(localTemplate, localTemplate.id) : null;
    }

    try {
      const templateRef = doc(db, 'measurementTemplates', templateId);
      const snap = await getDoc(templateRef);
      if (snap.exists()) {
        return normalizeTemplate(snap.data(), snap.id);
      }

      const localTemplate = loadLocalMeasurementTemplates().find((t) => t.id === templateId);
      return localTemplate ? normalizeTemplate(localTemplate, localTemplate.id) : null;
    } catch (error) {
      console.warn('Error fetching measurement template by ID, using local fallback:', error);
      const localTemplate = loadLocalMeasurementTemplates().find((t) => t.id === templateId);
      return localTemplate ? normalizeTemplate(localTemplate, localTemplate.id) : null;
    }
  },

  async saveMeasurementTemplate(template: MeasurementTemplate): Promise<MeasurementTemplate> {
    const now = new Date().toISOString();
    const payload: MeasurementTemplate = {
      ...template,
      createdAt: template.createdAt || now,
      updatedAt: now
    };

    const removeUndefinedDeep = (value: any): any => {
      if (Array.isArray(value)) {
        return value
          .map((item) => removeUndefinedDeep(item))
          .filter((item) => item !== undefined);
      }

      if (value && typeof value === 'object') {
        const cleaned = Object.entries(value).reduce((acc, [key, nestedValue]) => {
          if (nestedValue === undefined) return acc;
          acc[key] = removeUndefinedDeep(nestedValue);
          return acc;
        }, {} as Record<string, any>);
        return cleaned;
      }

      return value;
    };

    const firestorePayload = removeUndefinedDeep(payload) as MeasurementTemplate;
    const persistedPayload = (({ productType, variationImageUrls, ...rest }) => rest)(firestorePayload as any) as Record<string, any>;

    if (!isFirebaseInitialized) {
      const existing = loadLocalMeasurementTemplates();
      const idx = existing.findIndex(t => t.id === firestorePayload.id);
      if (idx >= 0) {
        existing[idx] = persistedPayload as any;
      } else {
        existing.push(persistedPayload as any);
      }
      persistLocalMeasurementTemplates(existing);
      return firestorePayload;
    }

    try {
      if (firestorePayload.id) {
        await setDoc(
          doc(db, 'measurementTemplates', firestorePayload.id),
          {
            ...persistedPayload,
            productType: deleteField(),
            variationImageUrls: deleteField(),
          },
          { merge: true }
        );
        return firestorePayload;
      }

      const docRef = await addDoc(collection(db, 'measurementTemplates'), persistedPayload);
      return { ...firestorePayload, id: docRef.id };
    } catch (error) {
      console.error('Error saving measurement template:', error);
      throw error;
    }
  },

  async cleanupMeasurementTemplateDeprecatedFields(): Promise<number> {
    if (!isFirebaseInitialized) return 0;

    try {
      const templatesRef = collection(db, 'measurementTemplates');
      const snapshot = await getDocs(templatesRef);
      if (snapshot.empty) return 0;

      const templatesWithDeprecatedField = snapshot.docs.filter((docSnap) => {
        const data = docSnap.data() as any;
        return Object.prototype.hasOwnProperty.call(data, 'productType');
      });

      if (templatesWithDeprecatedField.length === 0) return 0;

      const batch = writeBatch(db);
      templatesWithDeprecatedField.forEach((docSnap) => {
        batch.set(
          doc(db, 'measurementTemplates', docSnap.id),
          { productType: deleteField() },
          { merge: true }
        );
      });

      await batch.commit();
      return templatesWithDeprecatedField.length;
    } catch (error) {
      console.error('Error cleaning deprecated measurement template fields:', error);
      return 0;
    }
  },

  async deleteMeasurementTemplate(templateId: string): Promise<void> {
    if (!isFirebaseInitialized) {
      const existing = loadLocalMeasurementTemplates().filter(t => t.id !== templateId);
      persistLocalMeasurementTemplates(existing);
      return;
    }

    try {
      await deleteDoc(doc(db, 'measurementTemplates', templateId));
    } catch (error) {
      console.error('Error deleting measurement template:', error);
      throw error;
    }
  },

  async createNotification(notificationData: any): Promise<void> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase is not initialized');
    }

    try {
      await addDoc(collection(db, 'notifications'), notificationData);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  async getUsers(): Promise<User[]> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase is not initialized');
    }

    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.data().email || 'مستخدم',
        email: doc.data().email || '',
        role: doc.data().role || 'customer',
        profileImage: doc.data().profileImage,
        phone: doc.data().phone,
        region: doc.data().region,
        ageGroup: doc.data().ageGroup,
        isGuest: false,
        joinDate: doc.data().joinDate || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
  ,
  async getApprovedTailors(): Promise<import('../types').Tailor[]> {
    if (!isFirebaseInitialized || !db) {
      // Fallback: return empty to avoid showing outdated mock data
      return [];
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'tailor'), where('approvalStatus', '==', 'approved'));
      const snapshot = await withTimeoutReject(
        getDocs(q),
        10000,
        'getApprovedTailors query'
      );
      try { console.log(`✅ Firebase tailors fetched: ${snapshot.size}`); } catch {}

      const tailors = snapshot.docs.map(docSnap => {
        const d: any = docSnap.data();
        return {
          id: docSnap.id,
          name: d.name || 'خياط',
          specialization: d.specialization || (d.tailorGender === 'male' ? 'male' : d.tailorGender === 'female' ? 'female' : 'general'),
          rating: d.rating || d.ratingAvg || 4.5,
          location: d.location || '',
          region: d.region || '',
          image: d.profileImage || d.image || '',
          coverImage: d.coverImage,
          experience: d.experience || '',
          followers: d.followers || 0,
          approvalStatus: d.approvalStatus || 'approved',
          bio: d.bio,
          email: d.email || d.loginId,
          loginId: d.loginId,
          phone: d.phone || d.contactNumber,
          contactNumber: d.contactNumber,
          portfolio: d.portfolio || [],
          reviews: d.reviews || [],
          tailorGender: d.tailorGender
        } as import('../types').Tailor;
      });

      // Sort by rating (highest first)
      return tailors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } catch (error) {
      console.error('Error fetching approved tailors:', error);
      throw error;
    }
  },

  async getFeaturedTailors(): Promise<import('../types').Tailor[]> {
    if (!isFirebaseInitialized || !db) {
      return [];
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('role', '==', 'tailor'),
        where('approvalStatus', '==', 'approved'),
        where('isFeatured', '==', true)
      );
      const snapshot = await getDocs(q);

      const tailors = snapshot.docs.map(docSnap => {
        const d: any = docSnap.data();
        return {
          id: docSnap.id,
          name: d.name || 'خياط',
          specialization: d.specialization || (d.tailorGender === 'male' ? 'male' : d.tailorGender === 'female' ? 'female' : 'general'),
          rating: d.rating || d.ratingAvg || 4.5,
          location: d.location || '',
          region: d.region || '',
          image: d.profileImage || d.image || '',
          coverImage: d.coverImage,
          experience: d.experience || '',
          followers: d.followers || 0,
          approvalStatus: d.approvalStatus || 'approved',
          bio: d.bio,
          email: d.email || d.loginId,
          loginId: d.loginId,
          phone: d.phone || d.contactNumber,
          contactNumber: d.contactNumber,
          portfolio: d.portfolio || [],
          reviews: d.reviews || [],
          tailorGender: d.tailorGender
        } as import('../types').Tailor;
      });

      // Sort by rating (highest first)
      return tailors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } catch (error) {
      console.error('Error fetching featured tailors:', error);
      return [];
    }
  },

  // ==================== CUSTOMIZATION DATA ====================
  
  /**
   * Save customization data to Firestore
   */
  async saveCustomization(userId: string, data: any): Promise<string> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const customizationRef = collection(db, 'customizations');
      const docRef = await addDoc(customizationRef, {
        userId,
        modelId: data.modelId,
        modelName: data.modelName,
        fabricUrl: data.fabricUrl,
        previewUrl: data.previewUrl,
        aiTips: data.aiTips || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error saving customization:', error);
      throw error;
    }
  },

  /**
   * Get user's customizations
   */
  async getUserCustomizations(userId: string): Promise<any[]> {
    if (!isFirebaseInitialized || !db) {
      return [];
    }

    try {
      const customizationsRef = collection(db, 'customizations');
      const q = query(customizationsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching customizations:', error);
      return [];
    }
  },

  /**
   * Delete customization
   */
  async deleteCustomization(customizationId: string): Promise<void> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      await deleteDoc(doc(db, 'customizations', customizationId));
    } catch (error) {
      console.error('Error deleting customization:', error);
      throw error;
    }
  },

  /**
   * Get popular regions
   */
  async getPopularRegions(): Promise<import('../types').PopularRegion[]> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const regionsRef = collection(db, 'popularRegions');
      const snapshot = await getDocs(regionsRef);
      try { console.log(`✅ Firebase popular regions fetched: ${snapshot.size}`); } catch {}
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as import('../types').PopularRegion[];
    } catch (error) {
      console.error('Error getting popular regions:', error);
      return [];
    }
  },

  /**
   * Add popular region
   */
  async addPopularRegion(regionData: Omit<import('../types').PopularRegion, 'id'>): Promise<string> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const regionsRef = collection(db, 'popularRegions');
      const docRef = await addDoc(regionsRef, regionData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding popular region:', error);
      throw error;
    }
  },

  /**
   * Update popular region
   */
  async updatePopularRegion(id: string, updates: Partial<import('../types').PopularRegion>): Promise<void> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const regionRef = doc(db, 'popularRegions', id);
      await updateDoc(regionRef, updates);
    } catch (error) {
      console.error('Error updating popular region:', error);
      throw error;
    }
  },

  /**
   * Delete popular region
   */
  async deletePopularRegion(id: string): Promise<void> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      await deleteDoc(doc(db, 'popularRegions', id));
    } catch (error) {
      console.error('Error deleting popular region:', error);
      throw error;
    }
  },

  /**
   * Get tailors by region
   */
  async getTailorsByRegion(region: string, max?: number): Promise<import('../types').Tailor[]> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const usersRef = collection(db, 'users');
      let q = query(
        usersRef,
        where('role', '==', 'tailor'),
        where('approvalStatus', '==', 'approved'),
        where('region', '==', region)
      );

      if (max) {
        q = query(q, orderBy('rating', 'desc'), limit(max));
      }

      const snapshot = await getDocs(q);

      // If query returns results, map and return immediately
      if (snapshot.docs.length > 0) {

        return snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          username: doc.data().email?.split('@')[0] || doc.id,
          rating: doc.data().rating || 0,
          location: doc.data().location || '',
          image: doc.data().profileImage || '',
          specialization: doc.data().specialization || '',
          experience: doc.data().experience || '',
          bio: doc.data().bio,
          email: doc.data().email || doc.data().loginId,
          loginId: doc.data().loginId,
          phone: doc.data().phone || doc.data().contactNumber,
          contactNumber: doc.data().contactNumber,
          portfolio: doc.data().portfolio || [],
          reviewsCount: doc.data().reviewsCount || 0,
          region: doc.data().region,
        })) as import('../types').Tailor[];
      }

      // Fallback: If no results, fetch approved tailors and filter client-side by normalized region/location

      // Helper to normalize Arabic strings for robust matching
      const normalize = (s: string | undefined | null) => {
        if (!s) return '';
        return s
          .toLowerCase()
          .replace(/[أإآا]/g, 'ا')
          .replace(/[يى]/g, 'ي')
          .replace(/ؤ/g, 'و')
          .replace(/ئ/g, 'ي')
          .replace(/ة/g, 'ه')
          .replace(/\u0640/g, '') // tatweel
          .replace(/[\u064B-\u0652\u0670]/g, '') // harakat
          .replace(/\s+/g, ' ')
          .trim();
      };

      const normalizedTarget = normalize(region);

      const approvedRef = query(
        usersRef,
        where('role', '==', 'tailor'),
        where('approvalStatus', '==', 'approved')
      );
      const approvedSnap = await getDocs(approvedRef);
      const approved = approvedSnap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.name || '',
          username: d.email?.split('@')[0] || doc.id,
          rating: d.rating || 0,
          location: d.location || '',
          image: d.profileImage || '',
          specialization: d.specialization || '',
          experience: d.experience || '',
          bio: d.bio,
          email: d.email || d.loginId,
          loginId: d.loginId,
          phone: d.phone || d.contactNumber,
          contactNumber: d.contactNumber,
          portfolio: d.portfolio || [],
          reviewsCount: d.reviewsCount || 0,
          region: d.region,
        } as import('../types').Tailor;
      });

      const filtered = approved.filter(t => {
        const nRegion = normalize(t.region as unknown as string);
        const nLocation = normalize((t as any).location);
        return nRegion === normalizedTarget || (nLocation && nLocation.includes(normalizedTarget));
      });

      // Sort by rating desc just in case and limit
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      return typeof max === 'number' ? filtered.slice(0, max) : filtered;
    } catch (error) {
      console.error('❌ Error getting tailors by region:', error);
      
      // Check if this is a Firebase index error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('index') || errorMessage.includes('indexes')) {
        console.error('🚨 CRITICAL: Firebase index missing - triggering maintenance mode');
        // Trigger global maintenance mode
        try {
          window.dispatchEvent(new CustomEvent('firebase-critical-error', { 
            detail: { 
              error: errorMessage,
              location: 'getTailorsByRegion' 
            } 
          }));
        } catch (e) {
          console.error('Failed to dispatch maintenance event:', e);
        }
      }
      
      throw error; // Re-throw to prevent mock data fallback
    }
  },

  /**
   * Check if a matching order already exists for a user
   */
  async findMatchingOrder(
    userId: string, 
    productId: string, 
    measurements: Record<string, number>,
    comments?: string,
    tailorId?: string,
    price?: number
  ): Promise<any | null> {
    if (!isFirebaseInitialized || !db || !userId) return null;

    try {
      const ordersRef = collection(db, 'orders');
      // We only care about orders currently "waiting to be approved" (status: pending)
      // As per user request: "If the product is placed after the approval. That would be OK."
      const q = query(
        ordersRef, 
        where('userId', '==', userId),
        where('productId', '==', productId),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(q);
      
      for (const d of querySnapshot.docs) {
        const order = d.data();
        
        // 1. Check tailorId if provided
        if (tailorId && order.tailorId !== tailorId) continue;

        // 2. Check price if provided (handling precision)
        if (price !== undefined && order.price !== undefined) {
           if (Math.abs(Number(order.price) - Number(price)) > 0.001) continue;
        }

        // 3. Check measurements precisely
        const existingMeasurements = order.measurements || {};
        const m1Keys = Object.keys(measurements);
        const m2Keys = Object.keys(existingMeasurements);
        
        if (m1Keys.length !== m2Keys.length) continue;

        const measurementsMatch = m1Keys.every(key => 
          Number(existingMeasurements[key]) === Number(measurements[key])
        );

        if (!measurementsMatch) continue;

        // 4. Check comments/details ("every single details")
        const existingComments = order.comments || '';
        const currentComments = comments || '';
        
        if (existingComments.trim() !== currentComments.trim()) continue;

        // If we reached here, it's a perfect match
        return { id: d.id, ...order };
      }
      return null;
    } catch (error) {
      console.error('Error finding matching order:', error);
      return null;
    }
  },

  /**
   * Create a new order
   */
  async createOrder(orderData: any): Promise<string> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      // Remove undefined values - Firestore doesn't accept them
      const cleanedData = Object.entries(orderData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      const ordersRef = collection(db, 'orders');
      const docRef = await addDoc(ordersRef, {
        ...cleanedData,
        orderDate: cleanedData.orderDate || new Date().toISOString(),
        createdAt: cleanedData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('[Firebase] Order created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  /**
   * Get approved fabric stores
   */
  async getApprovedFabricStores(limitCount?: number): Promise<import('../types').Shop[]> {
    if (!isFirebaseInitialized) return [];
    
    try {
      const usersRef = collection(db, 'users');
      const constraints: any[] = [
        where('role', '==', 'shop'),
        where('shopType', '==', 'fabric_store'),
        where('approvalStatus', '==', 'approved')
      ];

      if (limitCount) {
        constraints.push(limit(limitCount));
      }

      const q = query(usersRef, ...constraints);
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          type: 'fabric_store',
          username: data.username || data.email?.split('@')[0],
          specialization: data.specialization || 'أقمشة',
          rating: data.rating || 0,
          location: data.location || '',
          region: data.region || '',
          image: data.profileImage || '',
          experience: data.experience || '',
          followers: 0,
          approvalStatus: 'approved',
          bio: data.bio || '',
          description: data.bio || '',
          reviews: [],
          coverImage: data.coverImage || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as import('../types').Shop;
      });
    } catch (error) {
      console.error("Error getting approved fabric stores:", error);
      return [];
    }
  },

  // ------------------------------------------------------------
  // Try-On Garment Templates (admin-managed)
  // ------------------------------------------------------------

  async uploadTryOnGarmentTemplateOriginal(params: { templateId: string; file: File; onProgress?: (progress: number) => void }): Promise<string> {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    const templateId = sanitizeStoragePathSegment(params?.templateId);
    const file = params?.file;
    if (!templateId) throw new Error('Template id is required');
    if (!file) throw new Error('Template file is required');

    if (!auth.currentUser) {
      throw new Error('Not authenticated. Please log in as an admin before uploading templates.');
    }

    const ext = inferImageExtensionFromContentType(file.type);
    const objectRef = storageRef(storage, `tryon_templates/${templateId}/original.${ext}`);
    if (typeof params?.onProgress === 'function') {
      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(objectRef, file, { contentType: file.type || `image/${ext}` });
        task.on(
          'state_changed',
          (snap) => {
            const total = snap.totalBytes || 0;
            const pct = total > 0 ? Math.round((snap.bytesTransferred / total) * 100) : 0;
            try { params.onProgress!(pct); } catch {}
          },
          (err) => reject(err),
          () => resolve()
        );
      });
    } else {
      await uploadBytes(objectRef, file, { contentType: file.type || `image/${ext}` });
    }
    return await getDownloadURL(objectRef);
  },

  async uploadTryOnGarmentTemplateThumbnail(params: { templateId: string; blob: Blob; onProgress?: (progress: number) => void }): Promise<string> {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    const templateId = sanitizeStoragePathSegment(params?.templateId);
    const blob = params?.blob;
    if (!templateId) throw new Error('Template id is required');
    if (!blob) throw new Error('Thumbnail blob is required');

    if (!auth.currentUser) {
      throw new Error('Not authenticated. Please log in as an admin before uploading templates.');
    }

    const objectRef = storageRef(storage, `tryon_templates/${templateId}/thumb.jpg`);
    if (typeof params?.onProgress === 'function') {
      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(objectRef, blob, { contentType: blob.type || 'image/jpeg' });
        task.on(
          'state_changed',
          (snap) => {
            const total = snap.totalBytes || 0;
            const pct = total > 0 ? Math.round((snap.bytesTransferred / total) * 100) : 0;
            try { params.onProgress!(pct); } catch {}
          },
          (err) => reject(err),
          () => resolve()
        );
      });
    } else {
      await uploadBytes(objectRef, blob, { contentType: blob.type || 'image/jpeg' });
    }
    return await getDownloadURL(objectRef);
  },

  async getTryOnGarmentTemplates(options?: { resolveStorageUrls?: boolean }): Promise<Array<{ id: string; name: string; imageUrl: string; thumbnailUrl?: string; enabled?: boolean; order?: number; isPremium?: boolean }>> {
    if (!isFirebaseInitialized) return [];

    try {
      const refCol = collection(db, 'tryon_garment_templates');
      const snap = await getDocs(refCol);
      const raw = snap.docs.map((d) => {
        const data: any = d.data() || {};
        return {
          id: d.id,
          name: String(data.name || ''),
          imageUrl: String(data.imageUrl || ''),
          thumbnailUrl: data.thumbnailUrl ? String(data.thumbnailUrl || '') : undefined,
          enabled: data.enabled !== false,
          order: typeof data.order === 'number' ? data.order : undefined,
          isPremium: data.isPremium === true,
        };
      }).filter(t => t.id && t.name && t.imageUrl);

      const resolveStorageUrls = options?.resolveStorageUrls === true;

      // IMPORTANT:
      // Resolving Storage paths via getDownloadURL requires the current client to have
      // Storage read permission. In non-admin user contexts this can cause storage/unauthorized.
      // Therefore, we only resolve when explicitly requested (admin screens, migrations).
      const out = resolveStorageUrls
        ? await Promise.all(
            raw.map(async (t) => {
              const resolved: any = { ...t };

              const imageUrl = String(t.imageUrl || '');
              if (imageUrl.startsWith('gs://') || imageUrl.startsWith('tryon_templates/')) {
                try {
                  // Check cache first
                  const cachedUrl = urlCache.get(imageUrl);
                  if (cachedUrl) {
                    resolved.imageUrl = cachedUrl;
                  } else {
                    const downloadUrl = await getDownloadURL(storageRef(storage, imageUrl));
                    urlCache.set(imageUrl, downloadUrl);
                    resolved.imageUrl = downloadUrl;
                  }
                } catch (e) {
                  console.warn('Failed to resolve template imageUrl to download URL:', t.id, imageUrl, e);
                  // Keep original URL - it may work as-is or will fail gracefully in <img>
                }
              }

              const thumbnailUrl = String(t.thumbnailUrl || '');
              if (thumbnailUrl && (thumbnailUrl.startsWith('gs://') || thumbnailUrl.startsWith('tryon_templates/'))) {
                try {
                  // Check cache first
                  const cachedUrl = urlCache.get(thumbnailUrl);
                  if (cachedUrl) {
                    resolved.thumbnailUrl = cachedUrl;
                  } else {
                    const downloadUrl = await getDownloadURL(storageRef(storage, thumbnailUrl));
                    urlCache.set(thumbnailUrl, downloadUrl);
                    resolved.thumbnailUrl = downloadUrl;
                  }
                } catch (e) {
                  console.warn('Failed to resolve template thumbnailUrl to download URL:', t.id, thumbnailUrl, e);
                  // Keep original URL - it may work as-is or will fail gracefully in <img>
                }
              }

              return resolved as { id: string; name: string; imageUrl: string; thumbnailUrl?: string; enabled?: boolean; order?: number; isPremium?: boolean };
            })
          )
        : raw;

      // Sort locally to avoid requiring indexes.
      out.sort((a, b) => {
        const ao = typeof a.order === 'number' ? a.order : 999999;
        const bo = typeof b.order === 'number' ? b.order : 999999;
        if (ao !== bo) return ao - bo;
        return a.name.localeCompare(b.name, 'ar');
      });

      return out;
    } catch (error) {
      console.error('Error getting try-on garment templates:', error);
      return [];
    }
  },

  async getTryOnJobById(jobId: string): Promise<{ id: string; status?: string; resultUrl?: string | null; thumbnailUrl?: string | null } | null> {
    if (!isFirebaseInitialized) return null;
    const safeId = sanitizeFirestoreDocId(jobId);
    if (!safeId) return null;

    try {
      const refDoc = doc(db, 'tryon_jobs', safeId);
      const snap = await getDoc(refDoc);
      if (!snap.exists()) return null;
      const data: any = snap.data() || {};
      return {
        id: snap.id,
        status: typeof data.status === 'string' ? data.status : undefined,
        resultUrl: data.resultUrl ? String(data.resultUrl) : null,
        thumbnailUrl: data.thumbnailUrl ? String(data.thumbnailUrl) : null,
      };
    } catch (e) {
      console.warn('getTryOnJobById failed:', jobId, e);
      return null;
    }
  },

  async saveTryOnJobResult(params: {
    jobId: string;
    userId?: string;
    resultImageUrl: string;
    resultThumbnailUrl?: string;
    templateId?: string;
    fabricId?: string;
  }): Promise<void> {
    if (!isFirebaseInitialized) {
      console.warn('Firebase not initialized, skipping saveTryOnJobResult');
      return;
    }

    const safeId = sanitizeFirestoreDocId(params.jobId);
    if (!safeId) {
      console.warn('Invalid jobId for saveTryOnJobResult');
      return;
    }

    try {
      const refDoc = doc(db, 'tryon_jobs', safeId);
      await setDoc(
        refDoc,
        {
          jobId: params.jobId,
          userId: params.userId || null,
          resultUrl: params.resultImageUrl,
          thumbnailUrl: params.resultThumbnailUrl || null,
          templateId: params.templateId || null,
          fabricId: params.fabricId || null,
          status: 'completed',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log('[Firebase] Saved try-on job result:', safeId);
    } catch (e) {
      console.error('[Firebase] Failed to save try-on job result:', e);
    }
  },

  async getUserTryOnJobs(userId: string, limitCount = 100): Promise<Array<{
    jobId: string;
    resultUrl: string;
    thumbnailUrl?: string;
    createdAt: number;
    fabricId?: string;
  }>> {
    if (!isFirebaseInitialized) return [];
    if (!userId) return [];

    try {
      const q = query(
        collection(db, 'tryon_jobs'),
        where('userId', '==', userId),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          jobId: docSnap.id,
          resultUrl: data.resultUrl || '',
          thumbnailUrl: data.thumbnailUrl || data.resultUrl || '',
          createdAt: data.createdAt?.toMillis?.() || Date.now(),
          fabricId: data.fabricId || undefined,
        };
      }).filter(job => job.resultUrl);
    } catch (e) {
      console.error('[Firebase] Failed to load user try-on jobs:', e);
      return [];
    }
  },

  async upsertTryOnGarmentTemplate(template: { id: string; name: string; imageUrl: string; thumbnailUrl?: string; enabled?: boolean; order?: number; isPremium?: boolean }) {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    if (!template?.id) throw new Error('Template id is required');
    if (!template?.name) throw new Error('Template name is required');
    if (!template?.imageUrl) throw new Error('Template imageUrl is required');

    const refDoc = doc(db, 'tryon_garment_templates', template.id);
    await setDoc(
      refDoc,
      {
        id: template.id,
        name: template.name,
        imageUrl: template.imageUrl,
        ...(template.thumbnailUrl !== undefined ? { thumbnailUrl: template.thumbnailUrl } : {}),
        enabled: template.enabled !== false,
        isPremium: template.isPremium === true,
        ...(typeof template.order === 'number' ? { order: template.order } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  async deleteTryOnGarmentTemplate(id: string) {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    if (!id) return;
    await deleteDoc(doc(db, 'tryon_garment_templates', id));
  },

  /**
   * One-time helper: ensure existing templates have an explicit isPremium field.
   * Only writes isPremium=false when the field is missing.
   */
  async backfillTryOnTemplateIsPremium(): Promise<{ updated: number; skipped: number }>
  {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');

    const refCol = collection(db, 'tryon_garment_templates');
    const snap = await getDocs(refCol);
    let updated = 0;
    let skipped = 0;

    for (const d of snap.docs) {
      const data: any = d.data() || {};
      if (typeof data.isPremium === 'boolean') {
        skipped += 1;
        continue;
      }
      await setDoc(
        doc(db, 'tryon_garment_templates', d.id),
        {
          isPremium: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      updated += 1;
    }

    return { updated, skipped };
  },

  async seedTryOnGarmentTemplates(templates: Array<{ id: string; name: string; imageUrl: string; thumbnailUrl?: string; enabled?: boolean; order?: number; isPremium?: boolean }>) {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    const list = Array.isArray(templates) ? templates : [];
    for (const t of list) {
      if (!t?.id || !t?.name || !t?.imageUrl) continue;
      await this.upsertTryOnGarmentTemplate(t);
    }
  },

  // ------------------------------------------------------------
  // Try-On Generations (per user)
  // ------------------------------------------------------------

  async upsertUserTryOnGeneration(params: {
    userId: string;
    generation: { jobId: string; url: string; thumbnailUrl?: string | null; createdAt: number };
  }): Promise<void> {
    if (!isFirebaseInitialized) throw new Error('Firebase not configured');
    const userId = String(params?.userId || '').trim();
    const generation = params?.generation;
    if (!userId) throw new Error('userId is required');
    if (!generation?.jobId || !generation?.url || typeof generation?.createdAt !== 'number') {
      throw new Error('generation.jobId, generation.url and generation.createdAt are required');
    }

    const docId = sanitizeFirestoreDocId(generation.jobId) || sanitizeFirestoreDocId(`${generation.createdAt}`);
    if (!docId) throw new Error('Invalid generation id');

    const refDoc = doc(db, `users/${userId}/tryon_generations`, docId);
    await setDoc(
      refDoc,
      {
        id: docId,
        jobId: String(generation.jobId),
        url: String(generation.url),
        thumbnailUrl: generation.thumbnailUrl ? String(generation.thumbnailUrl) : null,
        createdAt: generation.createdAt,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  async getUserTryOnGenerations(params: {
    userId: string;
    limit?: number;
  }): Promise<Array<{ jobId: string; url: string; thumbnailUrl?: string | null; createdAt: number }>> {
    if (!isFirebaseInitialized) return [];
    const userId = String(params?.userId || '').trim();
    if (!userId) return [];
    const limitCount = Number.isFinite(params?.limit) ? Math.max(1, Math.min(200, Number(params.limit))) : 50;

    try {
      const refCol = collection(db, `users/${userId}/tryon_generations`);
      const q = query(refCol, orderBy('createdAt', 'desc'), limit(limitCount));
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => {
          const data: any = d.data() || {};
          return {
            jobId: String(data.jobId || d.id),
            url: String(data.url || ''),
            thumbnailUrl: data.thumbnailUrl ? String(data.thumbnailUrl) : null,
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
          };
        })
        .filter((x) => x.jobId && x.url);
    } catch (e) {
      console.warn('[firebaseService.getUserTryOnGenerations] failed:', e);
      return [];
    }
  },

  async uploadUserTemplate(params: {
    userId: string;
    file: File;
    onProgress?: (progress: number) => void;
  }): Promise<string> {
    if (!isFirebaseInitialized) throw new Error('Firebase not initialized');

    const { userId, file, onProgress } = params;
    if (!userId) throw new Error('User ID required');

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const fileName = `${timestamp}.${ext}`;
      const objectRef = storageRef(storage, `user_templates/${userId}/${fileName}`);

      const uploadTask = uploadBytesResumable(objectRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed', (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        });

        uploadTask.then(async () => {
          try {
            const downloadUrl = await getDownloadURL(objectRef);
            resolve(downloadUrl);
          } catch (e) {
            reject(e);
          }
        }).catch(reject);
      });
    } catch (error) {
      console.error('Error uploading user template:', error);
      throw error;
    }
  },

  async saveUserTemplate(params: {
    userId: string;
    name: string;
    imageUrl: string;
    thumbnailUrl?: string;
  }): Promise<string> {
    if (!isFirebaseInitialized) throw new Error('Firebase not initialized');

    const { userId, name, imageUrl, thumbnailUrl } = params;
    if (!userId) throw new Error('User ID required');

    try {
      const docRef = doc(db, 'user_templates', `${userId}_${Date.now()}`);
      const data = {
        userId,
        name: name.trim() || 'Untitled Template',
        imageUrl,
        thumbnailUrl: thumbnailUrl || imageUrl,
        createdAt: serverTimestamp(),
      };

      await setDoc(docRef, data);
      return docRef.id;
    } catch (error) {
      console.error('Error saving user template metadata:', error);
      throw error;
    }
  },

  async getUserTemplates(userId: string): Promise<Array<{
    id: string;
    name: string;
    imageUrl: string;
    thumbnailUrl?: string;
    createdAt: number;
  }>> {
    if (!isFirebaseInitialized) return [];

    try {
      const refCol = collection(db, 'user_templates');
      const q = query(
        refCol,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data: any = d.data() || {};
        return {
          id: d.id,
          name: String(data.name || ''),
          imageUrl: String(data.imageUrl || ''),
          thumbnailUrl: data.thumbnailUrl ? String(data.thumbnailUrl) : undefined,
          createdAt: data.createdAt?.toMillis?.() || 0,
        };
      }).filter(t => t.id && t.imageUrl);
    } catch (error) {
      console.error('Error fetching user templates:', error);
      return [];
    }
  },

  async deleteUserTemplate(templateId: string): Promise<void> {
    if (!isFirebaseInitialized) throw new Error('Firebase not initialized');

    try {
      await deleteDoc(doc(db, 'user_templates', templateId));
    } catch (error) {
      console.error('Error deleting user template:', error);
      throw error;
    }
  },
};



