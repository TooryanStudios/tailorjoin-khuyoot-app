/**
 * سكريبت لتصحيح أسماء الأقسام في Firebase
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';

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

// خريطة التصحيح: القيمة القديمة -> القيمة الجديدة
const nameMapping: Record<string, { nameEn: string; nameAr: string }> = {
  'Dishdashas': { nameEn: 'dishdasha', nameAr: 'دشداشة' },
  'Abayat': { nameEn: 'abaya', nameAr: 'عباية' },
  'Dresses': { nameEn: 'dress', nameAr: 'فستان' }
};

async function fixCategoryNames() {
  try {
    console.log('🔧 بدء تصحيح أسماء الأقسام...\n');
    
    const categoriesRef = collection(db, 'imageLibraryCategories');
    const snapshot = await getDocs(categoriesRef);
    
    console.log(`📂 عدد الأقسام: ${snapshot.size}\n`);
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const oldNameEn = data.nameEn;
      
      if (nameMapping[oldNameEn]) {
        const newData = nameMapping[oldNameEn];
        console.log(`✏️ تحديث القسم:`);
        console.log(`   ID: ${docSnap.id}`);
        console.log(`   من: ${oldNameEn}`);
        console.log(`   إلى: ${newData.nameEn} (${newData.nameAr})`);
        
        await updateDoc(doc(db, 'imageLibraryCategories', docSnap.id), {
          nameEn: newData.nameEn,
          nameAr: newData.nameAr
        });
        
        console.log(`   ✅ تم التحديث\n`);
      } else {
        console.log(`⏭️ تخطي القسم: ${oldNameEn} (لا يحتاج تحديث)\n`);
      }
    }
    
    console.log('✅ اكتمل التصحيح!');
    
  } catch (error) {
    console.error('❌ خطأ في تصحيح الأسماء:', error);
  }
}

fixCategoryNames()
  .then(() => {
    console.log('\n✨ تم الانتهاء من السكريبت');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ فشل السكريبت:', error);
    process.exit(1);
  });
