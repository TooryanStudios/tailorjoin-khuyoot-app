/**
 * Migration Script: Add Missing Fields to Existing Users (ADMIN VERSION)
 * 
 * This script uses Firebase Admin SDK to bypass security rules
 * and update all user documents directly.
 * 
 * Run with: node scripts/migrateUserFields-admin.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
// Note: In production, use a service account JSON file
// For now, we'll use application default credentials
admin.initializeApp({
  projectId: "khuyoot-app01",
  storageBucket: "khuyoot-app01.firebasestorage.app"
});

const db = admin.firestore();

async function migrateUsers() {
  console.log('🚀 Starting user migration (ADMIN MODE)...\n');

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();

    console.log(`📊 Found ${usersSnapshot.size} users to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      console.log(`\n👤 Processing: ${userData.name || userId} (${userData.role || 'unknown'})`);

      // Determine which fields are missing
      const updates = {};
      let needsUpdate = false;

      // Core image and content fields - always add if missing
      if (userData.profileImage === undefined) {
        updates.profileImage = '';
        needsUpdate = true;
        console.log('  ➕ Adding profileImage');
      }

      if (userData.boardImage === undefined) {
        updates.boardImage = '';
        needsUpdate = true;
        console.log('  ➕ Adding boardImage');
      }

      if (userData.bio === undefined) {
        updates.bio = '';
        needsUpdate = true;
        console.log('  ➕ Adding bio');
      }

      // Login and contact fields
      if (userData.loginId === undefined) {
        // Default to phone or email
        updates.loginId = userData.phone || userData.email || '';
        needsUpdate = true;
        console.log(`  ➕ Adding loginId: ${updates.loginId}`);
      }

      // Admin control fields
      if (userData.createdByAdmin === undefined) {
        updates.createdByAdmin = false;
        needsUpdate = true;
        console.log('  ➕ Adding createdByAdmin: false');
      }

      if (userData.requirePasswordChange === undefined) {
        updates.requirePasswordChange = false;
        needsUpdate = true;
        console.log('  ➕ Adding requirePasswordChange: false');
      }

      // Merchant-specific fields
      if (userData.role === 'tailor' || userData.role === 'shop' || userData.role === 'boutique') {
        if (userData.experience === undefined) {
          updates.experience = '';
          needsUpdate = true;
          console.log('  ➕ Adding experience (merchant)');
        }

        if (userData.approvalStatus === undefined) {
          // Default to approved for existing merchants
          updates.approvalStatus = 'approved';
          needsUpdate = true;
          console.log('  ➕ Adding approvalStatus: approved (merchant)');
        }

        if (userData.location === undefined) {
          updates.location = userData.region || '';
          needsUpdate = true;
          console.log(`  ➕ Adding location: ${updates.location} (merchant)`);
        }

        if (userData.specialization === undefined) {
          updates.specialization = '';
          needsUpdate = true;
          console.log('  ➕ Adding specialization (merchant)');
        }
      }

      // Regular user fields
      if (userData.role === 'user') {
        if (userData.ageGroup === undefined) {
          updates.ageGroup = '';
          needsUpdate = true;
          console.log('  ➕ Adding ageGroup (regular user)');
        }
      }

      // Update document if needed
      if (needsUpdate) {
        try {
          await db.collection('users').doc(userId).update(updates);
          updatedCount++;
          console.log(`  ✅ Updated successfully`);
        } catch (error) {
          errorCount++;
          console.error(`  ❌ Error updating:`, error.message);
        }
      } else {
        skippedCount++;
        console.log('  ⏭️ No updates needed (all fields present)');
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Updated:  ${updatedCount} users`);
    console.log(`⏭️ Skipped:  ${skippedCount} users (already complete)`);
    console.log(`❌ Errors:   ${errorCount} users`);
    console.log(`📊 Total:    ${usersSnapshot.size} users`);
    console.log('='.repeat(60));
    console.log('\n✨ Migration completed!\n');

  } catch (error) {
    console.error('\n💥 Fatal error during migration:', error);
    process.exit(1);
  }
}

// Run migration
migrateUsers()
  .then(() => {
    console.log('🎉 Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
