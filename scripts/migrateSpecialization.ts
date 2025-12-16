/**
 * Script to migrate specialization from Arabic to English in Firestore
 * Run with: npx tsx scripts/migrateSpecialization.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Firebase config (use your actual config)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Mapping from Arabic to English
const SPECIALIZATION_MIGRATION: Record<string, string> = {
  'رجالي': 'males',
  'نسائي': 'females',
  'خياطة رجالية': 'males',
  'خياطة نسائية': 'females',
  'دشاديش': 'males',
  'دشاديش خليجية': 'males',
  'بدلات رسمية': 'males',
  'عبايات': 'females',
  'عبايات وفساتين': 'females',
  'فساتين': 'females',
  'أطفال': 'kids',
  'خياطة أطفال': 'kids',
  'تصليح وتعديل': 'general',
  'أزياء تقليدية': 'general',
  'خياطة عامة': 'general',
};

async function migrateSpecializations() {
  try {
    console.log('🔄 بدء ترحيل التخصصات من العربية إلى الإنجليزية...\n');

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const currentSpecialization = userData.specialization;

      // Skip if no specialization or already in English format
      if (!currentSpecialization) {
        skipped++;
        continue;
      }

      // Check if already in English (males, females, kids, general)
      if (['males', 'females', 'kids', 'general'].includes(currentSpecialization)) {
        console.log(`⏭️  تخطي ${userData.name || userId} - التخصص بالإنجليزية بالفعل: ${currentSpecialization}`);
        skipped++;
        continue;
      }

      // Find English equivalent
      const englishSpecialization = SPECIALIZATION_MIGRATION[currentSpecialization];

      if (!englishSpecialization) {
        console.log(`⚠️  لم يتم العثور على ترجمة لـ "${currentSpecialization}" للمستخدم ${userData.name || userId}`);
        console.log(`   سيتم تعيينه إلى "general" افتراضيًا`);
        
        try {
          await updateDoc(doc(db, 'users', userId), {
            specialization: 'general'
          });
          updated++;
          console.log(`✅ تم تحديث ${userData.name || userId}: "${currentSpecialization}" → "general"\n`);
        } catch (error) {
          console.error(`❌ خطأ في تحديث ${userData.name || userId}:`, error);
          errors++;
        }
        continue;
      }

      // Update to English
      try {
        await updateDoc(doc(db, 'users', userId), {
          specialization: englishSpecialization
        });
        updated++;
        console.log(`✅ تم تحديث ${userData.name || userId}: "${currentSpecialization}" → "${englishSpecialization}"`);
      } catch (error) {
        console.error(`❌ خطأ في تحديث ${userData.name || userId}:`, error);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 ملخص الترحيل:');
    console.log(`   ✅ تم التحديث: ${updated}`);
    console.log(`   ⏭️  تم التخطي: ${skipped}`);
    console.log(`   ❌ أخطاء: ${errors}`);
    console.log(`   📝 إجمالي السجلات: ${usersSnapshot.docs.length}`);
    console.log('='.repeat(60));

    if (updated > 0) {
      console.log('\n🎉 تم ترحيل التخصصات بنجاح!');
      console.log('💡 الآن التخصصات مخزنة بالإنجليزية وتعرض بالعربية في الواجهة');
    }

  } catch (error) {
    console.error('❌ خطأ في عملية الترحيل:', error);
    process.exit(1);
  }
}

// Run migration
migrateSpecializations();
