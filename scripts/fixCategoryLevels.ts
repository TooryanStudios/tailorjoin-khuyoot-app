/**
 * سكريبت لإصلاح مستويات التصنيفات
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

async function fixCategoryLevels() {
  try {
    console.log('🔧 بدء إصلاح مستويات التصنيفات...\n');
    
    const categoriesRef = collection(db, 'productCategories');
    const snapshot = await getDocs(categoriesRef);
    
    // إنشاء خريطة للتصنيفات
    const categoriesMap = new Map();
    snapshot.docs.forEach((doc) => {
      categoriesMap.set(doc.id, { id: doc.id, ...doc.data() });
    });
    
    let fixedCount = 0;
    
    // التصنيفات التي يجب تصحيحها
    const toFix = [
      { name: 'الجلابية', expectedLevel: 2 },
      { name: 'اللبس التقليدي', expectedLevel: 2 },
      { name: 'المخور', expectedLevel: 2 }
    ];
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      // البحث في قائمة التصنيفات التي تحتاج تصحيح
      const fixInfo = toFix.find(f => f.name === data.nameAr);
      
      if (fixInfo && data.level !== fixInfo.expectedLevel) {
        console.log(`⚠️  إصلاح: ${data.nameAr}`);
        console.log(`   Level الحالي: ${data.level}`);
        console.log(`   Level الصحيح: ${fixInfo.expectedLevel}`);
        console.log(`   ParentID: ${data.parentId?.substring(0, 12)}...`);
        
        const docRef = doc(db, 'productCategories', docSnap.id);
        await updateDoc(docRef, {
          level: fixInfo.expectedLevel
        });
        
        fixedCount++;
        console.log(`✅ تم التصحيح\n`);
      }
    }
    
    console.log(`📊 الإحصائيات:`);
    console.log(`   عدد التصنيفات المُصلحة: ${fixedCount}`);
    console.log(`\n✅ تم الانتهاء من الإصلاح`);
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح التصنيفات:', error);
    throw error;
  }
}

fixCategoryLevels().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
