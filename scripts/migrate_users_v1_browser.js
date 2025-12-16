/**
 * User Schema Migration Script v1
 * 
 * Safely adds new fields to existing user documents.
 * Can be run multiple times - only updates missing fields.
 * 
 * Usage:
 * 1. Login to admin panel
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire file into console
 * 4. The migration will run automatically
 */

(async function migrateUsersSchemaV1() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 KHUYOOT USER SCHEMA MIGRATION V1');
  console.log('='.repeat(70) + '\n');
  
  try {
    // Import required services
    const { firebaseService } = await import('./services/firebase.ts');
    const { applyUserDefaults, getMissingFields } = await import('./utils/userDefaults.ts');
    
    // Get all users
    const users = await firebaseService.getAllUsers();
    console.log(`📊 Found ${users.length} users to process\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const batchSize = 5;
    
    // Process in batches to avoid overwhelming Firestore
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (user) => {
        const userId = user.id || user.uid;
        console.log(`\n👤 Processing: ${user.name} (${user.role}) [${userId}]`);
        
        try {
          // Get the normalized user with all defaults applied
          const normalizedUser = applyUserDefaults(user, userId);
          
          // Get only the missing fields
          const missingFields = getMissingFields(user, normalizedUser);
          
          if (Object.keys(missingFields).length === 0) {
            skippedCount++;
            console.log('  ⏭️  Already complete - no updates needed');
            return;
          }
          
          // Log what will be added
          const fieldNames = Object.keys(missingFields);
          console.log(`  ➕ Adding ${fieldNames.length} field(s):`);
          fieldNames.forEach(field => {
            const value = missingFields[field];
            const preview = typeof value === 'object' 
              ? JSON.stringify(value).substring(0, 50) + '...'
              : String(value);
            console.log(`     • ${field}: ${preview}`);
          });
          
          // Update Firestore
          await firebaseService.updateUser(userId, missingFields);
          updatedCount++;
          console.log('  ✅ Updated successfully');
          
        } catch (error) {
          errorCount++;
          console.error('  ❌ Error:', error.message || error);
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
    console.log(`✅ Updated:       ${updatedCount} users`);
    console.log(`⏭️  Skipped:       ${skippedCount} users (already complete)`);
    console.log(`❌ Errors:        ${errorCount} users`);
    console.log(`📊 Total:         ${users.length} users`);
    console.log(`📈 Success Rate:  ${((updatedCount / users.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(70) + '\n');
    
    if (updatedCount > 0) {
      console.log('🎉 Migration completed successfully!');
      console.log('💡 Tip: Reload the page to see the changes reflected in the UI.\n');
    } else {
      console.log('✨ All users are already up to date!\n');
    }
    
  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error);
    console.error('Migration aborted.\n');
  }
})();
