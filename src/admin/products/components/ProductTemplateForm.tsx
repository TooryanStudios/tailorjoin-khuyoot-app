import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Category, ProductTemplateFormData } from '../types';
import { getAllCategories, generateSlug } from '../services';

interface ProductTemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProductTemplateFormData) => Promise<void>;
  initialData?: ProductTemplateFormData;
  documentId?: string;
  title: string;
}

export const ProductTemplateForm: React.FC<ProductTemplateFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  documentId,
  title
}) => {
  const [formData, setFormData] = useState<ProductTemplateFormData>({
    categoryId: '',
    nameAr: '',
    nameEn: '',
    slug: '',
    defaultImage: '',
    images: [],
    descriptionAr: '',
    descriptionEn: '',
    order: 0,
    isActive: true
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      // تحميل بيانات التعديل
      if (initialData) {
        setFormData({
          categoryId: initialData.categoryId || '',
          nameAr: initialData.nameAr || '',
          nameEn: initialData.nameEn || '',
          slug: initialData.slug || '',
          defaultImage: initialData.defaultImage || '',
          images: initialData.images || [],
          descriptionAr: initialData.descriptionAr || '',
          descriptionEn: initialData.descriptionEn || '',
          order: initialData.order || 0,
          isActive: initialData.isActive ?? true
        });
        setImagePreview(initialData.defaultImage || '');
        setAdditionalPreviews(initialData.images || []);
      } else {
        // إعادة تعيين النموذج للإضافة الجديدة
        setFormData({
          categoryId: '',
          nameAr: '',
          nameEn: '',
          slug: '',
          defaultImage: '',
          images: [],
          descriptionAr: '',
          descriptionEn: '',
          order: 0,
          isActive: true
        });
        setImagePreview('');
        setAdditionalPreviews([]);
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (formData.nameEn) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(formData.nameEn)
      }));
    }
  }, [formData.nameEn]);

  const loadCategories = async () => {
    try {
      const allCategories = await getAllCategories();
      setCategories(allCategories);
    } catch (error) {
      console.error('خطأ في تحميل التصنيفات:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isDefault: boolean = true) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 200;
        
        let width = img.width;
        let height = img.height;
        
        // حساب الأبعاد الجديدة مع الحفاظ على نسبة العرض إلى الارتفاع
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.9);
        
        if (isDefault) {
          setImagePreview(resizedBase64);
          setFormData(prev => ({ ...prev, defaultImage: resizedBase64 }));
        } else {
          setAdditionalPreviews(prev => [...prev, resizedBase64]);
          setFormData(prev => ({
            ...prev,
            images: [...(prev.images || []), resizedBase64]
          }));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalPreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.nameAr || !formData.nameEn) {
      alert('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
      // Reset form
      setFormData({
        categoryId: '',
        nameAr: '',
        nameEn: '',
        slug: '',
        defaultImage: '',
        images: [],
        descriptionAr: '',
        descriptionEn: '',
        order: 0,
        isActive: true
      });
      setImagePreview('');
      setAdditionalPreviews([]);
    } catch (error) {
      console.error('خطأ في حفظ القالب:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryOption = (cat: Category) => {
    const indent = '  '.repeat(cat.level) + (cat.level > 0 ? '└─ ' : '');
    return (
      <option key={cat.id} value={cat.id}>
        {indent}{cat.nameAr} ({cat.nameEn})
      </option>
    );
  };

  const selectedCategory = categories.find((c) => c.id === formData.categoryId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* الرأس */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {title}
            </h2>
            {documentId && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ID: {documentId}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* المحتوى */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* التصنيف */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                التصنيف <span className="text-red-500">*</span>
              </label>
              {formData.categoryId && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Category ID: {formData.categoryId}
                  {typeof selectedCategory?.level === 'number' ? ` • Level: ${selectedCategory.level}` : ''}
                </p>
              )}
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
                required
              >
                <option value="">اختر التصنيف</option>
                {categories.map(renderCategoryOption)}
              </select>
            </div>

            {/* الاسم بالعربي */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الاسم بالعربي <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nameAr}
                onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
                placeholder="مثال: دشداشة رجالية"
                required
              />
            </div>

            {/* الاسم بالإنجليزي */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الاسم بالإنجليزي <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
                placeholder="Example: Men's Dishdasha"
                required
              />
            </div>

            {/* الرابط المختصر */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الرابط المختصر (Slug)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                placeholder="يتم إنشاؤه تلقائياً"
                readOnly
              />
            </div>

            {/* الصورة الافتراضية */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الصورة الافتراضية <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1">
                <span>⚠️</span>
                سيتم تصغير الصورة تلقائياً إلى 200 بيكسل مع الحفاظ على نسبة الأبعاد
              </p>
              <div className="flex items-start gap-4">
                {imagePreview && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-600">
                    <img
                      src={imagePreview}
                      alt="معاينة"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setFormData(prev => ({ ...prev, defaultImage: '' }));
                      }}
                      className="absolute top-1 left-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                <label className="flex-1 flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    اضغط لاختيار الصورة
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* الصور الإضافية */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                صور إضافية
              </label>
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1">
                <span>⚠️</span>
                سيتم تصغير كل صورة تلقائياً إلى 200 بيكسل
              </p>
              <div className="grid grid-cols-4 gap-4">
                {additionalPreviews.map((preview, index) => (
                  <div key={index} className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-600">
                    <img
                      src={preview}
                      alt={`صورة ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeAdditionalImage(index)}
                      className="absolute top-1 left-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <label className="w-full aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <span className="text-2xl">+</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">إضافة صورة</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* الوصف بالعربي */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الوصف بالعربي
              </label>
              <textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData(prev => ({ ...prev, descriptionAr: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent resize-none"
                placeholder="وصف المنتج بالعربي..."
              />
            </div>

            {/* الوصف بالإنجليزي */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الوصف بالإنجليزي
              </label>
              <textarea
                value={formData.descriptionEn}
                onChange={(e) => setFormData(prev => ({ ...prev, descriptionEn: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent resize-none"
                placeholder="Product description in English..."
              />
            </div>

            {/* الترتيب */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الترتيب
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
                min="0"
              />
            </div>

            {/* الحالة */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-emerald-500 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                مفعّل
              </label>
            </div>
          </div>

          {/* الأزرار */}
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
