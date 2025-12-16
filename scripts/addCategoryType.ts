import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBYGct85ijxDDa9ycX00Z8MlYphr84gbhI",
  authDomain: "khuyoot-app01.firebaseapp.com",
  projectId: "khuyoot-app01",
  storageBucket: "khuyoot-app01.firebasestorage.app",
  messagingSenderId: "1066975982276",
  appId: "1:1066975982276:web:4a0c73d3e8f8d5dc80bc1e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addCategoryTypeToExisting() {
  console.log('🔄 جاري تحديث التصنيفات الموجودة...\n');

  try {
    const categoriesRef = collection(db, 'productCategories');
    const snapshot = await getDocs(categoriesRef);
    
    console.log(`📊 عدد التصنيفات الموجودة: ${snapshot.docs.length}\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      // تحقق إذا كان categoryType موجود بالفعل
      if (data.categoryType) {
        console.log(`⏭️  تخطي: ${data.nameAr} - يحتوي بالفعل على categoryType: ${data.categoryType}`);
        skippedCount++;
        continue;
      }

      // تحديد نوع التصنيف بناءً على الاسم
      // يمكنك تعديل هذه القائمة حسب تصنيفاتك
      const fashionKeywords = [
        'ملابس', 'أزياء', 'ثوب', 'دشداشة', 'عباية', 'فستان', 'قميص',
        'بدلة', 'سروال', 'تنورة', 'جاكيت', 'معطف', 'بلوزة', 'كنزة',
        'fashion', 'clothes', 'dress', 'shirt', 'suit', 'thobe', 'dishdasha',
        'abaya', 'trouser', 'skirt', 'jacket', 'coat', 'blouse'
      ];

      const nameArLower = (data.nameAr || '').toLowerCase();
      const nameEnLower = (data.nameEn || '').toLowerCase();
      
      const isFashion = fashionKeywords.some(keyword => 
        nameArLower.includes(keyword) || nameEnLower.includes(keyword)
      );

      const categoryType = isFashion ? 'fashion' : 'other';

      // تحديث التصنيف
      await updateDoc(doc(db, 'productCategories', docSnap.id), {
        categoryType: categoryType
      });

      console.log(`✅ تم التحديث: ${data.nameAr} (${data.nameEn}) → ${categoryType}`);
      updatedCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ اكتمل التحديث!`);
    console.log(`📊 إحصائيات:`);
    console.log(`   - تم التحديث: ${updatedCount}`);
    console.log(`   - تم التخطي: ${skippedCount}`);
    console.log(`   - المجموع: ${snapshot.docs.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ حدث خطأ:', error);
    throw error;
  }
}

// تشغيل السكريبت
addCategoryTypeToExisting()
  .then(() => {
    console.log('\n✅ تم إنهاء السكريبت بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ فشل السكريبت:', error);
    process.exit(1);
  });
