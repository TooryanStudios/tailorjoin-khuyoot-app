import React, { useState, useEffect } from 'react';
import { RefreshCw, FolderPlus } from 'lucide-react';
import { ImageLibraryCategory, ImageLibraryItem } from '../../../types';
import {
  getImageCategories,
  deleteImageCategory,
  getImagesByCategoryId,
  addImageToLibrary,
  deleteImageLibraryItem,
  updateImageCategory,
  ensureThumbnailForImageLibraryItem,
  syncCategoriesFromProducts
} from '../../../services/imageLibraryService';
import { getRootImageCategories, createCategoryWithParent, reassignCategoryParent } from '../../../services/imageLibraryService';
import { useApp } from '../../../context/AppContext';
import { CategoryTreeItemWrapper, CategoryTreeContext, CategoryTreeNode } from './components/CategoryTree';
import { AddCategoryModal } from './components/AddCategoryModal';
import { AddImageModal } from './components/AddImageModal';
import { ImageViewerModal } from './components/ImageViewerModal';
import { ImageGrid } from './components/ImageGrid';

export const ImageLibraryManagement = () => {
  const { user } = useApp();
  const [categories, setCategories] = useState<ImageLibraryCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ImageLibraryCategory | null>(null);
  const [categoryImages, setCategoryImages] = useState<ImageLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'female' | 'male'>('all');
  const [selectedLevel0Id, setSelectedLevel0Id] = useState<string | null>(null);
  const [selectedLevel1Id, setSelectedLevel1Id] = useState<string | null>(null);
  const [editNameAr, setEditNameAr] = useState('');
  const [editNameEn, setEditNameEn] = useState('');

  // Debugging state
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadCounter, setUploadCounter] = useState<{ done: number; total: number } | null>(null);
  
  const [openCategoryMenu, setOpenCategoryMenu] = useState<string | null>(null);
  const [openImageMenu, setOpenImageMenu] = useState<string | null>(null);
  const [thumbnailGeneratingById, setThumbnailGeneratingById] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState(false);
  const [rootParents, setRootParents] = useState<ImageLibraryCategory[]>([]);
  const [selectedNewParentId, setSelectedNewParentId] = useState<string | null>(null);
  const [movingParent, setMovingParent] = useState(false);
  const [uiMessage, setUiMessage] = useState<string | null>(null);
  const [uiError, setUiError] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<ImageLibraryItem | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (uiMessage || uiError) {
      const timer = setTimeout(() => {
        setUiMessage(null);
        setUiError(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [uiMessage, uiError]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryImages(selectedCategory.id);
      setEditNameAr(selectedCategory.nameAr || selectedCategory.name || '');
      setEditNameEn(selectedCategory.nameEn || '');
    }
  }, [selectedCategory]);

  // إغلاق القوائم المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenCategoryMenu(null);
      setOpenImageMenu(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    // load root parents for selectors
    getRootImageCategories().then(setRootParents).catch(() => setRootParents([]));
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getImageCategories();
      setCategories(data);
      if (data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCategories = async () => {
    console.log('🔄 بدء المزامنة...');
    if (!confirm('هل تريد مزامنة الأقسام من تصنيفات المنتجات؟ سيتم إنشاء أقسام جديدة بناءً على التصنيفات الهرمية.')) {
      return;
    }

    setSyncing(true);
    try {
      console.log('📞 استدعاء syncCategoriesFromProducts...');
      const result = await syncCategoriesFromProducts();
      console.log('✅ النتيجة:', result);
      alert(`تمت المزامنة بنجاح!\nتم إنشاء ${result.created} قسم جديد\nتم تحديث ${result.updated} قسم`);
      await loadCategories();
      const roots = await getRootImageCategories();
      setRootParents(roots);
      // فتح زر الأزياء تلقائياً بعد المزامنة
      if (level0Categories.length > 0 || result.created > 0) {
        setTimeout(() => {
          if (level0Categories.length > 0) {
            setSelectedLevel0Id(level0Categories[0].id);
          }
        }, 500);
      }
    } catch (error) {
      console.error('❌ خطأ في المزامنة:', error);
      alert(`حدث خطأ أثناء المزامنة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setSyncing(false);
    }
  };

  const buildCategoryTree = (categories: ImageLibraryCategory[]): CategoryTreeNode[] => {
    const nodeMap = new Map<string, CategoryTreeNode>();

    categories.forEach(cat => {
      nodeMap.set(cat.id, { ...cat, children: [] });
    });

    const roots: CategoryTreeNode[] = [];

    categories.forEach(cat => {
      const node = nodeMap.get(cat.id);
      if (!node) return;

      if (cat.parentId) {
        const parent = nodeMap.get(cat.parentId);
        if (parent) parent.children.push(node);
        else roots.push(node);
      } else {
        roots.push(node);
      }
    });

    const displayName = (c: ImageLibraryCategory) => (c.nameAr || c.name || '').toString();
    const sortNodes = (nodes: CategoryTreeNode[]) => {
      nodes.sort((a, b) => {
        const orderA = a.order ?? Number.POSITIVE_INFINITY;
        const orderB = b.order ?? Number.POSITIVE_INFINITY;
        if (orderA !== orderB) return orderA - orderB;
        return displayName(a).localeCompare(displayName(b), 'ar');
      });
      nodes.forEach(n => {
        if (n.children.length) sortNodes(n.children);
      });
    };

    const assignLevels = (nodes: CategoryTreeNode[], level: number) => {
      nodes.forEach(n => {
        n.level = level;
        if (n.children.length) assignLevels(n.children, level + 1);
      });
    };

    sortNodes(roots);
    assignLevels(roots, 0);
    return roots;
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Helper: Build a quick lookup map for categories by id
  const categoryMap = React.useMemo(() => {
    const map = new Map<string, ImageLibraryCategory>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  // Helper: get root ancestor name to infer female/male grouping
  const getRootAncestorName = (cat: ImageLibraryCategory): string | null => {
    let current: ImageLibraryCategory | undefined = cat;
    let last: ImageLibraryCategory | undefined = cat;
    const guard = 50;
    let steps = 0;
    while (current && current.parentId && steps < guard) {
      last = categoryMap.get(current.parentId) || undefined;
      current = last;
      steps++;
    }
    return last ? (last.nameAr || last.name) : null;
  };

  // Categories visible in the sidebar tree.
  // IMPORTANT: we include ancestors of matching leaves so nesting works.
  const visibleCategories = React.useMemo(() => {
    if (activeTab === 'all') return categories;

    const leaves = categories.filter(c => !c.hasChildren);
    const matchingLeaves = leaves.filter(c => {
      const rootName = getRootAncestorName(c) || '';
      if (activeTab === 'female') return /نسائ|النسائية|حري/i.test(rootName);
      if (activeTab === 'male') return /رجال|الرجالية|رجالي/i.test(rootName);
      return true;
    });

    const ids = new Set<string>();
    const guard = 100;
    const addWithAncestors = (cat: ImageLibraryCategory) => {
      let current: ImageLibraryCategory | undefined = cat;
      let steps = 0;
      while (current && steps < guard) {
        ids.add(current.id);
        if (!current.parentId) break;
        current = categoryMap.get(current.parentId) || undefined;
        steps++;
      }
    };

    matchingLeaves.forEach(addWithAncestors);
    return categories.filter(c => ids.has(c.id));
  }, [categories, activeTab, categoryMap]);

  // Level collections for drill-down
  const level0Categories = React.useMemo(() => categories.filter(c => c.level === 0), [categories]);
  const level1Categories = React.useMemo(
    () => (selectedLevel0Id ? categories.filter(c => c.parentId === selectedLevel0Id) : []),
    [categories, selectedLevel0Id]
  );
  const level2Categories = React.useMemo(
    () => (selectedLevel1Id ? categories.filter(c => c.parentId === selectedLevel1Id) : []),
    [categories, selectedLevel1Id]
  );

  const resetDrillDown = () => {
    setSelectedLevel0Id(null);
    setSelectedLevel1Id(null);
  };

  // Breadcrumb builder
  const breadcrumb = React.useMemo(() => {
    const parts: string[] = [];
    const tabLabel = activeTab === 'female' ? 'النسائية' : activeTab === 'male' ? 'الرجالية' : 'الكل';
    parts.push('الأزياء');
    parts.push(tabLabel);
    if (selectedLevel0Id) {
      const l0 = categoryMap.get(selectedLevel0Id);
      if (l0) parts.push(l0.nameAr || l0.name);
    }
    if (selectedLevel1Id) {
      const l1 = categoryMap.get(selectedLevel1Id);
      if (l1) parts.push(l1.nameAr || l1.name);
    }
    if (selectedCategory) {
      parts.push(selectedCategory.nameAr || selectedCategory.name);
    }
    return parts.join(' › ');
  }, [activeTab, selectedLevel0Id, selectedLevel1Id, selectedCategory, categoryMap]);

  const loadCategoryImages = async (categoryId: string) => {
    setLoading(true);
    try {
      console.log('📥 تحميل صور القسم:', categoryId);
      const images = await getImagesByCategoryId(categoryId);
      console.log('📸 عدد الصور المحملة:', images.length, images);
      setCategoryImages(images);
    } catch (error) {
      console.error('❌ خطأ في تحميل صور القسم:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if candidate is a descendant of the selected category (to avoid cycles)
  const isDescendantOfSelected = (candidateId: string): boolean => {
    if (!selectedCategory) return false;
    const guard = 100;
    let current = categoryMap.get(candidateId);
    let steps = 0;
    while (current && current.parentId && steps < guard) {
      if (current.parentId === selectedCategory.id) return true;
      current = categoryMap.get(current.parentId);
      steps++;
    }
    return false;
  };

  const availableParents = React.useMemo(() => {
    if (!selectedCategory) return [] as ImageLibraryCategory[];
    return categories.filter(c => 
      c.id !== selectedCategory.id &&
      !c.isImmutable &&
      !/(الأزياء|Fashion)/i.test(c.nameAr || c.name || '') &&
      !isDescendantOfSelected(c.id)
    );
  }, [categories, selectedCategory]);

  // Build hierarchical path label for a category
  const buildPathLabel = (cat: ImageLibraryCategory): string => {
    const parts: string[] = [];
    let current: ImageLibraryCategory | undefined = cat;
    const guard = 50;
    let steps = 0;
    while (current && steps < guard) {
      parts.unshift(current.nameAr || current.name);
      if (!current.parentId) break;
      current = categoryMap.get(current.parentId) || undefined;
      steps++;
    }
    return parts.join(' › ');
  };

  const handleAddCategory = async (data: { name: string; nameEn: string; order: number; parentId: string | null }) => {
    const { name, nameEn, order, parentId } = data;
    if (!name.trim() || !nameEn.trim()) {
      alert('يرجى ملء جميع الحقول');
      return;
    }

    const chosenParent = parentId ?? selectedLevel1Id ?? selectedLevel0Id ?? null;
    console.debug('[ImageLibrary] createCategoryWithParent debug', {
      name,
      nameEn,
      selectedLevel0Id,
      selectedLevel1Id,
      chosenParent
    });
    try {
      setLoading(true);
      await createCategoryWithParent(name, { nameEn: nameEn || undefined, parentId: chosenParent });
      
      setShowAddCategoryModal(false);
      await loadCategories();
      alert('تم إضافة القسم بنجاح!');
    } catch (error) {
      console.error('Error adding category:', error);
      alert('فشل إضافة القسم');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع الصور المرتبطة به.')) {
      return;
    }

    try {
      setLoading(true);
      await deleteImageCategory(categoryId);
      if (selectedCategory?.id === categoryId) {
        setSelectedCategory(null);
      }
      await loadCategories();
      alert('تم حذف القسم بنجاح');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('فشل حذف القسم');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async (files: File[], label: string) => {
    if (!selectedCategory || files.length === 0 || !label.trim()) {
      alert('يرجى ملء جميع الحقول واختيار صورة/صور');
      return;
    }

    console.log('🚀 بدء رفع الصور:', {
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      filesCount: files.length,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      label: label
    });

    try {
      setUploadProgress(true);
      setUploadCounter({ done: 0, total: files.length });
      const uploaderId = user?.id || 'admin';
      
      console.log('📤 استدعاء addImageToLibrary...');
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageLabel = files.length > 1 ? `${label.trim()} (${i + 1})` : label.trim();
        const imageId = await addImageToLibrary(selectedCategory.id, file, imageLabel, uploaderId);
        console.log('✅ تم رفع الصورة بنجاح! ID:', imageId);
        setUploadCounter(prev => {
          if (!prev) return prev;
          return { ...prev, done: Math.min(prev.total, prev.done + 1) };
        });
      }
      
      console.log('🔄 إعادة تحميل الصور...');
      await loadCategoryImages(selectedCategory.id);
      console.log('✅ تم إعادة تحميل الصور');
      
      setShowAddImageModal(false);
      
      setUiMessage(files.length > 1 ? 'تم إضافة الصور بنجاح!' : 'تم إضافة الصورة بنجاح!');
    } catch (error) {
      console.error('❌ خطأ في إضافة الصورة:', error);
      setUiError('فشل إضافة الصورة: ' + (error as Error).message);
    } finally {
      setUploadProgress(false);
      setUploadCounter(null);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
      return;
    }

    try {
      setLoading(true);
      await deleteImageLibraryItem(imageId);
      if (selectedCategory) {
        await loadCategoryImages(selectedCategory.id);
      }
      alert('تم حذف الصورة بنجاح');
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('فشل حذف الصورة');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateThumbnailForImage = async (image: ImageLibraryItem) => {
    if (thumbnailGeneratingById[image.id]) return;
    try {
      setThumbnailGeneratingById(prev => ({ ...prev, [image.id]: true }));
      setOpenImageMenu(null);
      const newThumbUrl = await ensureThumbnailForImageLibraryItem({
        id: image.id,
        categoryId: image.categoryId,
        imageUrl: image.imageUrl,
        thumbnailUrl: image.thumbnailUrl
      });

      // If the viewer modal is open for the same image, update it immediately.
      setViewingImage(prev => {
        if (!prev || prev.id !== image.id) return prev;
        return { ...prev, thumbnailUrl: newThumbUrl };
      });

      if (selectedCategory) {
        await loadCategoryImages(selectedCategory.id);
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      alert('فشل إنشاء المصغّر');
    } finally {
      setThumbnailGeneratingById(prev => ({ ...prev, [image.id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              مكتبة الصور
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              إدارة الصور الافتراضية للخياطين والمحلات
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncCategories}
              disabled={syncing}
              className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg flex items-center gap-1.5 transition shadow-sm"
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'جاري المزامنة...' : 'مزامنة من المنتجات'}
            </button>
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 transition shadow-sm"
            >
              <FolderPlus size={16} />
              قسم جديد
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === 'all' 
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setActiveTab('female')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === 'female' 
                  ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              النسائية
            </button>
            <button
              onClick={() => setActiveTab('male')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === 'male' 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              الرجالية
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-6">
            {/* Sidebar Tree */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="space-y-1">
                <CategoryTreeContext.Provider value={{
                  expandedCategories,
                  selectedCategory,
                  toggleCategory,
                  setSelectedCategory,
                  handleDeleteCategory,
                  requestMoveCategory: (cat) => {
                    setSelectedCategory(cat);
                    setShowSettings(true);
                  }
                }}>
                  {buildCategoryTree(visibleCategories).map(node => (
                    <CategoryTreeItemWrapper
                      key={node.id}
                      node={node}
                      level={0}
                    />
                  ))}
                </CategoryTreeContext.Provider>
              </div>
            </div>

            {/* Main Content */}
            <ImageGrid
              breadcrumb={breadcrumb}
              selectedCategory={selectedCategory}
              categoryImages={categoryImages}
              loading={loading}
              showSettings={showSettings}
              setShowSettings={setShowSettings}
              editNameAr={editNameAr}
              setEditNameAr={setEditNameAr}
              editNameEn={editNameEn}
              setEditNameEn={setEditNameEn}
              selectedNewParentId={selectedNewParentId}
              setSelectedNewParentId={setSelectedNewParentId}
              availableParents={availableParents}
              buildPathLabel={buildPathLabel}
              movingParent={movingParent}
              onMoveParent={async () => {
                setUiMessage(null); setUiError(null);
                try { setMovingParent(true); await reassignCategoryParent(selectedCategory!.id, selectedNewParentId); setUiMessage('تم نقل القسم بنجاح'); await loadCategories(); }
                catch(e:any){ setUiError(e?.message || 'تعذر النقل'); }
                finally { setMovingParent(false); }
              }}
              onDeleteCategory={() => handleDeleteCategory(selectedCategory!.id)}
              onUpdateCategory={async () => {
                try {
                  await updateImageCategory(selectedCategory!.id, { name: editNameAr, nameAr: editNameAr, nameEn: editNameEn });
                  setSelectedCategory({ ...selectedCategory!, name: editNameAr, nameAr: editNameAr, nameEn: editNameEn });
                  setUiMessage('تم حفظ التغييرات بنجاح');
                  setShowSettings(false);
                } catch (e:any) {
                  setUiError(e?.message || 'تعذر حفظ التعديلات');
                }
              }}
              onDeleteImage={handleDeleteImage}
              onGenerateThumbnail={handleGenerateThumbnailForImage}
              thumbnailGeneratingById={thumbnailGeneratingById}
              openImageMenu={openImageMenu}
              setOpenImageMenu={setOpenImageMenu}
              onViewImage={setViewingImage}
              onAddImage={() => setShowAddImageModal(true)}
              onClearSelection={() => { setSelectedCategory(null); resetDrillDown(); }}
            />
          </div>
        </div>
      </div>

      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onSubmit={handleAddCategory}
        rootParents={rootParents}
        loading={loading}
      />

      <AddImageModal
        isOpen={showAddImageModal}
        onClose={() => setShowAddImageModal(false)}
        categoryName={selectedCategory?.name || ''}
        onUpload={handleAddImage}
        uploadProgress={uploadProgress}
        uploadCounter={uploadCounter}
      />

      <ImageViewerModal
        image={viewingImage}
        onClose={() => setViewingImage(null)}
        categoryName={selectedCategory?.name}
        onGenerateThumbnail={handleGenerateThumbnailForImage}
        isGeneratingThumbnail={viewingImage ? !!thumbnailGeneratingById[viewingImage.id] : false}
      />

      {/* Global Toast Notification */}
      {(uiMessage || uiError) && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fadeIn">
          <div className={`px-6 py-3 rounded-full shadow-xl flex items-center gap-3 ${
            uiError 
              ? 'bg-red-600 text-white' 
              : 'bg-slate-900 text-white'
          }`}>
            <span className="text-sm font-medium">{uiError || uiMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
