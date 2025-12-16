import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// هذا السكريبت لإضافة إعلانات تجريبية لاختبار النظام

const firebaseConfig = {
  // أضف إعدادات Firebase هنا
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sampleAds = [
  {
    shopId: 'tailor_001',
    shopName: 'خياطة الفخامة',
    shopType: 'tailor',
    image: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&h=400&fit=crop',
    title: 'تفصيل دشاديش كويتية فاخرة',
    description: 'أجود الأقمشة وأدق التفاصيل في تفصيل الدشاديش الكويتية',
    buttonText: 'اطلب الآن',
    displayDuration: 5,
    activePeriodDays: 30,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    priority: 'high',
    targetAudience: ['رجال', 'كويتيون'],
    targetRegion: 'الكويت',
    views: 0,
    clicks: 0,
    budget: 500,
    spent: 0,
    createdAt: new Date().toISOString(),
  },
  {
    shopId: 'boutique_001',
    shopName: 'بوتيك الأناقة',
    shopType: 'boutique',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=400&fit=crop',
    title: 'أحدث صيحات الموضة',
    description: 'تشكيلة واسعة من الأزياء العصرية لكل المناسبات',
    buttonText: 'تسوق الآن',
    displayDuration: 7,
    activePeriodDays: 14,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    priority: 'medium',
    targetAudience: ['نساء', 'شباب'],
    targetRegion: 'الكويت',
    views: 0,
    clicks: 0,
    budget: 300,
    spent: 0,
    createdAt: new Date().toISOString(),
  },
  {
    shopId: 'fabric_001',
    shopName: 'محل الأقمشة الإيطالية',
    shopType: 'fabric_store',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea9c04a4?w=800&h=400&fit=crop',
    title: 'أقمشة إيطالية فاخرة',
    description: 'أجود أنواع الأقمشة الإيطالية المستوردة بأسعار مميزة',
    buttonText: 'اكتشف المزيد',
    displayDuration: 6,
    activePeriodDays: 21,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    priority: 'high',
    targetAudience: ['الكل'],
    targetRegion: 'الكويت',
    views: 0,
    clicks: 0,
    budget: 400,
    spent: 0,
    createdAt: new Date().toISOString(),
  },
];

async function addSampleAds() {
  try {
    console.log('🚀 بدء إضافة الإعلانات التجريبية...');
    
    for (const ad of sampleAds) {
      const docRef = await addDoc(collection(db, 'advertisements'), ad);
      console.log(`✅ تم إضافة الإعلان: ${ad.title} - ID: ${docRef.id}`);
    }
    
    console.log('🎉 تم إضافة جميع الإعلانات بنجاح!');
  } catch (error) {
    console.error('❌ خطأ في إضافة الإعلانات:', error);
  }
}

// تشغيل السكريبت
// addSampleAds();

export { addSampleAds, sampleAds };
