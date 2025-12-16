/**
 * سكريبت لإصلاح مشاكل تصنيفات المنتجات
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

async function fixProductCategories() {
  try {
    console.log('🔧 بدء إصلاح تصنيفات المنتجات...\n');
    
    const categoriesRef = collection(db, 'productCategories');
    const snapshot = await getDocs(categoriesRef);
    
    let fixedCount = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const updates: any = {};
      let needsUpdate = false;
      
      // إصلاح 1: التصنيفات من level 0 يجب أن لا يكون لها parentId
      if ((data.level === 0 || data.level === undefined) && data.parentId) {
        console.log(`⚠️  إصلاح: ${data.nameAr} - إزالة parentId من تصنيف المستوى 0`);
        updates.parentId = null;
        needsUpdate = true;
      }
      
      // إصلاح 2: الملابس النسائية يجب أن تكون fashion
      if (data.nameAr === 'الملابس النسائية' && data.categoryType !== 'fashion') {
        console.log(`⚠️  إصلاح: ${data.nameAr} - تغيير النوع إلى fashion`);
        updates.categoryType = 'fashion';
        needsUpdate = true;
      }
      
      // إصلاح 3: وزار يجب أن يكون fashion
      if (data.nameAr === 'وزار' && data.categoryType !== 'fashion') {
        console.log(`⚠️  إصلاح: ${data.nameAr} - تغيير النوع إلى fashion`);
        updates.categoryType = 'fashion';
        needsUpdate = true;
      }
      
      // إصلاح 4: حذف XXXXXXXX إذا كان موجوداً
      if (data.nameAr === 'XXXXXXXX' || data.nameEn === 'XXXXXXXXXX') {
        console.log(`❌ تجاهل: ${data.nameAr} - سيتم حذفه يدوياً إذا لزم الأمر`);
        continue;
      }
      
      // تطبيق التحديثات
      if (needsUpdate) {
        const docRef = doc(db, 'productCategories', docSnap.id);
        await updateDoc(docRef, updates);
        fixedCount++;
        console.log(`✅ تم إصلاح: ${data.nameAr}`);
      }
    }
    
    console.log(`\n📊 الإحصائيات:`);
    console.log(`   عدد التصنيفات المُصلحة: ${fixedCount}`);
    console.log(`\n✅ تم الانتهاء من الإصلاح`);
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح التصنيفات:', error);
    throw error;
  }
}

fixProductCategories().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
