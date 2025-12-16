/**
 * سكريبت لتصحيح قسم Hdiya وإضافة nameAr له
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

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

async function fixHdiyaCategory() {
  try {
    console.log('🔧 تصحيح قسم Hdiya...\n');
    
    const categoryRef = doc(db, 'imageLibraryCategories', '3ywpDEBBKnyLncD3ZUAk');
    
    // تحديث القسم بالاسم الصحيح
    await updateDoc(categoryRef, {
      nameEn: 'hdiya',  // تصغير الحروف
      nameAr: 'حِظية'   // إضافة الاسم العربي
    });
    
    console.log('✅ تم تحديث القسم بنجاح!');
    console.log('   nameEn: hdiya');
    console.log('   nameAr: حِظية');
    
  } catch (error) {
    console.error('❌ خطأ في التحديث:', error);
  }
}

fixHdiyaCategory()
  .then(() => {
    console.log('\n✨ تم الانتهاء');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ فشل السكريبت:', error);
    process.exit(1);
  });
