/**
 * سكريبت لعرض جميع الأقسام الموجودة في Firebase
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBAZnpSeoFEDJ9aHiyCaxN7H7-LBg11lz0",
  authDomain: "khuyoot-app01.firebaseapp.com",
  projectId: "khuyoot-app01",
  storageBucket: "khuyoot-app01.firebasestorage.app",
  messagingSenderId: "819942872255",
  appId: "1:819942872255:web:bfa6ea6e1f8aee949e4a1e",
  measurementId: "G-JY4T6QRPNT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listCategories() {
  try {
    console.log('📂 الأقسام الموجودة في Firebase:\n');
    
    const categoriesRef = collection(db, 'imageLibraryCategories');
    const q = query(categoriesRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('⚠️ لا توجد أقسام!');
      return;
    }
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. القسم:`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   nameEn: ${data.nameEn}`);
      console.log(`   nameAr: ${data.nameAr}`);
      console.log(`   order: ${data.order}`);
      console.log('');
    });
    
    console.log(`\n📊 إجمالي الأقسام: ${snapshot.size}`);
    
  } catch (error) {
    console.error('❌ خطأ في جلب الأقسام:', error);
  }
}

listCategories()
  .then(() => {
    console.log('\n✨ تم الانتهاء');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ فشل السكريبت:', error);
    process.exit(1);
  });
