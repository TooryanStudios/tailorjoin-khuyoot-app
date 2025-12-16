/**
 * Browser Migration Script - Run this in the browser console while logged in as admin
 * 
 * Instructions:
 * 1. Open your app in the browser and login as admin
 * 2. Navigate to the admin panel (http://localhost:3001/admin)
 * 3. Open browser console (F12)
 * 4. Copy and paste this entire script into the console
 * 5. Press Enter to run
 */

(async function migrateUsersInBrowser() {
  console.log('🚀 Starting user migration from browser...\n');
  
  try {
    const { firebaseService } = await import('./services/firebase.ts');
    
    // Get all users
    const users = await firebaseService.getAllUsers();
    console.log(`📊 Found ${users.length} users to process\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      console.log(`\n👤 Processing: ${user.name} (${user.role})`);
      
      const updates = {};
      let needsUpdate = false;
      
      // Check and add missing fields
      if (user.profileImage === undefined) {
        updates.profileImage = '';
        needsUpdate = true;
        console.log('  ➕ Adding profileImage');
      }
      
      if (user.boardImage === undefined) {
        updates.boardImage = '';
        needsUpdate = true;
        console.log('  ➕ Adding boardImage');
      }
      
      if (user.bio === undefined) {
        updates.bio = '';
        needsUpdate = true;
        console.log('  ➕ Adding bio');
      }
      
      if (user.loginId === undefined) {
        updates.loginId = user.phone || user.email || '';
        needsUpdate = true;
        console.log(`  ➕ Adding loginId: ${updates.loginId}`);
      }
      
      if (user.createdByAdmin === undefined) {
        updates.createdByAdmin = false;
        needsUpdate = true;
        console.log('  ➕ Adding createdByAdmin');
      }
      
      if (user.requirePasswordChange === undefined) {
        updates.requirePasswordChange = false;
        needsUpdate = true;
        console.log('  ➕ Adding requirePasswordChange');
      }
      
      // Merchant fields
      if (user.role === 'tailor' || user.role === 'shop' || user.role === 'boutique') {
        if (user.experience === undefined) {
          updates.experience = '';
          needsUpdate = true;
          console.log('  ➕ Adding experience');
        }
        
        if (user.approvalStatus === undefined) {
          updates.approvalStatus = 'approved';
          needsUpdate = true;
          console.log('  ➕ Adding approvalStatus');
        }
        
        if (user.location === undefined) {
          updates.location = user.region || '';
          needsUpdate = true;
          console.log('  ➕ Adding location');
        }
        
        if (user.specialization === undefined) {
          updates.specialization = '';
          needsUpdate = true;
          console.log('  ➕ Adding specialization');
        }
      }
      
      // Regular user fields
      if (user.role === 'user' && user.ageGroup === undefined) {
        updates.ageGroup = '';
        needsUpdate = true;
        console.log('  ➕ Adding ageGroup');
      }
      
      if (needsUpdate) {
        try {
          await firebaseService.updateUser(user.id, updates);
          updatedCount++;
          console.log('  ✅ Updated successfully');
        } catch (error) {
          errorCount++;
          console.error('  ❌ Error:', error.message);
        }
      } else {
        skippedCount++;
        console.log('  ⏭️ No updates needed');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Updated:  ${updatedCount} users`);
    console.log(`⏭️ Skipped:  ${skippedCount} users`);
    console.log(`❌ Errors:   ${errorCount} users`);
    console.log(`📊 Total:    ${users.length} users`);
    console.log('='.repeat(60));
    console.log('\n✨ Migration completed!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
})();
