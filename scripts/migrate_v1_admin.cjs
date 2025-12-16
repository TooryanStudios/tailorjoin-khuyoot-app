/**
 * User Schema Migration V1 - Admin SDK Version
 * 
 * Safely adds all new schema v1 fields to existing user documents.
 * Uses Firebase Admin SDK to bypass security rules.
 * Can be run multiple times - only updates missing fields.
 * 
 * Run with: node scripts/migrate_v1_admin.cjs
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: "khuyoot-app01",
  storageBucket: "khuyoot-app01.firebasestorage.app"
});

const db = admin.firestore();

/**
 * Determine user role from existing data
 */
function determineRole(userData) {
  if (userData.role === 'admin') return 'admin';
  if (userData.role === 'tailor' || userData.shopType) return 'tailor';
  return 'customer';
}

/**
 * Determine account status from existing data
 */
function determineAccountStatus(userData) {
  if (userData.blockedByAdmin === true) return 'banned';
  if (userData.approvalStatus === 'approved') return 'active';
  if (userData.approvalStatus === 'rejected') return 'suspended';
  return 'pending_review';
}

/**
 * Determine verification status for tailors
 */
function determineVerificationStatus(userData) {
  if (userData.approvalStatus === 'approved') return 'verified';
  if (userData.approvalStatus === 'pending') return 'pending';
  if (userData.approvalStatus === 'rejected') return 'rejected';
  return 'unverified';
}

/**
 * Get missing fields for a user
 */
function getMissingFields(userData, userId) {
  const updates = {};
  const role = determineRole(userData);
  const isTailor = role === 'tailor';

  // System fields
  if (!userData.uid) updates.uid = userId;
  if (!userData.role) updates.role = role;
  if (!userData.accountStatus) updates.accountStatus = determineAccountStatus(userData);
  if (!userData.dataVersion) updates.dataVersion = 1;
  
  // Timestamps
  if (!userData.createdAt) updates.createdAt = userData.joinDate || admin.firestore.Timestamp.now();
  if (!userData.updatedAt) updates.updatedAt = admin.firestore.Timestamp.now();
  if (!userData.lastLoginAt) updates.lastLoginAt = userData.createdAt || admin.firestore.Timestamp.now();

  // Verification
  if (userData.isEmailVerified === undefined) updates.isEmailVerified = false;
  if (userData.isPhoneVerified === undefined) updates.isPhoneVerified = !!userData.phoneNumber;
  if (!userData.authProvider) updates.authProvider = 'password';
  if (!userData.passwordUpdatedAt) updates.passwordUpdatedAt = userData.createdAt || admin.firestore.Timestamp.now();

  // Language & Notifications
  if (!userData.preferredLanguage) updates.preferredLanguage = 'ar';
  if (!userData.notificationPreferences) {
    updates.notificationPreferences = {
      email: true,
      sms: true,
      push: true,
      whatsapp: true
    };
  }

  // Core content fields
  if (userData.profileImage === undefined) updates.profileImage = '';
  if (userData.boardImage === undefined) updates.boardImage = '';
  if (userData.bio === undefined) updates.bio = '';

  // Location
  if (!userData.coordinates) updates.coordinates = { lat: 0, lng: 0 };
  if (!userData.serviceAreas) {
    updates.serviceAreas = userData.region ? [userData.region] : [];
  }

  // Tailor-specific fields
  if (isTailor) {
    if (!userData.shopName) updates.shopName = userData.name || 'محل الخياطة';
    if (!userData.services) updates.services = [];
    if (!userData.specializations) updates.specializations = userData.specialization ? [userData.specialization] : [];
    if (!userData.workingHours) {
      updates.workingHours = {
        days: 'السبت - الخميس',
        from: '09:00',
        to: '18:00'
      };
    }
    if (userData.deliveryAvailable === undefined) updates.deliveryAvailable = false;
    if (userData.homeVisitAvailable === undefined) updates.homeVisitAvailable = false;
    if (!userData.verificationStatus) updates.verificationStatus = determineVerificationStatus(userData);
    if (userData.businessLicense === undefined) updates.businessLicense = '';
    if (!userData.verificationDocuments) updates.verificationDocuments = [];
    if (!userData.socialMedia) {
      updates.socialMedia = {
        instagram: '',
        tiktok: '',
        snapchat: '',
        website: ''
      };
    }
    if (!userData.priceRange) {
      updates.priceRange = {
        min: 0,
        max: 0,
        currency: 'SAR'
      };
    }
    if (userData.acceptingOrders === undefined) {
      updates.acceptingOrders = userData.accountStatus === 'active';
    }
    if (userData.maxActiveOrders === undefined) updates.maxActiveOrders = 10;
    if (userData.isVisible === undefined) {
      updates.isVisible = userData.approvalStatus === 'approved';
    }
  }

  // Stats
  if (userData.ratingAvg === undefined) updates.ratingAvg = userData.rating || 0;
  if (userData.ratingCount === undefined) updates.ratingCount = userData.reviewsCount || 0;
  if (userData.completedOrdersCount === undefined) updates.completedOrdersCount = 0;

  // Monetization
  if (!userData.subscription) {
    updates.subscription = {
      tier: 'free',
      expiresAt: null
    };
  }

  // Compliance
  if (!userData.termsAcceptedAt) updates.termsAcceptedAt = userData.createdAt || admin.firestore.Timestamp.now();
  if (!userData.privacyAcceptedAt) updates.privacyAcceptedAt = userData.createdAt || admin.firestore.Timestamp.now();
  if (userData.reportsCount === undefined) updates.reportsCount = 0;
  if (userData.blockedByAdmin === undefined) updates.blockedByAdmin = false;

  return updates;
}

