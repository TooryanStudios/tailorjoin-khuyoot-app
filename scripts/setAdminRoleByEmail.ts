import 'dotenv/config';
import { getFirestore } from '../server/tryon/firebaseAdmin.ts';

async function setAdminRole() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('Usage: npm run set-admin <email>');
    console.log('Example: npm run set-admin admin@test.com');
    process.exit(1);
  }

  try {
    const db = getFirestore();
    
    console.log(`🔍 Searching for user with email: ${email}`);
    
    const snapshot = await db.collection('users').where('email', '==', email).get();
    
    if (snapshot.empty) {
      console.log(`❌ No user found with email: ${email}`);
      console.log('');
      console.log('💡 Make sure the user has logged in at least once so their document is created in Firestore.');
      process.exit(1);
    }
    
    const doc = snapshot.docs[0];
    const userId = doc.id;
    const userData = doc.data();
    
    console.log('✅ Found user:');
    console.log(`   Name: ${userData.name || 'N/A'}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   UID: ${userId}`);
    console.log(`   Current role: ${userData.role || 'none'}`);
    
    if (userData.role === 'admin') {
      console.log('');
      console.log('✨ User already has admin role!');
    } else {
      console.log('');
      console.log('🔧 Setting admin role...');
      
      await db.collection('users').doc(userId).set({ role: 'admin' }, { merge: true });
      
      console.log('✅ Admin role set successfully!');
      console.log('');
      console.log('🔄 The user needs to log out and log back in for changes to take effect.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setAdminRole().then(() => {
  process.exit(0);
});
