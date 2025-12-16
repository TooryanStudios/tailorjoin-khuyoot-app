/**
 * سكريبت لحذف المنتجات النموذجية القديمة من Firebase
 * هذه المنتجات لها tailorId نموذجي (t1, t2, etc)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Firebase config - نسخها من firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyBAZnpSeoFEDJ9aHiyCaxN7H7-LBg11lz0",
  authDomain: "khuyoot-app01.firebaseapp.com",
  projectId: "khuyoot-app01",
  storageBucket: "khuyoot-app01.firebasestorage.app",
  messagingSenderId: "819942872255",
  appId: "1:819942872255:web:bfa6ea6e1f8aee949e4a1e",
  measurementId: "G-JY4T6QRPNT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// قائمة بالـ tailorIds النموذجية التي نريد حذف منتجاتها
const MOCK_TAILOR_IDS = ['t1', 't2', 't3', 't4', 't5'];

async function deleteOldMockProducts() {
  try {
    console.log('🗑️ بدء عملية حذف المنتجات النموذجية القديمة...\n');
    
    let totalDeleted = 0;
    
    // حذف المنتجات لكل tailorId نموذجي
    for (const tailorId of MOCK_TAILOR_IDS) {
      console.log(`\n📦 البحث عن منتجات للخياط: ${tailorId}`);
      
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('tailorId', '==', tailorId));
      const snapshot = await getDocs(q);
      
      console.log(`   وجدت ${snapshot.size} منتج(ات)`);
      
      if (!snapshot.empty) {
        for (const docSnap of snapshot.docs) {
          const productData = docSnap.data();
          console.log(`   🗑️ حذف: ${productData.name} (ID: ${docSnap.id})`);
          await deleteDoc(doc(db, 'products', docSnap.id));
          totalDeleted++;
        }
      }
    }
    
    console.log('\n\n✅ اكتمل الحذف!');
    console.log(`📊 إجمالي المنتجات المحذوفة: ${totalDeleted}`);
    
  } catch (error) {
    console.error('❌ خطأ في حذف المنتجات:', error);
  }
}

// تشغيل السكريبت
deleteOldMockProducts()
  .then(() => {
    console.log('\n✨ تم الانتهاء من السكريبت');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ فشل السكريبت:', error);
    process.exit(1);
  });