/**
 * Main migration function
 */
async function migrateUsers() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 KHUYOOT USER SCHEMA MIGRATION V1 (ADMIN SDK)');
  console.log('='.repeat(70) + '\n');

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Found ${usersSnapshot.size} users to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const batchSize = 5;

    // Process in batches
    const users = usersSnapshot.docs;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      await Promise.all(batch.map(async (userDoc) => {
        const userId = userDoc.id;
        const userData = userDoc.data();

        console.log(`\n👤 Processing: ${userData.name || userId} (${userData.role || 'unknown'}) [${userId}]`);

        try {
          // Get missing fields
          const missingFields = getMissingFields(userData, userId);

          if (Object.keys(missingFields).length === 0) {
            skippedCount++;
            console.log('  ⏭️  Already complete - no updates needed');
            return;
          }

          // Show what will be added
          console.log(`  ➕ Adding ${Object.keys(missingFields).length} fields:`);
          Object.keys(missingFields).forEach(key => {
            const value = missingFields[key];
            const preview = typeof value === 'object' 
              ? JSON.stringify(value).substring(0, 50) + '...'
              : String(value);
            console.log(`     - ${key}: ${preview}`);
          });

          // Update Firestore
          await userDoc.ref.update(missingFields);
          updatedCount++;
          console.log('  ✅ Updated successfully');

        } catch (error) {
          errorCount++;
          console.error(`  ❌ Error: ${error.message}`);
        }
      }));

      // Small delay between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📈 MIGRATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Updated:  ${updatedCount} users`);
    console.log(`⏭️  Skipped:  ${skippedCount} users (already complete)`);
    console.log(`❌ Errors:   ${errorCount} users`);
    console.log(`📊 Total:    ${users.length} users`);
    console.log(`🎯 Success:  ${((updatedCount / users.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(70) + '\n');

    if (errorCount > 0) {
      console.log('⚠️  Some users had errors. Please check the logs above.');
    } else {
      console.log('✅ Migration completed successfully!');
    }

  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run migration
migrateUsers();
