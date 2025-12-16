/**
 * سكريبت لفحص تصنيفات المنتجات في Firebase
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

async function checkProductCategories() {
  try {
    console.log('📂 تصنيفات المنتجات في Firebase:\n');
    console.log('='.repeat(80));
    
    const categoriesRef = collection(db, 'productCategories');
    const q = query(categoriesRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('⚠️ لا توجد تصنيفات!');
      return;
    }
    
    // تجميع التصنيفات حسب المستوى
    const byLevel: { [key: number]: any[] } = {};
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const level = data.level ?? 0;
      
      if (!byLevel[level]) {
        byLevel[level] = [];
      }
      
      byLevel[level].push({
        id: doc.id,
        ...data
      });
    });
    
    // عرض التصنيفات حسب المستوى
    Object.keys(byLevel).sort().forEach((levelStr) => {
      const level = parseInt(levelStr);
      const categories = byLevel[level];
      
      console.log(`\n${'🌳'.repeat(level + 1)} المستوى ${level} (${categories.length} تصنيف):`);
      console.log('-'.repeat(80));
      
      categories.forEach((cat, index) => {
        console.log(`\n${index + 1}. ${cat.nameAr} (${cat.nameEn})`);
        console.log(`   ID: ${cat.id.substring(0, 12)}...`);
        console.log(`   Level: ${cat.level ?? 'غير محدد'}`);
        console.log(`   ParentID: ${cat.parentId ? cat.parentId.substring(0, 12) + '...' : 'لا يوجد (جذر)'}`);
        console.log(`   CategoryType: ${cat.categoryType || 'غير محدد'}`);
        console.log(`   Order: ${cat.order}`);
        console.log(`   Active: ${cat.isActive ? '✅' : '❌'}`);
        console.log(`   Image: ${cat.image ? '✅ موجودة' : '❌ غير موجودة'}`);
      });
    });
    
    // إحصائيات
    console.log('\n' + '='.repeat(80));
    console.log('📊 الإحصائيات:');
    console.log(`   إجمالي التصنيفات: ${snapshot.size}`);
    
    const fashionCount = snapshot.docs.filter(doc => doc.data().categoryType === 'fashion').length;
    const otherCount = snapshot.docs.filter(doc => doc.data().categoryType === 'other').length;
    const undefinedCount = snapshot.docs.filter(doc => !doc.data().categoryType).length;
    
    console.log(`   تصنيفات أزياء (fashion): ${fashionCount}`);
    console.log(`   تصنيفات أخرى (other): ${otherCount}`);
    console.log(`   غير محدد: ${undefinedCount}`);
    
    Object.keys(byLevel).forEach((levelStr) => {
      const level = parseInt(levelStr);
      console.log(`   المستوى ${level}: ${byLevel[level].length} تصنيف`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في جلب التصنيفات:', error);
  }
}

checkProductCategories().then(() => {
  console.log('\n✅ تم الانتهاء من الفحص');
  process.exit(0);
}).catch((error) => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
