import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  increment,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface Advertisement {
  id: string;
  shopId: string;
  shopName: string;
  shopType: 'tailor' | 'boutique' | 'fabric_store' | 'other';
  adLocation: 'homepage_main' | 'homepage_sidebar' | 'search_results';
  image: string;
  title: string;
  description: string;
  buttonText: string;
  displayDuration: number; // بالثواني
  activePeriodDays: number; // عدد الأيام
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'scheduled' | 'expired';
  priority: 'high' | 'medium' | 'low';
  isPinned: boolean; // إعلان مثبت
  targetAudience: string[];
  targetRegion: string;
  views: number;
  clicks: number;
  budget: number;
  spent: number;
  createdAt: string;
}

// الحصول على جميع الإعلانات
export const getAllAdvertisements = async (): Promise<Advertisement[]> => {
  try {
    const adsCollection = collection(db, 'advertisements');
    const adsSnapshot = await getDocs(adsCollection);
    return adsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Advertisement[];
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    return [];
  }
};

// الحصول على إعلان محدد
export const getAdvertisement = async (id: string): Promise<Advertisement | null> => {
  try {
    const adDoc = await getDoc(doc(db, 'advertisements', id));
    if (adDoc.exists()) {
      return { id: adDoc.id, ...adDoc.data() } as Advertisement;
    }
    return null;
  } catch (error) {
    console.error('Error fetching advertisement:', error);
    return null;
  }
};

// الحصول على الإعلانات النشطة فقط
export const getActiveAdvertisements = async (): Promise<Advertisement[]> => {
  try {
    const adsCollection = collection(db, 'advertisements');
    const adsSnapshot = await getDocs(adsCollection);
    const now = new Date().toISOString();
    
    // Filter in memory to avoid index requirement
    const ads = adsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Advertisement[];
    
    const activeAds = ads.filter(ad => 
      ad.status === 'active' && 
      ad.endDate > now
    );
    
    // ترتيب الإعلانات: المثبتة أولاً، ثم حسب الأولوية
    return activeAds.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  } catch (error) {
    console.error('Error fetching active advertisements:', error);
    return [];
  }
};

// الحصول على إعلانات حسب المنطقة
export const getAdvertisementsByRegion = async (region: string): Promise<Advertisement[]> => {
  try {
    const adsCollection = collection(db, 'advertisements');
    const regionQuery = query(
      adsCollection,
      where('targetRegion', '==', region),
      where('status', '==', 'active'),
      orderBy('priority', 'desc')
    );
    const adsSnapshot = await getDocs(regionQuery);
    return adsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Advertisement[];
  } catch (error) {
    console.error('Error fetching advertisements by region:', error);
    return [];
  }
};

// إنشاء إعلان جديد
export const createAdvertisement = async (adData: Omit<Advertisement, 'id' | 'views' | 'clicks' | 'spent' | 'createdAt'>): Promise<string> => {
  try {
    const newAd = {
      ...adData,
      views: 0,
      clicks: 0,
      spent: 0,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'advertisements'), newAd);
    return docRef.id;
  } catch (error) {
    console.error('Error creating advertisement:', error);
    throw error;
  }
};

// تحديث إعلان
export const updateAdvertisement = async (id: string, updates: Partial<Advertisement>): Promise<void> => {
  try {
    const adRef = doc(db, 'advertisements', id);
    await updateDoc(adRef, updates);
  } catch (error) {
    console.error('Error updating advertisement:', error);
    throw error;
  }
};

// حذف إعلان
export const deleteAdvertisement = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'advertisements', id));
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    throw error;
  }
};

// زيادة عدد المشاهدات
export const incrementAdViews = async (id: string): Promise<void> => {
  try {
    const adRef = doc(db, 'advertisements', id);
    await updateDoc(adRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing ad views:', error);
  }
};

// زيادة عدد النقرات
export const incrementAdClicks = async (id: string): Promise<void> => {
  try {
    const adRef = doc(db, 'advertisements', id);
    await updateDoc(adRef, {
      clicks: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing ad clicks:', error);
  }
};

// تحديث حالة الإعلانات المنتهية تلقائياً
export const updateExpiredAds = async (): Promise<void> => {
  try {
    const adsCollection = collection(db, 'advertisements');
    const expiredQuery = query(
      adsCollection,
      where('status', '==', 'active'),
      where('endDate', '<', new Date().toISOString())
    );
    const adsSnapshot = await getDocs(expiredQuery);
    
    const updatePromises = adsSnapshot.docs.map(adDoc => 
      updateDoc(doc(db, 'advertisements', adDoc.id), { status: 'expired' })
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error updating expired ads:', error);
  }
};

// الحصول على إحصائيات الإعلانات
export const getAdvertisementsStats = async () => {
  try {
    const ads = await getAllAdvertisements();
    return {
      total: ads.length,
      active: ads.filter(ad => ad.status === 'active').length,
      paused: ads.filter(ad => ad.status === 'paused').length,
      expired: ads.filter(ad => ad.status === 'expired').length,
      totalViews: ads.reduce((sum, ad) => sum + ad.views, 0),
      totalClicks: ads.reduce((sum, ad) => sum + ad.clicks, 0),
      totalBudget: ads.reduce((sum, ad) => sum + ad.budget, 0),
      totalSpent: ads.reduce((sum, ad) => sum + ad.spent, 0),
    };
  } catch (error) {
    console.error('Error fetching ads stats:', error);
    return {
      total: 0,
      active: 0,
      paused: 0,
      expired: 0,
      totalViews: 0,
      totalClicks: 0,
      totalBudget: 0,
      totalSpent: 0,
    };
  }
};

// الحصول على أفضل الإعلانات أداءً
export const getTopPerformingAds = async (limitCount: number = 5): Promise<Advertisement[]> => {
  try {
    const ads = await getAllAdvertisements();
    return ads
      .sort((a, b) => {
        const aCTR = a.views > 0 ? (a.clicks / a.views) : 0;
        const bCTR = b.views > 0 ? (b.clicks / b.views) : 0;
        return bCTR - aCTR;
      })
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching top performing ads:', error);
    return [];
  }
};
