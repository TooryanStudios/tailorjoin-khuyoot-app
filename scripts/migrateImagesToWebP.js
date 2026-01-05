/**
 * Migration Script: Trigger WebP Generation for Existing Images
 * 
 * This script re-uploads existing template images to trigger the
 * Firebase Storage resize extension and generate WebP thumbnails.
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync('./khuyoot-app01-firebase-adminsdk-fbsvc-01a9dc920d.json', 'utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'khuyoot-app01.firebasestorage.app'
  });
}

const bucket = admin.storage().bucket();

// Folders to process
const FOLDERS_TO_MIGRATE = [
  'tryon_templates',
  'imageLibrary/resize_test', // Start with test folder
  // Add more folders after testing:
  // 'products',
  // 'users',
  // 'fabrics',
];

/**
 * Triggers the resize extension by copying the file over itself
 */
async function triggerResize(filePath) {
  try {
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    
    if (!exists) {
      console.log(`  ⚠️  File not found: ${filePath}`);
      return false;
    }

    // Get file metadata
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType;
    
    // Skip if not an image
    if (!contentType || !contentType.startsWith('image/')) {
      console.log(`  ⏭️  Skipping non-image: ${filePath}`);
      return false;
    }

    // Skip if already a resized version (has _200x300, _600x800, etc)
    if (filePath.includes('_200x300') || filePath.includes('_600x800') || filePath.includes('_1200x1600')) {
      console.log(`  ⏭️  Skipping resized version: ${filePath}`);
      return false;
    }

    console.log(`  🔄 Processing: ${filePath} (${(metadata.size / 1024).toFixed(1)} KB)`);

    // Copy file to temporary location
    const tempPath = `${filePath}.temp`;
    await file.copy(tempPath);
    
    // Copy back to original location (triggers extension)
    const tempFile = bucket.file(tempPath);
    await tempFile.copy(filePath);
    
    // Delete temp file
    await tempFile.delete();

    console.log(`  ✅ Triggered resize for: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Lists and processes all files in a folder
 */
async function migrateFolder(folderPath) {
  console.log(`\n📁 Processing folder: ${folderPath}/`);
  console.log('─'.repeat(60));

  try {
    const [files] = await bucket.getFiles({ prefix: folderPath });
    
    // Filter out folders and resized versions
    const imagesToProcess = files.filter(file => {
      const name = file.name;
      return !name.endsWith('/') && 
             !name.includes('_200x300') && 
             !name.includes('_600x800') &&
             !name.includes('_1200x1600');
    });

    console.log(`Found ${imagesToProcess.length} images to process`);

    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const file of imagesToProcess) {
      const result = await triggerResize(file.name);
      
      if (result === true) {
        processed++;
      } else if (result === false) {
        skipped++;
      } else {
        failed++;
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n✅ Folder complete: ${processed} processed, ${skipped} skipped, ${failed} failed`);
    
    if (processed > 0) {
      console.log(`\n⏳ Wait 2-3 minutes for WebP thumbnails to be generated...`);
    }

    return { processed, skipped, failed };
  } catch (error) {
    console.error(`❌ Error listing files in ${folderPath}:`, error.message);
    return { processed: 0, skipped: 0, failed: 0 };
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting Image Migration');
  console.log('═'.repeat(60));
  console.log('This will trigger WebP generation for all existing images');
  console.log('═'.repeat(60));

  const totalStats = { processed: 0, skipped: 0, failed: 0 };

  for (const folder of FOLDERS_TO_MIGRATE) {
    const stats = await migrateFolder(folder);
    totalStats.processed += stats.processed;
    totalStats.skipped += stats.skipped;
    totalStats.failed += stats.failed;
  }

  console.log('\n' + '═'.repeat(60));
  console.log('🎉 Migration Complete!');
  console.log('═'.repeat(60));
  console.log(`Total processed: ${totalStats.processed}`);
  console.log(`Total skipped: ${totalStats.skipped}`);
  console.log(`Total failed: ${totalStats.failed}`);
  
  if (totalStats.processed > 0) {
    console.log(`\n⏰ Wait 2-3 minutes for all WebP thumbnails to be generated.`);
    console.log(`Then check Firebase Storage to verify _200x300.webp files exist.`);
    console.log(`\nAfter verification, enable WebP in code:`);
    console.log(`Set USE_WEBP_OPTIMIZATION = true in TemplatePickerModalContent.tsx`);
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
