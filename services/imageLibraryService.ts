import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ImageLibraryCategory, ImageLibraryItem } from '../types';
import imageCompression from 'browser-image-compression';

// ==========================================
// إدارة الأقسام (Categories)
// ==========================================

export async function getImageCategories(): Promise<ImageLibraryCategory[]> {
  try {
    const categoriesRef = collection(db, 'imageLibraryCategories');
    const q = query(categoriesRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ImageLibraryCategory));
  } catch (error) {
    console.error('Error getting image categories:', error);
    return [];
  }
}

export async function addImageCategory(category: Omit<ImageLibraryCategory, 'id'>): Promise<string> {
  try {
    const categoriesRef = collection(db, 'imageLibraryCategories');
    const docRef = await addDoc(categoriesRef, {
      ...category,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding image category:', error);
    throw new Error('فشل إضافة القسم');
  }
}

// Create category with optional parentId; computes level and next order automatically.
export async function createCategoryWithParent(
  nameAr: string,
  options?: { nameEn?: string; parentId?: string | null }
): Promise<string> {
  try {
    const parentId = options?.parentId ?? null;
    let level = 0;
    if (parentId) {
      const parentSnap = await getDocs(query(collection(db, 'imageLibraryCategories'), where('__name__', '==', parentId)));
      if (parentSnap.docs.length) {
        const parent = parentSnap.docs[0].data() as any;
        if (parent.isImmutable) {
          throw new Error('لا يمكن استخدام أقسام الأزياء كأب');
        }
        level = (parent.level || 0) + 1;
      } else {
        // If parent not found, treat as root
        level = 0;
      }
    }

    // Compute next order within the same parent scope
    let nextOrder = 1;
    const categoriesRef = collection(db, 'imageLibraryCategories');
    const q = parentId ? query(categoriesRef, where('parentId', '==', parentId)) : query(categoriesRef, where('level', '==', 0));
    const siblings = await getDocs(q);
    if (siblings.docs.length) {
      const maxOrder = Math.max(
        ...siblings.docs.map(d => {
          const data: any = d.data();
          return typeof data.order === 'number' ? data.order : 0;
        })
      );
      nextOrder = maxOrder + 1;
    }

    return await addImageCategory({
      name: nameAr,
      nameAr,
      nameEn: options?.nameEn || '',
      parentId,
      level,
      order: nextOrder,
      hasChildren: false,
      // Categories can be marked immutable (e.g., fashion) to disallow edits
      isImmutable: false,
      createdAt: Timestamp.now()
    } as any);
  } catch (error) {
    console.error('Error creating category with parent:', error);
    throw new Error('فشل إنشاء القسم');
  }
}

// Fetch root (level 0) categories to show as possible parents
export async function getRootImageCategories(): Promise<ImageLibraryCategory[]> {
  try {
    const categoriesRef = collection(db, 'imageLibraryCategories');
    const q = query(categoriesRef, where('level', '==', 0), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
  } catch (error) {
    console.error('Error getting root image categories:', error);
    return [];
  }
}

// Helper: reassign a category's parent (or remove it) unless immutable
export async function reassignCategoryParent(
  categoryId: string,
  newParentId: string | null
): Promise<void> {
  try {
    const categoriesRef = collection(db, 'imageLibraryCategories');
    const catSnap = await getDocs(query(categoriesRef, where('__name__', '==', categoryId)));
    if (!catSnap.docs.length) throw new Error('القسم غير موجود');
    const catDoc = catSnap.docs[0];
    const data: any = catDoc.data();
    if (data.isImmutable) throw new Error('لا يمكن تعديل أقسام الأزياء');

    let level = 0;
    if (newParentId) {
      const parentSnap = await getDocs(query(categoriesRef, where('__name__', '==', newParentId)));
      if (!parentSnap.docs.length) throw new Error('الأب المحدد غير موجود');
      const parent = parentSnap.docs[0].data() as any;
      if (parent.isImmutable) throw new Error('لا يمكن استخدام أقسام الأزياء كأب');
      level = (parent.level || 0) + 1;
    }

    // compute next order within target parent scope
    let nextOrder = 1;
    const scopeQuery = newParentId ? query(categoriesRef, where('parentId', '==', newParentId)) : query(categoriesRef, where('level', '==', 0));
    const siblings = await getDocs(scopeQuery);
    if (siblings.docs.length) {
      const maxOrder = Math.max(
        ...siblings.docs
          .filter(d => d.id !== categoryId)
          .map(d => {
            const sd: any = d.data();
            return typeof sd.order === 'number' ? sd.order : 0;
          })
      );
      nextOrder = maxOrder + 1;
    }

    await updateDoc(catDoc.ref, {
      parentId: newParentId ?? null,
      level,
      order: nextOrder,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error reassigning category parent:', error);
    throw error instanceof Error ? error : new Error('فشل إعادة تعيين الأب');
  }
}

// Helper: remove parent (reset to level 0) unless immutable
export async function resetCategoryParent(categoryId: string): Promise<void> {
  return reassignCategoryParent(categoryId, null);
}

export async function updateImageCategory(
  categoryId: string, 
  updates: Partial<ImageLibraryCategory>
): Promise<void> {
  try {
    const categoryRef = doc(db, 'imageLibraryCategories', categoryId);
    await updateDoc(categoryRef, updates);
  } catch (error) {
    console.error('Error updating image category:', error);
    throw new Error('فشل تحديث القسم');
  }
}

export async function deleteImageCategory(categoryId: string): Promise<void> {
  try {
    // حذف جميع الصور في هذا القسم أولاً
    const items = await getImagesByCategoryId(categoryId);
    for (const item of items) {
      await deleteImageLibraryItem(item.id);
    }
    
    // ثم حذف القسم
    const categoryRef = doc(db, 'imageLibraryCategories', categoryId);
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error('Error deleting image category:', error);
    throw new Error('فشل حذف القسم');
  }
}

// ==========================================
// مزامنة الأقسام من تصنيفات المنتجات
// ==========================================

export async function syncCategoriesFromProducts(): Promise<{ created: number; updated: number }> {
  try {
    console.log('🔍 جاري جلب تصنيفات المنتجات من نوع fashion...');
    // 1. جلب تصنيفات المنتجات من نوع "fashion"
    const productCategoriesRef = collection(db, 'productCategories');
    const q = query(productCategoriesRef, where('categoryType', '==', 'fashion'));
    const snapshot = await getDocs(q);
    
    console.log('📦 عدد التصنيفات الموجودة:', snapshot.docs.length);
    
    const fashionCategories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Partial<ImageLibraryCategory>)
    })) as Array<Partial<ImageLibraryCategory> & { id: string }>;

    // ترتيب التصنيفات حسب المستوى والترتيب
    fashionCategories.sort((a: any, b: any) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.order - b.order;
    });

    // 2. جلب الأقسام الحالية في مكتبة الصور
    const existingCategories = await getImageCategories();
    const existingMap = new Map(existingCategories.map(cat => [cat.nameAr || cat.name, cat]));
    
    // 3. بناء خريطة لربط معرفات productCategories بـ imageLibraryCategories
    const categoryIdMap = new Map<string, string>(); // productCategoryId -> imageLibraryCategoryId

    let created = 0;
    let updated = 0;

    // 4. إنشاء/تحديث أقسام مكتبة الصور مع الحفاظ على الهيكل الهرمي
    for (const category of fashionCategories) {
      const categoryName = category.nameAr || '';
      const categoryNameEn = category.nameEn || '';
      
      if (!categoryName) continue;

      const existing = existingMap.get(categoryName);
      
      // تحديد parentId في مكتبة الصور بناءً على parentId في productCategories
      let imageLibraryParentId: string | null = null;
      if (category.parentId) {
        imageLibraryParentId = categoryIdMap.get(category.parentId) || null;
      }
      
      // التحقق من وجود أقسام فرعية
      const hasChildren = fashionCategories.some((c: any) => c.parentId === category.id);

      if (existing) {
        // تحديث القسم الموجود
        await updateImageCategory(existing.id, {
          nameAr: categoryName,
          nameEn: categoryNameEn,
          parentId: imageLibraryParentId,
          level: category.level || 0,
          order: category.order || 0,
          hasChildren
        });
        categoryIdMap.set(category.id, existing.id);
        updated++;
      } else {
        // إنشاء قسم جديد
        const newCategoryId = await addImageCategory({
          name: categoryName,
          nameAr: categoryName,
          nameEn: categoryNameEn,
          parentId: imageLibraryParentId,
          level: category.level || 0,
          order: category.order || 0,
          hasChildren,
          createdAt: Timestamp.now()
        });
        categoryIdMap.set(category.id, newCategoryId);
        created++;
      }
    }

    console.log(`✅ تمت المزامنة: ${created} قسم جديد، ${updated} قسم محدّث`);
    return { created, updated };
  } catch (error) {
    console.error('❌ خطأ في مزامنة الأقسام:', error);
    throw new Error('فشل مزامنة الأقسام');
  }
}

