/**
 * سكريبت لحذف تصنيف XXXXXXXX الخاطئ
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

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

async function deleteInvalidCategory() {
  try {
    console.log('🗑️  بحث عن تصنيف XXXXXXXX...\n');
    
    const categoriesRef = collection(db, 'productCategories');
    const snapshot = await getDocs(categoriesRef);
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      if (data.nameAr === 'XXXXXXXX' || data.nameEn === 'XXXXXXXXXX') {
        console.log(`⚠️  وجدت التصنيف الخاطئ:`);
        console.log(`   ID: ${docSnap.id}`);
        console.log(`   Name: ${data.nameAr} (${data.nameEn})`);
        console.log(`   Level: ${data.level}`);
        console.log(`   ParentID: ${data.parentId || 'لا يوجد'}`);
        
        const docRef = doc(db, 'productCategories', docSnap.id);
        await deleteDoc(docRef);
        
        console.log(`\n✅ تم حذف التصنيف بنجاح`);
        return;
      }
    }
    
    console.log('ℹ️  لم يتم العثور على تصنيف XXXXXXXX');
    
  } catch (error) {
    console.error('❌ خطأ في حذف التصنيف:', error);
    throw error;
  }
}

deleteInvalidCategory().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
