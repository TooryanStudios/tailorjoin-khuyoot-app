// Quick Firebase connectivity test
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log('🔧 Firebase Config Check:');
console.log('  Project ID:', firebaseConfig.projectId);
console.log('  Auth Domain:', firebaseConfig.authDomain);
console.log('  Storage Bucket:', firebaseConfig.storageBucket);

try {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  console.log('✅ Firebase initialized successfully');
  console.log('🔍 Testing Firestore read access...');
  
  // Test reading from users collection
  const usersRef = collection(db, 'users');
  const q = query(usersRef, limit(5));
  const snapshot = await getDocs(q);
  
  console.log(`✅ Firestore read successful: ${snapshot.size} users found`);
  
  if (snapshot.size > 0) {
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - User: ${data.shopName || data.name || doc.id} (${data.role || 'no role'})`);
    });
  }
  
  // Test system collection
  const systemRef = collection(db, 'system');
  const systemSnapshot = await getDocs(query(systemRef, limit(1)));
  console.log(`✅ System collection accessible: ${systemSnapshot.size} docs`);
  
  console.log('\n🎉 Database is working correctly!');
  process.exit(0);
  
} catch (error) {
  console.error('❌ Firebase Test Failed:', error);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  process.exit(1);
}
