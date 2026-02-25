import React from 'react';
import { X, DollarSign, Clock, LayoutGrid, ChevronDown, ChevronUp, ImageIcon, ImagePlus, Star, RefreshCw, Trash2, Video, ZoomIn } from 'lucide-react';
import { useImageLightbox } from './ImageLightbox';
import { Product } from '../types';
import imageCompression from 'browser-image-compression';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';

interface ProductFormDialogProps {
  isOpen: boolean;
  isEditing: boolean;
  editingProduct: Product | null;
  formState: {
    newName: string;
    newPrice: string;
    newDuration: string;
    newCategory: string;
    newDescription: string;
    newTags: string;
    categorySearch: string;
    allProductImages: string[];
    coverImageIndex: number;
    isImageDragOver: boolean;
    bulkMode: boolean;
    loading: boolean;
    uploadError: string;
    pendingImageFiles: File[];
    pendingBlobUrls: string[];
    pendingVideoFile: File | null;
    pendingVideoUrl: string;
    draggedImageIndex: number | null;
  };
  handlers: {
    setNewName: (value: string) => void;
    setNewPrice: (value: string) => void;
    setNewDuration: (value: string) => void;
    setNewCategory: (value: string) => void;
    setNewDescription: (value: string) => void;
    setNewTags: (value: string) => void;
    setCategorySearch: (value: string) => void;
    setAllProductImages: (value: string[] | ((prev: string[]) => string[])) => void;
    setCoverImageIndex: (value: number | ((prev: number) => number)) => void;
    setIsImageDragOver: (value: boolean) => void;
    setBulkMode: (value: boolean) => void;
    setUploadError: (value: string) => void;
    setPendingImageFiles: (value: File[] | ((prev: File[]) => File[])) => void;
    setPendingBlobUrls: (value: string[] | ((prev: string[]) => string[])) => void;
    setPendingVideoFile: (value: File | null) => void;
    setPendingVideoUrl: (value: string) => void;
    setDraggedImageIndex: (value: number | null) => void;
  };
  callbacks: {
    handleAddProduct: (e: any, isDraft?: boolean) => Promise<void>;
    handleUpdateProduct: (e: any, isDraft?: boolean) => Promise<void>;
    handleSaveAndAddAnother: (e: any) => Promise<void>;
    cancelEdit: () => void;
    resetForm: () => void;
    closeDialog: () => void;
    addImageFilesToForm: (files: File[]) => void;
    reorderImages: (from: number, to: number) => void;
    showDefaultImagesModal: (show: boolean) => void;
  };
  availableCategories: any[];
  groupedCategoryOptions: any[];
  user: any;
}

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  isOpen,
  isEditing,
  editingProduct,
  formState,
  handlers,
  callbacks,
  availableCategories,
  groupedCategoryOptions,
  user,
}) => {
  if (!isOpen) return null;

  const [isCategoryOpen, setIsCategoryOpen] = React.useState(false);
  const [activeCategoryGroup, setActiveCategoryGroup] = React.useState<string>(
    () => groupedCategoryOptions[0]?.groupName ?? ''
  );
  const [imageToDelete, setImageToDelete] = React.useState<number | null>(null);
  const { openLightbox, LightboxPortal } = useImageLightbox();

  React.useEffect(() => {
    if (!activeCategoryGroup && groupedCategoryOptions.length > 0) {
      setActiveCategoryGroup(groupedCategoryOptions[0]?.groupName ?? '');
      return;
    }
    if (activeCategoryGroup) {
      const exists = groupedCategoryOptions.some((g) => g.groupName === activeCategoryGroup);
      if (!exists) {
        setActiveCategoryGroup(groupedCategoryOptions[0]?.groupName ?? '');
      }
    }
  }, [activeCategoryGroup, groupedCategoryOptions]);

  const handleCategorySelect = (categoryId: string, categoryName?: string) => {
    handlers.setNewCategory(categoryId);
    handlers.setNewName(categoryName ?? '');
    setIsCategoryOpen(false);
  };

  const handleClose = () => {
    if (isEditing) {
      callbacks.cancelEdit();
    } else {
      handlers.setBulkMode(false);
      callbacks.resetForm();
      callbacks.closeDialog();
    }
  };

  const confirmDeleteImage = () => {
    if (imageToDelete === null) return;
    
    const index = imageToDelete;
    const urlToDelete = formState.allProductImages[index];
    
    // If it's a blob URL, also remove from pending arrays
    if (urlToDelete.startsWith('blob:')) {
      URL.revokeObjectURL(urlToDelete);
      const blobIndex = formState.pendingBlobUrls.indexOf(urlToDelete);
      if (blobIndex !== -1) {
        handlers.setPendingBlobUrls((prev) => prev.filter((_, i) => i !== blobIndex));
        handlers.setPendingImageFiles((prev) => prev.filter((_, i) => i !== blobIndex));
      }
    }
    
    handlers.setAllProductImages((prev) => prev.filter((_, i) => i !== index));
    if (index === formState.coverImageIndex && formState.allProductImages.length > 1) {
      handlers.setCoverImageIndex(0);
    } else if (index < formState.coverImageIndex) {
      handlers.setCoverImageIndex((prev) => prev - 1);
    }
    
    setImageToDelete(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[11000] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col font-['Cairo']">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-50 border-b border-slate-200 dark:border-slate-200 p-3 md:p-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-900">
              {isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-200 rounded-lg transition-all text-slate-600 dark:text-slate-600"
            title="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <form
          onSubmit={isEditing ? callbacks.handleUpdateProduct : callbacks.handleAddProduct}
          className="flex-1 overflow-y-auto bg-white dark:bg-white"
        >
          <div className="p-4 md:p-5 space-y-4 pb-24">
          {/* Section 1: Category */}
          <div className="space-y-3 pb-4 border-b border-slate-100 bg-[#f6f2fb] rounded-xl p-3">
            <div className="flex items-center justify-between">
              <h4 className="text-slate-900 dark:text-slate-900 text-sm font-medium uppercase tracking-wide opacity-70">التصنيف *</h4>
              <button
                type="button"
                onClick={() => setIsCategoryOpen((prev) => !prev)}
                className="text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
              >
                {isCategoryOpen ? 'إخفاء التصنيفات' : 'عرض التصنيفات'}
                {isCategoryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {formState.newCategory && (
              <button
                type="button"
                onClick={() => {
                  const selectedGroup = groupedCategoryOptions.find((g) =>
                    g.children?.some((child: any) => child.id === formState.newCategory)
                  )?.groupName;
                  if (selectedGroup) {
                    setActiveCategoryGroup(selectedGroup);
                  }
                  setIsCategoryOpen((prev) => !prev);
                }}
                className="w-full flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-[#63498b]/40 transition-colors"
              >
                {(() => {
                  const cat = availableCategories.find((c) => c.id === formState.newCategory);
                  return (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0">
                        {cat?.image ? (
                          <img src={cat.image} alt={cat?.nameAr || 'صورة التصنيف'} className="w-full h-full object-cover" />
                        ) : (
                          <LayoutGrid size={16} className="mx-auto mt-1.5 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 text-right">
                        <div className="text-slate-900 text-sm font-medium">{cat?.nameAr}</div>
                        <div className="text-xs text-slate-500">{cat?.parentName || 'تصنيف'}</div>
                      </div>
                      {isCategoryOpen ? (
                        <ChevronUp size={16} className="text-slate-500" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-500" />
                      )}
                    </>
                  );
                })()}
              </button>
            )}

            {!formState.newCategory && !isCategoryOpen && (
              <button
                type="button"
                onClick={() => setIsCategoryOpen(true)}
                className="w-full border-2 border-dashed border-slate-300 rounded-lg p-3 text-center hover:border-[#63498b] hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <LayoutGrid size={16} className="text-slate-400" />
                <span className="text-sm text-slate-600">اختر التصنيف</span>
              </button>
            )}

            {isCategoryOpen && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {groupedCategoryOptions.map(({ groupName }) => (
                    <button
                      key={groupName}
                      type="button"
                      onClick={() => setActiveCategoryGroup(groupName)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        activeCategoryGroup === groupName
                          ? 'bg-[#63498b]/10 text-[#63498b] border-[#63498b]/40'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {groupName}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(groupedCategoryOptions.find((g) => g.groupName === activeCategoryGroup) || groupedCategoryOptions[0])?.children?.map(
                    (child: any) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => handleCategorySelect(child.id, child.nameAr)}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-right ${
                          formState.newCategory === child.id
                            ? 'border-[#63498b] bg-[#63498b]/5'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden shrink-0">
                          {child.image && (
                            <img src={child.image} alt={child.nameAr || 'صورة التصنيف'} className="w-full h-full object-cover" loading="lazy" />
                          )}
                        </div>
                        <span className="text-sm text-slate-900 line-clamp-2">
                          {child.nameAr}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Basic Info */}
          <div className="space-y-4">
            <h4 className="text-slate-900 dark:text-slate-900 text-sm font-medium uppercase tracking-wide opacity-70">المعلومات الأساسية</h4>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-600 mb-1.5 font-medium">اسم المنتج *</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formState.newName}
                  onChange={(e) => handlers.setNewName(e.target.value)}
                  required
                  className="flex-1 bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 placeholder-slate-400"
                  placeholder="مثال: دشداشة مطرزة فاخرة"
                />
                <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded whitespace-nowrap">
                  {formState.newName.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-600 mb-1.5 font-medium">السعر (ر.ع) *</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 pointer-events-none" />
                  <input
                    type="number"
                    value={formState.newPrice}
                    onChange={(e) => handlers.setNewPrice(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 pr-9 text-sm text-slate-900 placeholder-slate-400"
                    placeholder="25.000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-600 mb-1.5 font-medium">مدة الإنجاز *</label>
                <div className="relative">
                  <Clock size={16} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={formState.newDuration}
                    onChange={(e) => handlers.setNewDuration(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 pr-9 text-sm text-slate-900 placeholder-slate-400"
                    placeholder="5 أيام"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Description & Tags */}
          <div className="space-y-4">
            <h4 className="text-slate-900 dark:text-slate-900 text-sm font-medium uppercase tracking-wide opacity-70">الوصف والتفاصيل</h4>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-600 mb-1.5 font-medium">الوصف</label>
              <textarea
                value={formState.newDescription}
                onChange={(e) => handlers.setNewDescription(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm resize-none outline-none text-slate-900 placeholder-slate-400"
                placeholder="وصف تفصيلي للمنتج..."
                rows={3}
              />
              <div className="text-xs text-slate-400 mt-1 text-left">
                {formState.newDescription.length} / 500
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-600 mb-1.5 font-medium">الوسوم (اختياري)</label>
              <input
                type="text"
                value={formState.newTags}
                onChange={(e) => handlers.setNewTags(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm outline-none text-slate-900 placeholder-slate-400"
                placeholder="فاخر، مطرز، عماني (افصل بفاصلة)"
              />
              <div className="text-xs text-slate-400 mt-1">
                {formState.newTags.split(',').filter((t) => t.trim()).length} وسم
              </div>
            </div>
          </div>

          {/* Section 4: Images */}
          <div className="space-y-3 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-slate-900 dark:text-slate-900 text-sm font-medium uppercase tracking-wide opacity-70">الصور {!isEditing && '*'}</h4>
              <span className="text-xs font-mono bg-orange-50 text-orange-600 px-2.5 py-1 rounded">
                {formState.allProductImages.length}/10
              </span>
            </div>

            {/* Image upload areas */}
            {formState.allProductImages.length < 10 && (
              <div className="grid grid-cols-2 gap-3">
                {/* Drag & drop area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${
                    formState.isImageDragOver
                      ? 'border-[#63498b] bg-[#63498b]/5'
                      : 'border-slate-300 hover:border-[#63498b] hover:bg-[#63498b]/5'
                  }`}
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); handlers.setIsImageDragOver(true); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); handlers.setIsImageDragOver(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); handlers.setIsImageDragOver(false); }}
                  onDrop={(e) => {
                    e.preventDefault(); e.stopPropagation(); handlers.setIsImageDragOver(false);
                    const files = Array.from(e.dataTransfer.files || []);
                    callbacks.addImageFilesToForm(files);
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*,image/avif';
                      input.multiple = true;
                      input.onchange = (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || []);
                        if (files.length === 0) return;
                        callbacks.addImageFilesToForm(files);
                      };
                      input.click();
                    }}
                    className="w-full"
                    disabled={formState.loading}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon size={20} className="text-[#63498b]/70" />
                      <span className="text-sm text-slate-600">{formState.loading ? 'جاري...' : 'رفع صور'}</span>
                    </div>
                  </button>
                </div>

                {/* Video upload button */}
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'video/*';
                    input.multiple = false;
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      if (files.length === 0) return;
                      const videoFile = files[0];
                      if (videoFile && videoFile.type.startsWith('video/')) {
                        // Clean up previous blob URL if exists
                        if (formState.pendingVideoUrl && formState.pendingVideoUrl.startsWith('blob:')) {
                          URL.revokeObjectURL(formState.pendingVideoUrl);
                        }
                        // Create new blob URL for preview
                        const blobUrl = URL.createObjectURL(videoFile);
                        handlers.setPendingVideoFile(videoFile);
                        handlers.setPendingVideoUrl(blobUrl);
                      } else {
                        alert('الرجاء اختيار ملف فيديو صالح');
                      }
                    };
                    input.click();
                  }}
                  disabled={formState.loading}
                  className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-[#63498b] hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <Video size={20} className="text-[#63498b]/70" />
                  <span className="text-sm text-slate-600">رفع فيديو</span>
                </button>
              </div>
            )}

            {formState.uploadError && (
              <p className="text-sm text-red-500">{formState.uploadError}</p>
            )}

            {/* Video preview */}
            {formState.pendingVideoUrl && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="relative w-32 aspect-video bg-slate-900 rounded overflow-hidden shrink-0">
                    <video
                      src={formState.pendingVideoUrl}
                      className="absolute inset-0 w-full h-full object-cover"
                      controls
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {formState.pendingVideoFile?.name || 'فيديو المنتج'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formState.pendingVideoFile
                        ? `${(formState.pendingVideoFile.size / (1024 * 1024)).toFixed(2)} MB`
                        : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (formState.pendingVideoUrl && formState.pendingVideoUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(formState.pendingVideoUrl);
                      }
                      handlers.setPendingVideoFile(null);
                      handlers.setPendingVideoUrl('');
                    }}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    aria-label="حذف الفيديو"
                    title="حذف الفيديو"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            )}

            {/* Image grid */}
            {formState.allProductImages.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="grid grid-cols-5 gap-2">
                  {formState.allProductImages.map((img, index) => (
                    <div
                      key={index}
                      className={`relative group rounded shadow-sm overflow-hidden cursor-move ${
                        index === formState.coverImageIndex
                          ? 'ring-2 ring-[#63498b]'
                          : 'ring-1 ring-slate-200'
                      }`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', String(index));
                        handlers.setDraggedImageIndex(index);
                      }}
                      onDragEnd={() => handlers.setDraggedImageIndex(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromRaw = e.dataTransfer.getData('text/plain');
                        const from = Number(fromRaw);
                        if (!Number.isFinite(from)) return;
                        callbacks.reorderImages(from, index);
                        handlers.setDraggedImageIndex(null);
                      }}
                    >
                      <img src={img} alt={`صورة ${index + 1}`} className="w-full aspect-square object-cover" />
                      
                      {index === formState.coverImageIndex && (
                        <div className="absolute top-1 left-1 bg-[#63498b] text-white p-1 rounded-full">
                          <Star size={10} fill="white" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                        {index !== formState.coverImageIndex && (
                          <button
                            type="button"
                            onClick={() => handlers.setCoverImageIndex(index)}
                            className="bg-white/95 hover:bg-white text-[#63498b] p-2 rounded-lg"
                            title="تعيين كغلاف"
                          >
                            <Star size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openLightbox(formState.allProductImages, index)}
                          className="bg-white/95 hover:bg-white text-slate-700 p-2 rounded-lg"
                          title="عرض مكبّر"
                        >
                          <ZoomIn size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageToDelete(index)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          </div>
          <LightboxPortal />

          {/* Footer - Sticky */}
          <div className="sticky bottom-0 border-t border-slate-100 bg-white/95 backdrop-blur-sm px-4 md:px-5 py-3 flex gap-2 shrink-0">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={(e) => callbacks.handleAddProduct(e as any, true)}
                disabled={formState.loading}
                className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50 transition-colors font-medium"
              >
                {formState.loading ? 'جاري...' : 'Save draft'}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#63498b] text-white text-sm hover:bg-[#63498b]/90 transition-colors font-medium"
                disabled={formState.loading}
              >
                {formState.loading ? 'جاري...' : '✓ نشر'}
              </button>
            </>
          ) : isEditing && editingProduct?.isDraft ? (
            <>
              <button
                type="button"
                onClick={(e) => callbacks.handleUpdateProduct(e as any, true)}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#63498b] text-white text-sm hover:bg-[#63498b]/90 transition-colors font-medium"
                disabled={formState.loading}
              >
                {formState.loading ? 'جاري...' : '✓ نشر'}
              </button>
              <button
                type="submit"
                disabled={formState.loading}
                className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50 transition-colors font-medium"
              >
                {formState.loading ? 'جاري...' : 'حفظ'}
              </button>
            </>
          ) : (
            <button 
              type="submit" 
              className="flex-1 py-2.5 px-4 rounded-lg bg-[#63498b] text-white text-sm hover:bg-[#63498b]/90 transition-colors font-medium"
              disabled={formState.loading}
            >
              {formState.loading ? 'جاري...' : 'تحديث'}
            </button>
          )}

          <button 
            type="button" 
            onClick={handleClose}
            className="py-2.5 px-4 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50 transition-colors font-medium"
          >
            إلغاء
          </button>
        </div>
        </form>

      </div>
      
      {/* Delete Image Confirmation Dialog */}
      {imageToDelete !== null && (
        <div 
          className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setImageToDelete(null)}
        >
          <div 
            className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">حذف الصورة؟</h3>
                <p className="text-sm text-gray-500">هل أنت متأكد من حذف هذه الصورة؟ لن تتمكن من استرجاعها.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setImageToDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all active:scale-95"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDeleteImage}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all active:scale-95"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
