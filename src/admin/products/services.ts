import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { Category, ProductTemplate, CategoryTreeNode } from './types';

const CATEGORIES_COLLECTION = 'productCategories';
const TEMPLATES_COLLECTION = 'productTemplates';

// ==================== Categories ====================

/**
 * جلب كل التصنيفات
 */
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const snapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Category));
    
    // ترتيب يدوي بدلاً من Firestore query لتجنب الحاجة للفهرس
    return categories.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.order - b.order;
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * جلب تصنيف واحد
 */
export const getCategoryById = async (id: string): Promise<Category | null> => {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Category;
    }
    return null;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
};

/**
 * جلب التصنيفات الفرعية لتصنيف معين
 */
export const getSubCategories = async (parentId: string): Promise<Category[]> => {
  try {
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      where('parentId', '==', parentId)
    );
    const snapshot = await getDocs(q);
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Category));
    
    // ترتيب يدوي لتجنب الحاجة للفهرس المركب
    return categories.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    throw error;
  }
};

/**
 * بناء شجرة التصنيفات الهرمية
 */
export const buildCategoryTree = async (): Promise<CategoryTreeNode[]> => {
  try {
    const allCategories = await getAllCategories();
    
    const categoryMap = new Map<string, CategoryTreeNode>();
    allCategories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    const tree: CategoryTreeNode[] = [];
    
    categoryMap.forEach(node => {
      if (node.parentId === null) {
        tree.push(node);
      } else {
        const parent = categoryMap.get(node.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    return tree;
  } catch (error) {
    console.error('Error building category tree:', error);
    throw error;
  }
};

/**
 * إضافة تصنيف جديد
 */
export const createCategory = async (formData: {
  nameAr: string;
  nameEn: string;
  categoryType: string;
  slug?: string;
  parentId?: string | null;
  image: string;
  icon?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  order: number;
  isActive: boolean;
}): Promise<string> => {
  try {
    // حساب المستوى
    let level = 0;
    if (formData.parentId) {
      const parent = await getCategoryById(formData.parentId);
      if (parent) {
        level = parent.level + 1;
      }
    }

    // توليد slug إذا لم يكن موجود
    const slug = formData.slug || generateSlug(formData.nameEn);

    const now = Timestamp.now().toDate().toISOString();
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
      nameAr: formData.nameAr,
      nameEn: formData.nameEn,
      slug,
      parentId: formData.parentId || null,
      level,
      categoryType: formData.categoryType,
      image: formData.image,
      icon: formData.icon,
      descriptionAr: formData.descriptionAr,
      descriptionEn: formData.descriptionEn,
      order: formData.order,
      isActive: formData.isActive,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

/**
 * تحديث تصنيف
 */
export const updateCategory = async (id: string, data: Partial<Category>): Promise<void> => {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now().toDate().toISOString()
    });
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

/**
 * حذف تصنيف
 */
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    // التحقق من عدم وجود تصنيفات فرعية
    const subCategories = await getSubCategories(id);
    if (subCategories.length > 0) {
      throw new Error(`لا يمكن حذف التصنيف لأنه يحتوي على ${subCategories.length} تصنيف فرعي. يجب حذف التصنيفات الفرعية أولاً.`);
    }

    // التحقق من عدم وجود منتجات
    const products = await getProductsByCategory(id);
    if (products.length > 0) {
      throw new Error(`لا يمكن حذف التصنيف لأنه يحتوي على ${products.length} منتج. يجب حذف المنتجات أولاً.`);
    }

    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// ==================== Product Templates ====================

/**
 * جلب كل قوالب المنتجات
 */
export const getAllProductTemplates = async (): Promise<ProductTemplate[]> => {
  try {
    const snapshot = await getDocs(collection(db, TEMPLATES_COLLECTION));
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ProductTemplate));
    
    // ترتيب يدوي لتجنب الحاجة للفهرس
    return products.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error fetching product templates:', error);
    throw error;
  }
};

/**
 * جلب قوالب المنتجات حسب التصنيف
 */
export const getProductsByCategory = async (categoryId: string): Promise<ProductTemplate[]> => {
  try {
    const q = query(
      collection(db, TEMPLATES_COLLECTION),
      where('categoryId', '==', categoryId)
    );
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ProductTemplate));
    
    // ترتيب يدوي لتجنب الحاجة للفهرس المركب
    return products.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
};

/**
 * جلب قالب منتج واحد
 */
export const getProductTemplateById = async (id: string): Promise<ProductTemplate | null> => {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ProductTemplate;
    }
    return null;
  } catch (error) {
    console.error('Error fetching product template:', error);
    throw error;
  }
};

/**
 * إضافة قالب منتج جديد
 */
export const createProductTemplate = async (formData: {
  categoryId: string;
  nameAr: string;
  nameEn: string;
  slug?: string;
  defaultImage: string;
  images: string[];
  descriptionAr?: string;
  descriptionEn?: string;
  order: number;
  isActive: boolean;
}): Promise<string> => {
  try {
    // توليد slug إذا لم يكن موجود
    const slug = formData.slug || generateSlug(formData.nameEn);

    const now = Timestamp.now().toDate().toISOString();
    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
      categoryId: formData.categoryId,
      nameAr: formData.nameAr,
      nameEn: formData.nameEn,
      slug,
      defaultImage: formData.defaultImage,
      images: formData.images,
      descriptionAr: formData.descriptionAr,
      descriptionEn: formData.descriptionEn,
      order: formData.order,
      isActive: formData.isActive,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating product template:', error);
    throw error;
  }
};

/**
 * تحديث قالب منتج
 */
export const updateProductTemplate = async (id: string, data: Partial<ProductTemplate>): Promise<void> => {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now().toDate().toISOString()
    });
  } catch (error) {
    console.error('Error updating product template:', error);
    throw error;
  }
};

/**
 * حذف قالب منتج
 */
export const deleteProductTemplate = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting product template:', error);
    throw error;
  }
};

/**
 * جلب تصنيفات الأزياء فقط (للقياسات)
 */
export const getFashionCategories = async (): Promise<Category[]> => {
  try {
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      where('categoryType', '==', 'fashion')
    );
    const snapshot = await getDocs(q);
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Category));
    
    // ترتيب يدوي
    return categories.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.order - b.order;
    });
  } catch (error) {
    console.error('Error fetching fashion categories:', error);
    throw error;
  }
};

/**
 * توليد slug من النص العربي
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]+/g, '');
};
