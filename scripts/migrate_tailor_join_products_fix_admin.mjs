// scripts/migrate_tailor_join_products_fix_admin.mjs
import admin from 'firebase-admin';

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON.');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function run({ dryRun = false } = {}) {
  console.log('▶ Admin Migration: Tailor Join products normalization', { dryRun });

  const productsGroup = db.collectionGroup('products');
  const snap = await productsGroup.get();

  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  for (const d of snap.docs) {
    const data = d.data() || {};
    const hasImageUrls = Array.isArray(data.imageUrls) && data.imageUrls.length > 0;
    const needsImages = hasImageUrls && (!Array.isArray(data.images) || data.images.length === 0);
    const needsImageField = !data.image;
    const needsCategoryId = !data.categoryId;
    const needsCreated = !data.createdAt;
    const needsUpdated = !data.updatedAt;

    if (!needsImages && !needsImageField && !needsCategoryId && !needsCreated && !needsUpdated) {
      skipped++;
      continue;
    }

    const images = hasImageUrls ? data.imageUrls.filter(Boolean) : (Array.isArray(data.images) ? data.images : []);
    const image = images[0] || data.image || '';

    // Derive categoryId from `category` string (display), else default
    const categoryId = (data.categoryId || (typeof data.category === 'string' ? data.category : '') || 'dishdasha').trim() || 'dishdasha';

    const update = {
      images,
      image,
      coverImageIndex: 0,
      categoryId,
    };

    if (needsCreated) update.createdAt = admin.firestore.FieldValue.serverTimestamp();
    if (needsUpdated) update.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    try {
      if (dryRun) {
        console.log('[DRY] Would update', d.ref.path, update);
      } else {
        await d.ref.set(update, { merge: true });
        console.log('✔ Updated', d.ref.path);
      }
      fixed++;
    } catch (e) {
      errors++;
      console.error('❌ Failed', d.ref.path, e.message);
    }
  }

  console.log(`✔ Done. Fixed: ${fixed}, Skipped: ${skipped}, Errors: ${errors}`);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry');
run({ dryRun }).catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
