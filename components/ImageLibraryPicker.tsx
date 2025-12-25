import React, { useState, useEffect, useMemo } from 'react';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { getImageCategories, getImagesByCategoryId } from '../services/imageLibraryService';
import { ImageLibraryCategory, ImageLibraryItem } from '../types';

interface ImageLibraryPickerProps {
  onSelect: (imageUrl: string) => void;
  onClose: () => void;
  preselectParentId?: string | null;
  preselectChildId?: string | null;
  rootParentId?: string | null; // إذا تم تمريره سيتم تثبيت المستوى الأول على هذا الجذر
  hideLevel0?: boolean; // إخفاء صف المستوى الأول
}

export const ImageLibraryPicker: React.FC<ImageLibraryPickerProps> = ({ onSelect, onClose, preselectParentId, preselectChildId, rootParentId, hideLevel0 }) => {
  const [categories, setCategories] = useState<ImageLibraryCategory[]>([]);
  const [images, setImages] = useState<ImageLibraryItem[]>([]);
  const [selectedLevel0Id, setSelectedLevel0Id] = useState<string | null>(null);
  const [selectedLevel1Id, setSelectedLevel1Id] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);

  // جلب الأقسام عند تحميل المكون
  useEffect(() => {
    loadCategories();
  }, []);

  // جلب الصور عند تحديد قسم نهائي
  useEffect(() => {
    if (selectedCategoryId) {
      loadImages(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  // تطبيق التحديد المسبق إن وجد
  useEffect(() => {
    // إذا لدينا جذر محدد، نجعله هو المستوى الأول
    if (rootParentId) {
      setSelectedLevel0Id(rootParentId);
    } else if (preselectParentId) {
      setSelectedLevel0Id(preselectParentId);
    }
    if (preselectChildId) {
      setSelectedLevel1Id(preselectChildId);
    }
  }, [preselectParentId, preselectChildId, rootParentId]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const cats = await getImageCategories();
      setCategories(cats);
      console.log('📚 تم تحميل', cats.length, 'قسم من مكتبة الصور');
    } catch (error) {
      console.error('❌ خطأ في تحميل الأقسام:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async (categoryId: string) => {
    setLoadingImages(true);
    try {
      const imgs = await getImagesByCategoryId(categoryId);
      setImages(imgs);
      console.log('🖼️ تم تحميل', imgs.length, 'صورة من القسم:', categoryId);
    } catch (error) {
      console.error('❌ خطأ في تحميل الصور:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  // بناء الهيكل الهرمي
  const buildCategoryTree = (cats: ImageLibraryCategory[]) => {
    const map = new Map<string, ImageLibraryCategory & { children: ImageLibraryCategory[] }>();
    const roots: (ImageLibraryCategory & { children: ImageLibraryCategory[] })[] = [];

    cats.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] });
    });

    cats.forEach(cat => {
      const node = map.get(cat.id);
      if (!node) return;

      if (!cat.parentId) {
        roots.push(node);
      } else {
        const parent = map.get(cat.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    return roots;
  };

  // الحصول على الأقسام حسب المستوى
  const level0Categories = useMemo(() => {
    return categories.filter(c => c.level === 0 || (!c.parentId && !c.level));
  }, [categories]);

  const level1Categories = useMemo(() => {
    if (!selectedLevel0Id) return [];
    return categories.filter(c => c.parentId === selectedLevel0Id);
  }, [categories, selectedLevel0Id]);

  const leafCategories = useMemo(() => {
    if (selectedLevel1Id) {
      return categories.filter(c => c.parentId === selectedLevel1Id && !c.hasChildren);
    } else if (selectedLevel0Id) {
      return categories.filter(c => c.parentId === selectedLevel0Id && !c.hasChildren);
    }
    return categories.filter(c => !c.hasChildren);
  }, [categories, selectedLevel0Id, selectedLevel1Id]);

  const handleImageSelect = (imageUrl: string) => {
    console.log('✅ تم اختيار صورة:', imageUrl);
    onSelect(imageUrl);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">اختر صورة من المكتبة</h2>
            <p className="text-xs text-slate-500">تصفح حسب الأقسام</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Container #2: الأقسام الرئيسية */}
            {!hideLevel0 && level0Categories.length > 0 && (
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => { 
                      console.log('🔵 [Picker Container #2] الجميع');
                      setSelectedLevel0Id(null); 
                      setSelectedLevel1Id(null); 
                      setSelectedCategoryId(null);
                      setImages([]);
                    }}
                    className={`shrink-0 px-3 py-1.5 text-xs rounded-md border transition ${
                      !selectedLevel0Id
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-blue-50'
                    }`}
                  >
                    الجميع
                  </button>
                  {level0Categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { 
                        console.log('🔵 [Picker Container #2]', cat.name, '| ID:', cat.id);
                        setSelectedLevel0Id(cat.id); 
                        setSelectedLevel1Id(null); 
                        setSelectedCategoryId(null);
                        setImages([]);
                      }}
                      className={`shrink-0 px-3 py-1.5 text-xs rounded-md border transition ${
                        selectedLevel0Id === cat.id 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-blue-50'
                      }`}
                    >
                      {cat.nameAr || cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Container #3: الأقسام الفرعية */}
            {selectedLevel0Id && level1Categories.length > 0 && (
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => { 
                      console.log('🟡 [Picker Container #3] الجميع');
                      setSelectedLevel1Id(null); 
                      setSelectedCategoryId(null);
                      setImages([]);
                    }}
                    className={`shrink-0 px-3 py-1.5 text-xs rounded-md border transition ${
                      !selectedLevel1Id
                        ? 'bg-amber-500 text-white border-amber-500' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-amber-50'
                    }`}
                  >
                    الجميع
                  </button>
                  {level1Categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { 
                        console.log('🟡 [Picker Container #3]', cat.name, '| ID:', cat.id);
                        setSelectedLevel1Id(cat.id);
                        // Allow images at level 1 by selecting the category directly
                        setSelectedCategoryId(cat.id);
                        setImages([]);
                      }}
                      className={`shrink-0 px-3 py-1.5 text-xs rounded-md border transition ${
                        selectedLevel1Id === cat.id 
                          ? 'bg-amber-500 text-white border-amber-500' 
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-amber-50'
                      }`}
                    >
                      {cat.nameAr || cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* الأقسام النهائية */}
            {(selectedLevel1Id || selectedLevel0Id) && leafCategories.length > 0 && (
              <div>
                <div className="mb-2">
                  <span className="text-xs text-slate-500">اختر القسم لعرض الصور</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {leafCategories.map(finalCat => (
                    <button
                      key={finalCat.id}
                      onClick={() => {
                        console.log('🟢 [Picker Final Grid]', finalCat.name, '| ID:', finalCat.id);
                        setSelectedCategoryId(finalCat.id);
                      }}
                      className={`p-3 rounded-lg text-right transition-all ${
                        selectedCategoryId === finalCat.id
                          ? 'bg-blue-500 text-white shadow-lg scale-105'
                          : 'bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <ImageIcon size={14} className={selectedCategoryId === finalCat.id ? 'text-white' : 'text-blue-500'} />
                        <span className="text-sm font-medium truncate">{finalCat.nameAr || finalCat.name}</span>
                      </div>
                      {finalCat.nameEn && (
                        <p className={`text-xs truncate ${selectedCategoryId === finalCat.id ? 'text-blue-100' : 'text-slate-500'}`}>
                          {finalCat.nameEn}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* عرض الصور */}
            {selectedCategoryId && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="mb-3">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">الصور المتاحة</span>
                </div>
                
                {loadingImages ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                  </div>
                ) : images.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <ImageIcon size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">لا توجد صور في هذا القسم</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map(img => (
                      <button
                        key={img.id}
                        onClick={() => handleImageSelect(img.imageUrl)}
                        className="group relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:shadow-lg hover:scale-105"
                      >
                        <img 
                          src={img.imageUrl} 
                          alt={img.label || 'صورة'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <span className="text-xs text-white font-medium truncate">{img.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* رسالة توجيهية */}
            {!selectedLevel0Id && (
              <div className="text-center py-12 text-slate-400">
                <ImageIcon size={64} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm">اختر قسماً لعرض الصور المتاحة</p>
              </div>
            )}
          </div>
        )}
      </div>
      anchorId_ImageLibraryPicker
    </div>
  );
};