// ==========================================
// إدارة الصور (Images)
// ==========================================

export async function getImagesByCategoryId(categoryId: string): Promise<ImageLibraryItem[]> {
  try {
    console.log('🔍 البحث عن صور القسم:', categoryId);
    const imagesRef = collection(db, 'imageLibraryItems');
    const q = query(
      imagesRef, 
      where('categoryId', '==', categoryId),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    
    const images = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ImageLibraryItem));
    
    console.log('✅ تم العثور على', images.length, 'صورة');
    return images;
  } catch (error) {
    console.error('❌ خطأ في جلب صور القسم:', error);
    return [];
  }
}

export async function getAllImageLibraryItems(): Promise<ImageLibraryItem[]> {
  try {
    const imagesRef = collection(db, 'imageLibraryItems');
    const q = query(imagesRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ImageLibraryItem));
  } catch (error) {
    console.error('Error getting all image library items:', error);
    return [];
  }
}

export async function addImageToLibrary(
  categoryId: string,
  imageFile: File,
  label: string,
  uploadedBy: string
): Promise<string> {
  try {
    console.log('🎯 بدء رفع الصورة إلى Firebase');
    console.log('📁 القسم:', categoryId);
    console.log('📄 الملف:', imageFile.name, 'الحجم:', imageFile.size);
    
    // ضغط الصورة (تعطيل Web Worker لتجنب مشاكل CSP)
    console.log('📦 ضغط الصورة...');
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: false // تعطيل Web Worker لتجنب مشاكل CSP
    };
    const compressedFile = await imageCompression(imageFile, options);
    console.log('✅ تم ضغط الصورة. الحجم الجديد:', compressedFile.size);
    
    // رفع الصورة إلى Firebase Storage
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const storagePath = `imageLibrary/${categoryId}/${uniqueId}_${imageFile.name}`;
    console.log('☁️ رفع إلى Storage في المسار:', storagePath);
    
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, compressedFile);
    console.log('✅ تم رفع الملف إلى Storage');
    
    const imageUrl = await getDownloadURL(storageRef);
    console.log('🔗 رابط الصورة:', imageUrl);
    
    // الحصول على آخر ترتيب
    console.log('🔢 حساب الترتيب...');
    const existingImages = await getImagesByCategoryId(categoryId);
    const maxOrder = existingImages.length > 0 
      ? Math.max(...existingImages.map(img => img.order)) 
      : 0;
    console.log('📊 الترتيب الحالي:', maxOrder, 'الترتيب الجديد:', maxOrder + 1);
    
    // حفظ بيانات الصورة في Firestore
    console.log('💾 حفظ البيانات في Firestore...');
    const imagesRef = collection(db, 'imageLibraryItems');
    const imageData = {
      categoryId,
      imageUrl,
      label,
      order: maxOrder + 1,
      uploadedBy,
      createdAt: Timestamp.now()
    };
    console.log('📝 البيانات:', imageData);
    
    const docRef = await addDoc(imagesRef, imageData);
    console.log('✅ تم حفظ الصورة في Firestore بنجاح! ID:', docRef.id);
    
    return docRef.id;
  } catch (error: any) {
    console.error('❌ خطأ في إضافة الصورة إلى المكتبة:', error);
    console.error('📋 كود الخطأ:', error?.code);
    console.error('📄 رسالة الخطأ:', error?.message);
    console.error('🔍 تفاصيل كاملة:', error);
    
    if (error?.code === 'storage/unauthorized') {
      throw new Error('⚠️ خطأ في الصلاحيات! يرجى التحقق من إعدادات Firebase Storage Rules');
    }
    throw new Error(error?.message || 'فشل إضافة الصورة');
  }
}

