import 'dotenv/config';
import { getFirestore } from '../server/tryon/firebaseAdmin.ts';

async function checkUser(email: string) {
  const db = getFirestore();
  
  console.log(`🔍 Searching for user with email: ${email}`);
  const snapshot = await db.collection('users').where('email', '==', email).get();
  
  if (snapshot.empty) {
    console.log(`❌ No user found in 'users' collection with email: ${email}`);
    return;
  }
  
  for (const doc of snapshot.docs) {
    const userId = doc.id;
    const userData = doc.data();
    console.log(`\n📄 [users] collection document (${userId}):`);
    console.log(JSON.stringify(userData, null, 2));
    
    const profileDoc = await db.collection('user_profiles').doc(userId).get();
    if (profileDoc.exists) {
        console.log(`\n📄 [user_profiles] collection document (${userId}):`);
        console.log(JSON.stringify(profileDoc.data(), null, 2));
    } else {
        console.log(`\n❌ No document found in 'user_profiles' for UID: ${userId}`);
    }
  }
}

const email = process.argv[2] || 'master.admin@khuyoot.app';
checkUser(email).catch(console.error);
