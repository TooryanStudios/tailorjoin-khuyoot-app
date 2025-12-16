/**
 * سكريبت لتحديث الخياطين الحاليين بإضافة tailorGender
 * 
 * هذا السكريبت يساعد في تحديث الخياطين الذين سجلوا قبل إضافة نظام تحديد الجنس
 * 
 * الاستخدام:
 * npx tsx scripts/addTailorGender.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * تحديث خياط واحد
 */
async function updateTailorGender(tailorId: string, gender: 'male' | 'female') {
  try {
    const tailorRef = doc(db, 'users', tailorId);
    await updateDoc(tailorRef, {
      tailorGender: gender
    });
    console.log(`✅ تم تحديث الخياط ${tailorId} إلى ${gender}`);
    return true;
  } catch (error) {
    console.error(`❌ خطأ في تحديث الخياط ${tailorId}:`, error);
    return false;
  }
}

/**
 * تحديث جميع الخياطين الذين ليس لديهم tailorGender
 * الإعداد الافتراضي: رجالي (male) إلا إذا كان التخصص يشير لغير ذلك
 */
async function updateAllTailors() {
  try {
    console.log('🔍 البحث عن الخياطين الذين ليس لديهم tailorGender...');
    
    const usersRef = collection(db, 'users');
    const tailorsQuery = query(usersRef, where('role', '==', 'tailor'));
    const snapshot = await getDocs(tailorsQuery);
    
    console.log(`📊 تم العثور على ${snapshot.size} خياط`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      if (data.tailorGender) {
        console.log(`⏭️ تخطي ${data.name} (لديه tailorGender بالفعل: ${data.tailorGender})`);
        skipped++;
        continue;
      }
      
      console.log(`\n👤 خياط: ${data.name}`);
      console.log(`   ID: ${docSnap.id}`);
      console.log(`   التخصص: ${data.specialization || 'غير محدد'}`);
      console.log(`   الموقع: ${data.location || 'غير محدد'}`);
      
      // الإعداد الافتراضي: رجالي (male)
      // إلا إذا كان التخصص يشير بوضوح إلى خياطة نسائية
      let gender: 'male' | 'female' = 'male'; // الافتراضي رجالي
      
      const spec = (data.specialization || '').toLowerCase();
      const name = (data.name || '').toLowerCase();
      
      // فحص إذا كان نسائي
      if (spec.includes('نسائي') || spec.includes('عباية') || spec.includes('فستان') || 
          spec.includes('جلابية') || name.includes('نسائي') || name.includes('حريم')) {
        gender = 'female';
        console.log(`   🎀 سيتم تعيينه كخياط نسائي`);
      } else {
        console.log(`   👔 سيتم تعيينه كخياط رجالي (افتراضي)`);
      }
      
      const success = await updateTailorGender(docSnap.id, gender);
      if (success) updated++;
    }
    
    console.log(`\n✅ انتهى التحديث:`);
    console.log(`   - تم التحديث: ${updated}`);
    console.log(`   - تم التخطي: ${skipped}`);
    
  } catch (error) {
    console.error('❌ خطأ في تحديث الخياطين:', error);
  }
}

/**
 * أمثلة على التحديث اليدوي
 * قم بإلغاء التعليق وتعديل المعلومات حسب الحاجة
 */
async function manualUpdates() {
  // مثال: تحديث خياط معين
  // await updateTailorGender('TAILOR_ID_HERE', 'male');
  // await updateTailorGender('ANOTHER_TAILOR_ID', 'female');
}

// تشغيل السكريبت
async function main() {
  console.log('🚀 بدء تحديث بيانات الخياطين...\n');
  
  // اختر أحد الخيارات:
  
  // 1. تحديث تلقائي (يعتمد على التخصص)
  await updateAllTailors();
  
  // 2. تحديث يدوي (قم بتعديل دالة manualUpdates)
  // await manualUpdates();
  
  console.log('\n✅ انتهى السكريبت');
  process.exit(0);
}

// تشغيل
main().catch(error => {
  console.error('❌ خطأ فادح:', error);
  process.exit(1);
});
