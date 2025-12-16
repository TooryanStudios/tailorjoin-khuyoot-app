/**
 * Normalize tailor region values to match PopularRegions names.
 * 
 * - Reads enabled regions from `popularRegions`
 * - Fetches approved tailors from `users`
 * - Tries to map each tailor to a canonical region name
 *   using Arabic normalization and also scanning `location`
 * - Dry-run by default: prints proposed changes
 * - To write changes, set env APPLY=1 and authenticate an admin user
 *   by setting env ADMIN_EMAIL and ADMIN_PASSWORD
 * 
 * Run:
 *   # Dry run
 *   npm run migrate:regions
 * 
 *   # Apply with admin auth
 *   setx ADMIN_EMAIL "admin@test.com"; setx ADMIN_PASSWORD "<password>"; setx APPLY "1"
 *   npm run migrate:regions
 */

import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';

// Load .env.local file
config({ path: '.env.local' });
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  setDoc,
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Prefer env-config where available; fallback to known public config used in other scripts
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function normalizeArabic(input: string | undefined | null): string {
  if (!input) return '';
  return input
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
}

async function maybeSignInAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('ℹ️ Running without authentication (dry-run or read-only).');
    return;
  }
  console.log('🔐 Signing in as admin...');
  await signInWithEmailAndPassword(auth, email, password);
  console.log('✅ Signed in.');
}

async function loadRegions(): Promise<{ original: string; norm: string }[]> {
  const regionsRef = collection(db, 'popularRegions');
  const qRegions = query(regionsRef, where('enabled', '==', true));
  const snap = await getDocs(qRegions);
  const regions: { original: string; norm: string }[] = [];
  snap.forEach((doc) => {
    const data = doc.data() as any;
    if (!data?.name) return;
    regions.push({ original: data.name, norm: normalizeArabic(data.name) });
  });
  console.log(`📍 Enabled regions: ${regions.map(r => r.original).join(', ')}`);
  return regions;
}

async function loadApprovedTailors() {
  const usersRef = collection(db, 'users');
  const qUsers = query(
    usersRef,
    where('role', '==', 'tailor'),
    where('approvalStatus', '==', 'approved')
  );
  const snap = await getDocs(qUsers);
  const list = snap.docs.map(d => ({ id: d.id, data: d.data() as any }));
  console.log(`👤 Approved tailors found: ${list.length}`);
  return list;
}

function decideRegion(
  regions: { original: string; norm: string }[],
  tailor: { id: string; data: any }
): string | null {
  const current = tailor.data.region || '';
  const location = tailor.data.location || '';
  const nCurrent = normalizeArabic(current);
  const nLocation = normalizeArabic(location);

  // 1) Exact normalized match
  const exact = regions.find(r => r.norm === nCurrent);
  if (exact) return exact.original;

  // 2) Location contains region name
  const byLocation = regions.find(r => nLocation.includes(r.norm));
  if (byLocation) return byLocation.original;

  return null;
}

async function run() {
  const APPLY = process.env.APPLY === '1' || process.env.APPLY === 'true';

  await maybeSignInAdmin();

  const regions = await loadRegions();
  const tailors = await loadApprovedTailors();

  let changes = 0;
  for (const t of tailors) {
    const proposed = decideRegion(regions, t);
    const current = t.data.region || '';

    if (!proposed) {
      console.log(`- ${t.data.name || t.id}: no match (current="${current}", location="${t.data.location || ''}")`);
      continue;
    }

    if (current === proposed) {
      // Already correct
      continue;
    }

    changes++;
    console.log(`🛠️ ${t.data.name || t.id}: ${current || '""'} -> ${proposed}`);

    if (APPLY) {
      const userRef = doc(db, 'users', t.id);
      await setDoc(userRef, { region: proposed, updatedAt: Date.now() }, { merge: true });
    }
  }

  if (APPLY) {
    console.log(`\n✅ Applied ${changes} update(s).`);
  } else {
    console.log(`\n💡 Dry-run only. ${changes} change(s) proposed.`);
    console.log('   Set env APPLY=1 and provide ADMIN_EMAIL/ADMIN_PASSWORD to write.');
  }
}

run()
  .then(() => {
    console.log('\n✨ Done');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
