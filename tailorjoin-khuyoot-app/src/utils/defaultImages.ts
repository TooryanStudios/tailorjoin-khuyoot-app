// مكتبة الصور - تستخدم Firebase بدلاً من الصور الافتراضية

import { ImageLibraryItem } from '../types';
import { getImagesByCategoryName } from '../services/imageLibraryService';

export interface DefaultImageOption {
  id: string;
  url: string;
  label: string;
}

// دالة للحصول على الصور من Firebase حسب الفئة
export async function getDefaultImagesForCategory(category: string): Promise<DefaultImageOption[]> {
  try {
    console.log('🔍 [defaultImages.ts] طلب صور للقسم:', category);
    const images = await getImagesByCategoryName(category);
    console.log('📸 [defaultImages.ts] عدد الصور المستلمة:', images.length);
    
    if (images.length > 0) {
      console.log('🖼️ [defaultImages.ts] أول صورة:', images[0]);
    }
    
    return images.map(img => ({
      id: img.id,
      url: img.imageUrl,
      label: img.label
    }));
  } catch (error) {
    console.error('❌ [defaultImages.ts] خطأ في الحصول على الصور:', error);
    return [];
  }
}

// دالة للحصول على أول صورة من Firebase لفئة معينة
export async function getFirstDefaultImage(category: string): Promise<string | null> {
  try {
    const images = await getDefaultImagesForCategory(category);
    return images.length > 0 ? images[0].url : null;
  } catch (error) {
    console.error('Error getting first default image:', error);
    return null;
  }
}
