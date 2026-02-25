import 'dotenv/config';
import { getFirestore, getFirebaseAdminApp } from '../server/tryon/firebaseAdmin.ts';

async function setAdminRole() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('Usage: npm run set-admin <email>');
    console.log('Example: npm run set-admin admin@test.com');
    process.exit(1);
  }

  try {
    const app = getFirebaseAdminApp();
    const db = getFirestore();
    const auth = app.auth();
    
    console.log(`🔍 Searching for user in Auth with email: ${email}`);
    let authUser;
    try {
      authUser = await auth.getUserByEmail(email);
      console.log(`✅ Found in Auth: UID ${authUser.uid}`);
    } catch (e) {
      console.log(`❌ No user found in Firebase Auth with email: ${email}`);
      console.log('💡 The user must sign up first.');
      process.exit(1);
    }

    const userId = authUser.uid;
    console.log(`\n🔧 Updating Firestore documents for UID: ${userId}`);
    
    // Update 'users' collection
    await db.collection('users').doc(userId).set({ 
      role: 'admin',
      adminAccess: {
        mode: 'full',
        sections: ['*'],
        deniedSections: [],
        configSections: ['*'],
        deniedConfigSections: []
      },
      adminPermissions: {
        mode: 'full',
        sections: ['*'],
        deniedSections: [],
        configSections: ['*'],
        deniedConfigSections: []
      },
      email: email, // ensure email matches
      updatedAt: new Date()
    }, { merge: true });
    console.log('✅ Updated users/role = admin');

    // Update 'user_profiles' collection
    await db.collection('user_profiles').doc(userId).set({ 
      role: 'admin',
      adminAccess: {
        mode: 'full',
        sections: ['*'],
        deniedSections: [],
        configSections: ['*'],
        deniedConfigSections: []
      },
      adminPermissions: {
        mode: 'full',
        sections: ['*'],
        deniedSections: [],
        configSections: ['*'],
        deniedConfigSections: []
      },
      updatedAt: new Date()
    }, { merge: true });
    console.log('✅ Updated user_profiles/role = admin');

    // Set Custom Claims
    console.log('🔧 Setting Custom Claims in Auth...');
    await auth.setCustomUserClaims(userId, { role: 'admin', admin: true });
    console.log('✅ Custom Claims set successfully!');

    console.log('\n✨ ALL DONE! ✨');
    console.log('🔄 The user MUST LOG OUT and LOG BACK IN for these changes to take effect.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error updating admin role:', error.message);
    process.exit(1);
  }
}

setAdminRole();
