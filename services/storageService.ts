import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import imageCompression from 'browser-image-compression';

// تهيئة Firebase Storage
let storage: any = null;

try {
  storage = getStorage();
  console.log('✅ Firebase Storage initialized');
} catch (error) {
  console.warn('⚠️ Firebase Storage not initialized:', error);
}

/**
 * خيارات ضغط الصور - مضغوطة بشكل قوي جداً لسرعة فائقة
 */
const compressionOptions = {
  // نسخة واحدة فقط - متوسطة تناسب جميع الاستخدامات
  standard: {
    maxSizeMB: 0.1, // 100KB فقط!
    maxWidthOrHeight: 800, // دقة معقولة
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: 0.75, // توازن جيد بين الحجم والجودة
    alwaysKeepResolution: false
  }
};

/**
 * ضغط الصورة بشكل قوي - نسخة واحدة فقط
 */
async function compressImage(file: File): Promise<File> {
  try {
    const startTime = performance.now();
    
    const compressedFile = await imageCompression(file, compressionOptions.standard);
    
    const endTime = performance.now();
    const compressionTime = ((endTime - startTime) / 1000).toFixed(2);
    const originalSizeKB = file.size / 1024;
    const compressedSizeKB = compressedFile.size / 1024;
    const reductionPercent = ((file.size - compressedFile.size) / file.size) * 100;
    
    console.log(`✅ ضغط سريع:`, {
      original: `${originalSizeKB.toFixed(2)} KB`,
      compressed: `${compressedSizeKB.toFixed(2)} KB`,
      reduction: `${reductionPercent.toFixed(1)}%`,
      time: `${compressionTime}s`,
      format: 'WebP'
    });
    
    return compressedFile;
  } catch (error) {
    console.error(`❌ خطأ في الضغط:`, error);
    // ضغط بديل سريع
    try {
      const fallbackFile = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 600,
        useWebWorker: true
      });
      return fallbackFile;
    } catch {
      return file;
    }
  }
}

/**
 * رفع صورة واحدة إلى Firebase Storage - نسخة واحدة فقط
 */
async function uploadSingleImage(file: File, path: string): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  // ضغط الصورة
  const compressedFile = await compressImage(file);
  
  // إنشاء المرجع
  const storageRef = ref(storage, path);
  
  // رفع الملف
  await uploadBytes(storageRef, compressedFile, {
    contentType: 'image/webp',
    cacheControl: 'public, max-age=31536000' // Cache لمدة سنة
  });
  
  // الحصول على رابط التحميل
  const downloadURL = await getDownloadURL(storageRef);
  
  return downloadURL;
}

/**
 * رفع صورة منتج - نسخة واحدة فقط للسرعة القصوى
 */
export async function uploadProductImage(
  file: File,
  productId: string,
  tailorId: string
): Promise<{ thumbnail: string; medium: string; full: string }> {
  console.log('🚀 رفع سريع:', {
    name: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
  });
  
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const path = `products/${tailorId}/${timestamp}_${randomId}.webp`;
  
  const startTime = performance.now();
  
  // رفع نسخة واحدة فقط
  const imageUrl = await uploadSingleImage(file, path);
  
  const endTime = performance.now();
  const uploadTime = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`✅ رفع ناجح في ${uploadTime}s`);
  
  // إرجاع نفس الرابط للثلاث أحجام (توافق مع الكود القديم)
  return { 
    thumbnail: imageUrl, 
    medium: imageUrl, 
    full: imageUrl 
  };
}

/**
 * رفع صورة أفاتار المستخدم
 */
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<string> {
  const path = `avatars/${userId}.webp`;
  const url = await uploadSingleImage(file, path);
  
  console.log('✅ Avatar uploaded successfully');
  
  return url;
}

/**
 * رفع صورة غلاف الخياط
 */
export async function uploadCoverImage(
  file: File,
  tailorId: string
): Promise<string> {
  const path = `covers/${tailorId}.webp`;
  const url = await uploadSingleImage(file, path);
  
  console.log('✅ Cover image uploaded successfully');
  
  return url;
}

/**
 * رفع صورة إلى معرض الأعمال
 */
export async function uploadPortfolioImage(
  file: File,
  tailorId: string,
  imageId: string
): Promise<string> {
  const path = `portfolio/${tailorId}/${imageId}.webp`;
  const url = await uploadSingleImage(file, path);
  
  console.log('✅ Portfolio image uploaded successfully');
  
  return url;
}

/**
 * رفع صورة للإعدادات (بنرات، SEO، إلخ)
 */
export async function uploadSettingsImage(
  file: File,
  storagePath: string
): Promise<{ thumbnail: string; medium: string; full: string }> {
  console.log('🚀 رفع صورة إعدادات:', {
    name: file.name,
    path: storagePath,
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
  });
  
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const path = `settings/${storagePath}/${timestamp}_${randomId}.webp`;
  
  const startTime = performance.now();
  
  // رفع نسخة واحدة فقط
  const imageUrl = await uploadSingleImage(file, path);
  
  const endTime = performance.now();
  const uploadTime = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`✅ رفع صورة الإعدادات ناجح في ${uploadTime}s`);
  
  // إرجاع نفس الرابط للثلاث أحجام (توافق مع الكود)
  return { 
    thumbnail: imageUrl, 
    medium: imageUrl, 
    full: imageUrl 
  };
}

/**
 * حذف صورة من Firebase Storage
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }
  
  try {
    // استخراج المسار من الرابط
    const path = extractPathFromUrl(imageUrl);
    if (!path) {
      console.warn('Could not extract path from URL:', imageUrl);
      return;
    }
    
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    
    console.log('✅ Image deleted successfully');
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.warn('Image not found, might be already deleted');
    } else {
      throw error;
    }
  }
}

/**
 * حذف جميع صور المنتج (thumbnail, medium, full)
 */
export async function deleteProductImages(
  productId: string,
  tailorId: string
): Promise<void> {
  const basePath = `products/${tailorId}/${productId}`;
  
  await Promise.all([
    deleteImage(`${basePath}/thumbnail.webp`).catch(console.warn),
    deleteImage(`${basePath}/medium.webp`).catch(console.warn),
    deleteImage(`${basePath}/full.webp`).catch(console.warn)
  ]);
  
  console.log('✅ Product images deleted successfully');
}

/**
 * استخراج المسار من رابط Firebase Storage
 */
function extractPathFromUrl(url: string): string | null {
  try {
    // Firebase Storage URLs format:
    // https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?...
    const urlObj = new URL(url);
    const pathParam = urlObj.searchParams.get('o') || 
                     urlObj.pathname.split('/o/')[1]?.split('?')[0];
    
    if (pathParam) {
      return decodeURIComponent(pathParam);
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * معاينة الصورة قبل الرفع (للمطورين)
 */
export function previewImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * التحقق من نوع الملف
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'نوع الملف غير مدعوم. يرجى اختيار صورة (JPG, PNG, WebP)'
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'حجم الصورة كبير جداً. الحد الأقصى 10MB'
    };
  }
  
  return { valid: true };
}

export const storageService = {
  uploadProductImage,
  uploadAvatar,
  uploadCoverImage,
  uploadPortfolioImage,
  uploadSettingsImage,
  deleteImage,
  deleteProductImages,
  previewImage,
  validateImageFile
};
