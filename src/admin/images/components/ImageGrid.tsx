import React from 'react';
import { FolderOpen, Edit2, Upload, Save, Trash2, ImagePlus, MoreVertical, RefreshCw, Eye } from 'lucide-react';
import { ImageLibraryCategory, ImageLibraryItem } from '../../../../types';

interface ImageGridProps {
  breadcrumb: string;
  selectedCategory: ImageLibraryCategory | null;
  categoryImages: ImageLibraryItem[];
  loading: boolean;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  editNameAr: string;
  setEditNameAr: (name: string) => void;
  editNameEn: string;
  setEditNameEn: (name: string) => void;
  selectedNewParentId: string | null;
  setSelectedNewParentId: (id: string | null) => void;
  availableParents: ImageLibraryCategory[];
  buildPathLabel: (cat: ImageLibraryCategory) => string;
  movingParent: boolean;
  onMoveParent: () => void;
  onDeleteCategory: () => void;
  onUpdateCategory: () => void;
  onDeleteImage: (id: string) => void;
  onGenerateThumbnail: (image: ImageLibraryItem) => void;
  thumbnailGeneratingById: Record<string, boolean>;
  openImageMenu: string | null;
  setOpenImageMenu: (id: string | null) => void;
  onViewImage: (image: ImageLibraryItem) => void;
  onAddImage: () => void;
  onClearSelection: () => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  breadcrumb,
  selectedCategory,
  categoryImages,
  loading,
  showSettings,
  setShowSettings,
  editNameAr,
  setEditNameAr,
  editNameEn,
  setEditNameEn,
  selectedNewParentId,
  setSelectedNewParentId,
  availableParents,
  buildPathLabel,
  movingParent,
  onMoveParent,
  onDeleteCategory,
  onUpdateCategory,
  onDeleteImage,
  onGenerateThumbnail,
  thumbnailGeneratingById,
  openImageMenu,
  setOpenImageMenu,
  onViewImage,
  onAddImage,
  onClearSelection
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 min-h-[400px]">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="text-slate-400">المسار:</span>
          <span className="font-medium bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">{breadcrumb}</span>
        </div>
        {selectedCategory && (
          <button 
            onClick={onClearSelection} 
            className="text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-lg transition"
          >
            مسح الاختيار
          </button>
        )}
      </div>

      {selectedCategory ? (
        <div className="animate-fadeIn">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FolderOpen size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {selectedCategory.name}
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-1.5 rounded-lg transition ${showSettings ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    title="إعدادات القسم"
                  >
                    <Edit2 size={16} />
                  </button>
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {categoryImages.length} صورة • {selectedCategory.nameEn || 'No English Name'}
                </p>
              </div>
            </div>
            <button
              onClick={onAddImage}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 transition shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-95"
            >
              <Upload size={18} />
              <span className="font-medium">رفع صور جديدة</span>
            </button>
          </div>

          {/* Collapsible Settings Panel */}
          {showSettings && (
            <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-slideDown">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Edit2 size={16} className="text-blue-500" />
                تعديل بيانات القسم
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">اسم القسم (عربي)</label>
                  <input 
                    value={editNameAr} 
                    onChange={e=>setEditNameAr(e.target.value)} 
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">اسم القسم (إنجليزي)</label>
                  <input 
                    value={editNameEn} 
                    onChange={e=>setEditNameEn(e.target.value)} 
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">نقل القسم (تغيير الأب)</label>
                <div className="flex gap-3">
                  <select 
                    value={selectedNewParentId ?? ''} 
                    onChange={e=>setSelectedNewParentId(e.target.value || null)} 
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    <option value="">بدون أب — مستوى 0</option>
                    {availableParents.map(p => (
                      <option key={p.id} value={p.id}>{buildPathLabel(p)}</option>
                    ))}
                  </select>
                  <button
                    onClick={onMoveParent}
                    disabled={movingParent}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition disabled:opacity-50"
                  >
                    {movingParent ? 'جارٍ النقل...' : 'نقل'}
                  </button>
                  <button
                    onClick={() => setSelectedNewParentId(null)}
                    disabled={movingParent || !selectedNewParentId}
                    className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={onDeleteCategory}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  حذف القسم نهائياً
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setEditNameAr(selectedCategory.nameAr || selectedCategory.name || '');
                      setEditNameEn(selectedCategory.nameEn || '');
                      setSelectedNewParentId(null);
                      setShowSettings(false);
                    }}
                    className="px-6 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={onUpdateCategory}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm flex items-center gap-2"
                  >
                    <Save size={16} />
                    حفظ التغييرات
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-slate-500">جاري تحميل الصور...</p>
            </div>
          ) : categoryImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <ImagePlus size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">لا توجد صور بعد</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-xs">
                هذا القسم فارغ. ابدأ بإضافة بعض الصور لعرضها هنا.
              </p>
              <button
                onClick={onAddImage}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-lg shadow-blue-600/20"
              >
                إضافة صورة الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {categoryImages.map(image => (
                <div
                  key={image.id}
                  className="group relative aspect-[3/4] bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl transition-all duration-300"
                >
                  <img
                    src={image.thumbnailUrl || image.imageUrl}
                    alt={image.label}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                    <div className="flex justify-between items-start">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenImageMenu(openImageMenu === image.id ? null : image.id);
                        }}
                        className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-lg text-white transition"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {openImageMenu === image.id && (
                        <div className="absolute top-10 left-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-600 py-1 min-w-[140px] z-20 animate-fadeIn">
                          {!image.thumbnailUrl && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onGenerateThumbnail(image);
                              }}
                              disabled={!!thumbnailGeneratingById[image.id]}
                              className="w-full px-3 py-2 text-xs text-right text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition"
                            >
                              <RefreshCw size={14} className={thumbnailGeneratingById[image.id] ? 'animate-spin' : ''} />
                              {thumbnailGeneratingById[image.id] ? 'جارٍ المعالجة...' : 'إنشاء مصغّر'}
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenImageMenu(null);
                              onDeleteImage(image.id);
                            }}
                            className="w-full px-3 py-2 text-xs text-right text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition"
                          >
                            <Trash2 size={14} />
                            حذف الصورة
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => onViewImage(image)}
                        className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition"
                      >
                        <Eye size={14} />
                        عرض كامل
                      </button>
                      <p className="text-white text-xs font-medium line-clamp-2 leading-tight drop-shadow-md">
                        {image.label}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 animate-bounce-slow">
            <FolderOpen size={40} className="text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">لم يتم اختيار قسم</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm">
            اختر أحد الأقسام من القائمة أعلاه لعرض الصور وإدارتها، أو قم بإنشاء قسم جديد.
          </p>
        </div>
      )}
    </div>
  );
};
