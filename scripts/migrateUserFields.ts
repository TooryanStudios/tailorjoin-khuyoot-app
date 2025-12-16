/**
 * Migration Script: Add Missing Fields to Existing Users
 * 
 * This script updates all existing user documents in Firestore to include
 * the following fields if they're missing:
 * - profileImage
 * - boardImage
 * - bio
 * - loginId
 * - experience
 * - createdByAdmin
 * - requirePasswordChange
 * - approvalStatus (for merchants)
 * 
 * Run with: npx ts-node scripts/migrateUserFields.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Firebase configuration (use your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyBTJ7a17c5R0PsHLWR3gVVazQxAR0JRYzg",
  authDomain: "khuyoot-app01.firebaseapp.com",
  projectId: "khuyoot-app01",
  storageBucket: "khuyoot-app01.firebasestorage.app",
  messagingSenderId: "664987294213",
  appId: "1:664987294213:web:72e1d4f5d53e8a9b8c7c4e",
  measurementId: "G-SRRW6CJWZ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface UserDoc {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
  loginId?: string;
  region?: string;
  ageGroup?: string;
  shopType?: string;
  location?: string;
  specialization?: string;
  experience?: string;
  profileImage?: string;
  boardImage?: string;
  bio?: string;
  createdByAdmin?: boolean;
  requirePasswordChange?: boolean;
  approvalStatus?: string;
  [key: string]: any;
}

async function migrateUsers() {
  console.log('🚀 Starting user migration...\n');

  try {
    // Get all users
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    console.log(`📊 Found ${snapshot.size} users to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const userDoc of snapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data() as UserDoc;

      console.log(`\n👤 Processing: ${userData.name || userId} (${userData.role || 'unknown'})`);

      // Determine which fields are missing
      const updates: any = {};
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
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, updates);
          updatedCount++;
          console.log(`  ✅ Updated successfully`);
        } catch (error) {
          errorCount++;
          console.error(`  ❌ Error updating:`, error);
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
    console.log(`📊 Total:    ${snapshot.size} users`);
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
