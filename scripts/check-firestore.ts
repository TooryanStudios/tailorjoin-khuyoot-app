import 'dotenv/config';
import { getFirestore, getFirebaseAdminApp } from '../server/tryon/firebaseAdmin.ts';

async function verifyFirestore() {
  const email = 'master.admin@khuyoot.app';
  try {
    const app = getFirebaseAdminApp();
    const db = getFirestore();
    const auth = app.auth();
    
    const authUser = await auth.getUserByEmail(email);
    const uid = authUser.uid;

    const userDoc = await db.collection('users').doc(uid).get();
    const profileDoc = await db.collection('user_profiles').doc(uid).get();

    console.log('--- AUTH ---');
    console.log('UID:', uid);
    console.log('Custom Claims:', JSON.stringify(authUser.customClaims));

    console.log('\n--- FIRESTORE USERS ---');
    if (userDoc.exists) {
      console.log(JSON.stringify(userDoc.data(), null, 2));
    } else {
      console.log('Document USERS does not exist!');
    }

    console.log('\n--- FIRESTORE PROFILES ---');
    if (profileDoc.exists) {
      console.log(JSON.stringify(profileDoc.data(), null, 2));
    } else {
      console.log('Document PROFILES does not exist!');
    }
    
    process.exit(0);
  } catch (e: any) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

verifyFirestore();