export async function updateImageLibraryItem(
  itemId: string,
  updates: Partial<ImageLibraryItem>
): Promise<void> {
  try {
    const itemRef = doc(db, 'imageLibraryItems', itemId);
    await updateDoc(itemRef, updates);
  } catch (error) {
    console.error('Error updating image library item:', error);
    throw new Error('فشل تحديث الصورة');
  }
}

export async function deleteImageLibraryItem(itemId: string): Promise<void> {
  try {
    // الحصول على بيانات الصورة
    const imagesRef = collection(db, 'imageLibraryItems');
    const q = query(imagesRef, where('__name__', '==', itemId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const imageData = snapshot.docs[0].data() as ImageLibraryItem;
      
      // محاولة حذف الصورة من Storage
      try {
        const imageRef = ref(storage, imageData.imageUrl);
        await deleteObject(imageRef);
      } catch (storageError) {
        console.warn('Could not delete image from storage:', storageError);
      }
    }
    
    // حذف من Firestore
    const itemRef = doc(db, 'imageLibraryItems', itemId);
    await deleteDoc(itemRef);
  } catch (error) {
    console.error('Error deleting image library item:', error);
    throw new Error('فشل حذف الصورة');
  }
}

// ==========================================
// دوال مساعدة للخياطين
// ==========================================

export async function getImagesByCategoryName(categoryNameEn: string): Promise<ImageLibraryItem[]> {
  try {
    console.log('🔍 [imageLibraryService] البحث عن قسم بالاسم:', categoryNameEn);
    
    // البحث عن القسم بالاسم الإنجليزي
    const categoriesRef = collection(db, 'imageLibraryCategories');
    const categoryQuery = query(categoriesRef, where('nameEn', '==', categoryNameEn));
    const categorySnapshot = await getDocs(categoryQuery);
    
    console.log('📋 [imageLibraryService] عدد الأقسام المطابقة:', categorySnapshot.size);
    
    // طباعة جميع الأقسام الموجودة للتشخيص
    if (categorySnapshot.empty) {
      console.log('⚠️ [imageLibraryService] لم يتم العثور على قسم بالاسم:', categoryNameEn);
      console.log('📂 [imageLibraryService] جلب جميع الأقسام المتاحة...');
      const allCategoriesSnapshot = await getDocs(categoriesRef);
      console.log('📂 [imageLibraryService] الأقسام المتاحة:');
      allCategoriesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ID: ${doc.id}, nameEn: ${data.nameEn}, nameAr: ${data.nameAr}`);
      });
      return [];
    }
    
    const categoryId = categorySnapshot.docs[0].id;
    const categoryData = categorySnapshot.docs[0].data();
    console.log('✅ [imageLibraryService] تم العثور على القسم:', {
      id: categoryId,
      nameEn: categoryData.nameEn,
      nameAr: categoryData.nameAr
    });
    
    return await getImagesByCategoryId(categoryId);
  } catch (error) {
    console.error('❌ [imageLibraryService] خطأ في البحث عن صور القسم:', error);
    return [];
  }
}
