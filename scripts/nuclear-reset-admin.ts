import 'dotenv/config';
import { getFirestore, getFirebaseAdminApp } from '../server/tryon/firebaseAdmin.ts';

async function nuclearResetAdmin() {
  const email = process.argv[2] || 'master.admin@khuyoot.app';
  
  console.log(`\n☢️  Starting NUCLEAR RESET for: ${email}\n`);

  try {
    const app = getFirebaseAdminApp();
    const db = getFirestore();
    const auth = app.auth();
    
    // 1. Find User
    console.log(`🔍 Locating user in Auth...`);
    let authUser;
    try {
      authUser = await auth.getUserByEmail(email);
      console.log(`✅ Found Auth UID: ${authUser.uid}`);
    } catch (e) {
      console.log(`❌ User not found in Auth. Please sign up first.`);
      process.exit(1);
    }

    const uid = authUser.uid;

    // 2. Delete existing docs (to ensure no stale data/schema issues)
    console.log(`🗑️ Deleting existing documents for ${uid}...`);
    await db.collection('users').doc(uid).delete();
    await db.collection('user_profiles').doc(uid).delete();
    console.log(`✅ Old documents deleted.`);

    // 3. Recreate documents with explicitly correct data
    console.log(`📝 Creating new Admin documents...`);
    const now = new Date();
    
    // Create 'users' doc
    await db.collection('users').doc(uid).set({
      uid: uid,
      id: uid,
      email: email,
      role: 'admin',
      displayName: 'Master Admin',
      name: 'Master Admin',
      accountStatus: 'active',
      createdAt: now,
      updatedAt: now,
      dataVersion: 2
    });
    console.log(`✅ Created users/${uid} (role: admin)`);

    // Create 'user_profiles' doc (with extra fields needed by the app)
    await db.collection('user_profiles').doc(uid).set({
      uid: uid,
      user_id: uid,
      email: email,
      role: 'admin',
      name: 'Master Admin',
      credit_balance: 10000,
      tier: 'Gold',
      createdAt: now,
      updatedAt: now,
      dataVersion: 2
    });
    console.log(`✅ Created user_profiles/${uid} (role: admin, credits: 10000)`);

    // 4. Set Custom Claims
    console.log(`🔧 Setting Custom Claims: { role: 'admin', admin: true }`);
    await auth.setCustomUserClaims(uid, { role: 'admin', admin: true });
    console.log(`✅ Custom Claims set.`);

    // 5. Verify local Dev Server code
    console.log(`\n✨ RESET COMPLETE! ✨`);
    console.log(`--------------------------------------------------`);
    console.log(`👉 STEP 1: Go to the Admin Login page.`);
    console.log(`👉 STEP 2: Click "مسح الذاكرة التخزينية وتحديث الصفحة" (Clear Cache).`);
    console.log(`👉 STEP 3: LOGIN with ${email}.`);
    console.log(`--------------------------------------------------`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Critical Error during reset:', error.message);
    process.exit(1);
  }
}

nuclearResetAdmin();
