/**
 * Migration: Normalize early Tailor Join products
 *
 * What it does:
 * - Finds product docs in collectionGroup('products') that have `imageUrls` but missing `images`/`image`
 * - Backfills: `images`, `image`, `coverImageIndex: 0`
 * - Adds `categoryId` using `category` or defaults to 'dishdasha'
 * - Adds timestamps if missing: `createdAt`, `updatedAt` via serverTimestamp()
 * - Leaves other fields intact
 *
 * Safety:
 * - Uses merge updates
 * - Skips documents already normalized
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collectionGroup, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2cQxqHvH9HqEBH_cLnU3IfMElvVMiTQ8",
  authDomain: "khuyoot-6c68a.firebaseapp.com",
  projectId: "khuyoot-6c68a",
  storageBucket: "khuyoot-6c68a.firebasestorage.app",
  messagingSenderId: "1064896006089",
  appId: "1:1064896006089:web:b9f9f9c30e3fa4d74e4e4e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log('▶ Migration started: Tailor Join products normalization');
  const productsGroup = collectionGroup(db, 'products');
  const snap = await getDocs(productsGroup);
  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  for (const d of snap.docs) {
    const data = d.data() || {};
    const needsImages = Array.isArray(data.imageUrls) && (!Array.isArray(data.images) || data.images.length === 0);
    const needsImageField = !data.image;
    const needsCategoryId = !data.categoryId;
    const needsTimestamps = !data.createdAt || !data.updatedAt;

    if (!needsImages && !needsImageField && !needsCategoryId && !needsTimestamps) {
      skipped++;
      continue;
    }

    const images = Array.isArray(data.imageUrls) ? data.imageUrls.filter(Boolean) : (Array.isArray(data.images) ? data.images : []);
    const image = images[0] || data.image || '';

    // Derive categoryId from `category` if present, else default
    const categoryId = (data.categoryId || (typeof data.category === 'string' ? data.category : '') || 'dishdasha').trim();

    const update = {
      images,
      image,
      coverImageIndex: 0,
      categoryId,
    };
    if (needsTimestamps) {
      update.createdAt = data.createdAt || serverTimestamp();
      update.updatedAt = serverTimestamp();
    }

    try {
      // d.ref is the document reference from collectionGroup
      await setDoc(d.ref, update, { merge: true });
      fixed++;
    } catch (e) {
      errors++;
      console.error('Failed to update doc', d.id, e);
    }
  }

  console.log(`✔ Migration complete. Fixed: ${fixed}, Skipped: ${skipped}, Errors: ${errors}`);
}

run().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
