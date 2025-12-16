import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function setAdminRole() {
  try {
    // البحث عن المستخدم بالبريد الإلكتروني admin@test.com
    // لكن للأسف Firestore لا يدعم البحث بالبريد مباشرة
    // لذلك سنطلب من المستخدم إدخال الـ UID
    
    console.log('🔍 للحصول على UID المستخدم:');
    console.log('1. سجل دخول كـ admin@test.com في التطبيق');
    console.log('2. افتح Console في المتصفح');
    console.log('3. اكتب: firebase.auth().currentUser.uid');
    console.log('');
    
    // لنحاول البحث في users collection
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', 'admin@test.com'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ لم يتم العثور على مستخدم بالبريد admin@test.com في Firestore');
      console.log('💡 قد يكون المستخدم موجود في Authentication لكن ليس في Firestore');
      console.log('');
      console.log('الحل:');
      console.log('1. سجل خروج من التطبيق');
      console.log('2. سجل دخول مرة أخرى بـ admin@test.com');
      console.log('3. سيتم إنشاء السجل تلقائياً في Firestore');
      console.log('4. شغل هذا السكريبت مرة أخرى');
      return;
    }
    
    querySnapshot.forEach(async (docSnap) => {
      const userId = docSnap.id;
      const userData = docSnap.data();
      
      console.log('✅ تم العثور على المستخدم:', userData.name);
      console.log('📧 البريد:', userData.email);
      console.log('🆔 UID:', userId);
      console.log('👤 الدور الحالي:', userData.role);
      
      if (userData.role === 'admin') {
        console.log('✨ المستخدم لديه دور admin بالفعل!');
      } else {
        console.log('🔧 جاري تحديث الدور إلى admin...');
        
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { role: 'admin' }, { merge: true });
        
        console.log('✅ تم تحديث الدور بنجاح!');
        console.log('🔄 سجل خروج ودخول مرة أخرى لتطبيق التغييرات');
      }
    });
    
  } catch (error) {
    console.error('❌ حدث خطأ:', error);
  }
}

setAdminRole().then(() => {
  console.log('');
  console.log('✅ اكتمل السكريبت');
  process.exit(0);
});
