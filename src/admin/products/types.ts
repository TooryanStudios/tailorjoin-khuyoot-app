/**
 * أنواع البيانات لنظام إدارة المنتجات والتصنيفات
 */

export type CategoryType = 'fashion' | 'other';

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  parentId: string | null; // null للأقسام الرئيسية
  level: number; // 0 = رئيسي، 1 = فرعي، 2 = فرعي ثانوي
  categoryType: CategoryType; // fashion للملابس (تحتاج قياسات)، other للباقي
  gender?: string | null; // 'male', 'female', or null for both
  image: string;
  icon?: string; // أيقونة اختيارية
  order: number; // ترتيب العرض
  isActive: boolean;
  descriptionAr?: string;
  descriptionEn?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductTemplate {
  id: string;
  categoryId: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  defaultImage: string;
  images: string[];
  descriptionAr?: string;
  descriptionEn?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFormData {
  nameAr: string;
  nameEn: string;
  slug?: string; // اختياري، يتم توليده تلقائياً
  parentId?: string | null;
  categoryType: CategoryType;
  gender?: string | null; // 'male', 'female', or null for both
  image: string;
  icon?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  order: number;
  isActive: boolean;
}

export interface ProductTemplateFormData {
  categoryId: string;
  nameAr: string;
  nameEn: string;
  slug?: string; // اختياري، يتم توليده تلقائياً
  defaultImage: string;
  images: string[];
  descriptionAr?: string;
  descriptionEn?: string;
  order: number;
  isActive: boolean;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  productsCount?: number;
}
