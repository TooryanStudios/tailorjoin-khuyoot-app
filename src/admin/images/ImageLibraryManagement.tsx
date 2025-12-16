import React, { useState, useEffect } from 'react';
import { ImagePlus, Plus, Trash2, Edit2, Save, X, FolderPlus, Upload, MoreVertical, RefreshCw, ChevronDown, ChevronLeft, Folder, FolderOpen, Image as ImageIcon } from 'lucide-react';
import { ImageLibraryCategory, ImageLibraryItem } from '../../../types';
import {
  getImageCategories,
  addImageCategory,
  updateImageCategory,
  deleteImageCategory,
  getImagesByCategoryId,
  addImageToLibrary,
  deleteImageLibraryItem,
  updateImageLibraryItem,
  syncCategoriesFromProducts
} from '../../../services/imageLibraryService';
import { getRootImageCategories, createCategoryWithParent, reassignCategoryParent, resetCategoryParent } from '../../../services/imageLibraryService';
import { useApp } from '../../../context/AppContext';

interface CategoryTreeNode extends ImageLibraryCategory {
  children: CategoryTreeNode[];
}

interface CategoryTreeItemProps {
  node: CategoryTreeNode;
  level: number;
  expanded: boolean;
  selected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onDelete: () => void;
}

const CategoryTreeItem: React.FC<CategoryTreeItemProps> = ({ 
  node, 
  level, 
  expanded, 
  selected, 
  onToggle, 
  onSelect,
  onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const canHaveImages = node.level === 1 || !hasChildren; // السماح بالمستوى 1 أيضًا

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
          selected
            ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
        style={{ paddingRight: `${level * 1.5 + 0.75}rem` }}
      >
        {/* أيقونة التوسيع/الطي */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
          >
            {expanded ? (
              <ChevronDown size={16} className="text-slate-600 dark:text-slate-400" />
            ) : (
              <ChevronLeft size={16} className="text-slate-600 dark:text-slate-400" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* أيقونة المجلد/الصورة */}
        <div className="flex-shrink-0">
          {hasChildren ? (
            expanded ? (
              <FolderOpen size={18} className="text-amber-500" />
            ) : (
              <Folder size={18} className="text-amber-600" />
            )
          ) : (
            <ImageIcon size={18} className="text-blue-500" />
          )}
        </div>

        {/* اسم القسم */}
        <div 
          className="flex-1 min-w-0"
          onClick={canHaveImages ? onSelect : undefined}
        >
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {node.name}
          </p>
          {node.nameEn && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {node.nameEn}
            </p>
          )}
        </div>

        {/* قائمة الخيارات */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
          >
            <MoreVertical size={14} className="text-slate-400" />
          </button>
          {showMenu && (
            <div className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-700 rounded-lg shadow-xl border border-slate-200 dark:border-slate-600 z-20 min-w-[120px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete();
                }}
                className="w-full px-3 py-2 text-xs text-right text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-lg transition"
              >
                <Trash2 size={12} />
                حذف القسم
              </button>
            </div>
          )}
        </div>
      </div>

      {/* الأقسام الفرعية */}
      {hasChildren && expanded && (
        <div>
          {node.children.map(child => (
            <CategoryTreeItemWrapper
              key={child.id}
              node={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Wrapper component to connect with parent state
const CategoryTreeItemWrapper: React.FC<{ node: CategoryTreeNode; level: number }> = ({ node, level }) => {
  const parent = React.useContext(CategoryTreeContext);
  if (!parent) return null;
  
  const expanded = parent.expandedCategories.has(node.id);
  const selected = parent.selectedCategory?.id === node.id;
  
  return (
    <CategoryTreeItem
      node={node}
      level={level}
      expanded={expanded}
      selected={selected}
      onToggle={() => parent.toggleCategory(node.id)}
      onSelect={() => (node.level === 1 || !node.hasChildren) && parent.setSelectedCategory(node)}
      onDelete={() => parent.handleDeleteCategory(node.id)}
    />
  );
};

const CategoryTreeContext = React.createContext<{
  expandedCategories: Set<string>;
  selectedCategory: ImageLibraryCategory | null;
  toggleCategory: (id: string) => void;
  setSelectedCategory: (cat: ImageLibraryCategory) => void;
  handleDeleteCategory: (id: string) => void;
} | null>(null);

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

  // New category form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryNameEn, setNewCategoryNameEn] = useState('');
  const [newCategoryOrder, setNewCategoryOrder] = useState(1);
  const [newCategoryParentId, setNewCategoryParentId] = useState<string | null>(null);

  // New image form
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImageLabel, setNewImageLabel] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [openCategoryMenu, setOpenCategoryMenu] = useState<string | null>(null);
  const [openImageMenu, setOpenImageMenu] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [rootParents, setRootParents] = useState<ImageLibraryCategory[]>([]);
  const [selectedNewParentId, setSelectedNewParentId] = useState<string | null>(null);
  const [movingParent, setMovingParent] = useState(false);
  const [uiMessage, setUiMessage] = useState<string | null>(null);
  const [uiError, setUiError] = useState<string | null>(null);

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
    const categoryMap = new Map<string, CategoryTreeNode>();
    
    // تحويل جميع الأقسام إلى عقد
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });
    
    const tree: CategoryTreeNode[] = [];
    
    // بناء الشجرة
    categories.forEach(cat => {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          tree.push(node);
        }
      } else {
        tree.push(node);
      }
    });
    
    return tree;
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

  // Compute flat leaf categories and filter by tab
  const leafCategories = React.useMemo(() => {
    const leaves = categories.filter(c => !c.hasChildren);
    if (activeTab === 'all') return leaves;
    return leaves.filter(c => {
      const rootName = getRootAncestorName(c) || '';
      if (activeTab === 'female') {
        return /نسائ|النسائية|حري/i.test(rootName);
      }
      if (activeTab === 'male') {
        return /رجال|الرجالية|رجالي/i.test(rootName);
      }
      return true;
    });
  }, [categories, activeTab]);

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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryNameEn.trim()) {
      alert('يرجى ملء جميع الحقول');
      return;
    }

    const chosenParent = newCategoryParentId ?? selectedLevel1Id ?? selectedLevel0Id ?? null;
    console.debug('[ImageLibrary] createCategoryWithParent debug', {
      newCategoryName,
      newCategoryNameEn,
      selectedLevel0Id,
      selectedLevel1Id,
      chosenParent
    });
    try {
      setLoading(true);
      await createCategoryWithParent(newCategoryName, { nameEn: newCategoryNameEn || undefined, parentId: chosenParent });
      
      setNewCategoryName('');
      setNewCategoryNameEn('');
      setNewCategoryOrder(1);
      setShowAddCategoryModal(false);
      setNewCategoryParentId(null);
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

  const handleAddImage = async () => {
    if (!selectedCategory || !newImageFile || !newImageLabel.trim()) {
      alert('يرجى ملء جميع الحقول واختيار صورة');
        {/* Debug Panel */}
        <div className="mb-3 p-3 rounded-lg border border-dashed border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-800 dark:text-blue-200">
          <div className="font-bold mb-1">DEBUG: ImageLibrary</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>selectedLevel0Id: <span className="font-mono">{selectedLevel0Id || 'null'}</span></div>
            <div>selectedLevel1Id: <span className="font-mono">{selectedLevel1Id || 'null'}</span></div>
            <div>newCategoryName: <span className="font-mono">{newCategoryName || '-'}</span></div>
            <div>newCategoryNameEn: <span className="font-mono">{newCategoryNameEn || '-'}</span></div>
            <div>chosenParent (on create): <span className="font-mono">{(selectedLevel1Id || selectedLevel0Id) || 'null'}</span></div>
          </div>
        </div>
      return;
    }

    console.log('🚀 بدء رفع الصورة:', {
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      fileName: newImageFile.name,
      label: newImageLabel
    });

    try {
      setUploadProgress(true);
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">الأب (اختياري)</label>
                  <select
                    value={newCategoryParentId ?? ''}
                    onChange={(e) => setNewCategoryParentId(e.target.value || null)}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md"
                  >
                    <option value="">بدون أب — مستوى 0</option>
                    {rootParents
                      .filter(r => !r.isImmutable && !/(الأزياء|Fashion)/i.test(r.nameAr || r.name || ''))
                      .map(r => (
                        <option key={r.id} value={r.id}>{r.nameAr || r.name}</option>
                      ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">يمكنك اختيار أب صريح أو تركه فارغاً ليكون على المستوى 0.</p>
                </div>

      const uploaderId = user?.id || 'admin'; // استخدام 'admin' كقيمة افتراضية
      
      console.log('📤 استدعاء addImageToLibrary...');
      const imageId = await addImageToLibrary(
        selectedCategory.id,
        newImageFile,
        newImageLabel,
        uploaderId
      );
      console.log('✅ تم رفع الصورة بنجاح! ID:', imageId);
      
      // إعادة تحميل الصور لإظهار الصورة الجديدة
      console.log('🔄 إعادة تحميل الصور...');
      await loadCategoryImages(selectedCategory.id);
      console.log('✅ تم إعادة تحميل الصور');
      
      // تنظيف البيانات
      setNewImageFile(null);
      setNewImageLabel('');
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
      }
      setShowAddImageModal(false);
      
      alert('تم إضافة الصورة بنجاح!');
    } catch (error) {
      console.error('❌ خطأ في إضافة الصورة:', error);
      alert('فشل إضافة الصورة: ' + (error as Error).message);
    } finally {
      setUploadProgress(false);
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
                    {/* Parent management for selected leaf category */}
                    {selectedCategory && (
                      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                          <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">الأب الجديد (اختياري)</label>
                            <select value={selectedNewParentId ?? ''} onChange={e=>setSelectedNewParentId(e.target.value || null)} className="w-full px-2 py-1 border rounded">
                              <option value="">بدون أب — مستوى 0</option>
                              {rootParents
                                .filter(p => !p.isImmutable && !/(الأزياء|Fashion)/i.test(p.nameAr || p.name || ''))
                                .map(p => (
                                  <option key={p.id} value={p.id}>{p.nameAr || p.name}</option>
                                ))}
                            </select>
                          </div>
                          <button
                            onClick={async () => {
                              setUiMessage(null); setUiError(null);
                              try { setMovingParent(true); await reassignCategoryParent(selectedCategory.id, selectedNewParentId); setUiMessage('تم نقل القسم'); }
                              catch(e:any){ setUiError(e?.message || 'تعذر النقل'); }
                              finally { setMovingParent(false); }
                            }}
                            className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded"
                            disabled={movingParent}
                          >{movingParent ? 'جارٍ النقل...' : 'نقل إلى الأب'}</button>
                          <button
                            onClick={async () => {
                              setUiMessage(null); setUiError(null);
                              try { setMovingParent(true); await resetCategoryParent(selectedCategory.id); setUiMessage('تمت إعادة التعيين لمستوى 0'); }
                              catch(e:any){ setUiError(e?.message || 'تعذر إعادة التعيين'); }
                              finally { setMovingParent(false); }
                            }}
                            className="px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded"
                            disabled={movingParent}
                          >{movingParent ? 'جارٍ التعيين...' : 'إعادة تعيين الأب'}</button>
                        </div>
                        {(uiMessage || uiError) && (
                          <div className={`mt-2 text-xs ${uiError ? 'text-red-700' : 'text-green-700'}`}>{uiError || uiMessage}</div>
                        )}
                      </div>
                    )}
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
          {/* Categories Section - cascading filters */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            {loading && categories.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">جاري التحميل...</p>
            ) : (
              <>
                {/* Container #2: Broad categories (Men/Women/Kids) with "All" option */}
                {level0Categories.length > 0 && (
                  <div className="px-3 py-2 mb-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => { 
                          console.log('🔵 [Container #2] الجميع - عرض كل الأقسام من level0Categories');
                          setSelectedLevel0Id(null); setSelectedLevel1Id(null); setSelectedCategory(null); 
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
                            console.log('🔵 [Container #2]', cat.name, '| ID:', cat.id, '| Level:', cat.level, '| Source: level0Categories (productCategories where level=0)');
                            setSelectedLevel0Id(cat.id); setSelectedLevel1Id(null); setSelectedCategory(null); 
                          }}
                          className={`shrink-0 px-3 py-1.5 text-xs rounded-md border transition ${
                            selectedLevel0Id === cat.id 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-blue-50'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Container #3: Specific types (Dishdasha/Wizar/etc) - appears after Container #2 selection */}
                {selectedLevel0Id && level1Categories.length > 0 && (
                  <div className="px-3 py-2 mb-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => { 
                          console.log('🟡 [Container #3] الجميع - عرض كل الأقسام الفرعية من level1Categories | Parent:', selectedLevel0Id);
                          setSelectedLevel1Id(null); setSelectedCategory(null); 
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
                            console.log('🟡 [Container #3]', cat.name, '| ID:', cat.id, '| Level:', cat.level, '| Parent:', cat.parentId, '| Source: level1Categories (filtered by selectedLevel0Id)');
                            setSelectedLevel1Id(cat.id); setSelectedCategory(cat); 
                          }}
                          className={`shrink-0 px-3 py-1.5 text-xs rounded-md border transition ${
                            selectedLevel1Id === cat.id 
                              ? 'bg-amber-500 text-white border-amber-500' 
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-amber-50'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Final items grid - shows after level selection */}
                {(selectedLevel1Id || selectedLevel0Id) && (
                  <div>
                    <div className="mb-2">
                      <span className="text-xs text-slate-500">الأقسام النهائية</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {(selectedLevel1Id
                        ? categories.filter(c => c.parentId === selectedLevel1Id && !c.hasChildren)
                        : leafCategories
                      ).map(finalCat => (
                        <button
                          key={finalCat.id}
                          onClick={() => {
                            console.log('🟢 [Final Grid]', finalCat.name, '| ID:', finalCat.id, '| Level:', finalCat.level, '| Parent:', finalCat.parentId, '| Source:', selectedLevel1Id ? 'categories.filter(parentId === selectedLevel1Id)' : 'leafCategories (all !hasChildren)');
                            setSelectedCategory(finalCat);
                          }}
                          className={`p-3 rounded-lg text-right transition-all ${
                            selectedCategory?.id === finalCat.id
                              ? 'bg-blue-500 text-white shadow-lg scale-105'
                              : 'bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <ImageIcon size={14} className={selectedCategory?.id === finalCat.id ? 'text-white' : 'text-blue-500'} />
                            <span className="text-sm font-medium truncate">{finalCat.name}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedCategory?.id === finalCat.id ? 'bg-blue-600 text-blue-100' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`}>Level {finalCat.level ?? 0}</span>
                            {finalCat.isImmutable && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedCategory?.id === finalCat.id ? 'bg-red-600 text-red-100' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>مقفل</span>
                            )}
                            <span className={`ml-auto text-[10px] font-mono ${selectedCategory?.id === finalCat.id ? 'text-blue-100' : 'text-slate-400'}`}>{finalCat.id}</span>
                          </div>
                          {finalCat.nameEn && (
                            <p className={`text-xs truncate ${selectedCategory?.id === finalCat.id ? 'text-blue-100' : 'text-slate-500'}`}>
                              {finalCat.nameEn}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Breadcrumb + Images Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            {/* Breadcrumb */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
                {breadcrumb}
              </div>
              {(selectedLevel0Id || selectedLevel1Id || selectedCategory) && (
                <button onClick={() => { setSelectedCategory(null); resetDrillDown(); }} className="text-xs text-blue-600 hover:underline">
                  مسح الاختيار
                </button>
              )}
            </div>
            {selectedCategory ? (
              <>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {selectedCategory.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {categoryImages.length} صورة
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddImageModal(true)}
                    className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Upload size={16} />
                    رفع صورة
                  </button>
                </div>

                {/* Edit/Delete/Parent Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <label className="flex flex-col">
                    <span className="text-xs">اسم القسم (عربي)</span>
                    <input value={editNameAr} onChange={e=>setEditNameAr(e.target.value)} className="border rounded px-2 py-1" />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-xs">اسم القسم (إنجليزي)</span>
                    <input value={editNameEn} onChange={e=>setEditNameEn(e.target.value)} className="border rounded px-2 py-1" />
                  </label>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await updateImageCategory(selectedCategory.id, { name: editNameAr, nameAr: editNameAr, nameEn: editNameEn });
                          setSelectedCategory({ ...selectedCategory, name: editNameAr, nameAr: editNameAr, nameEn: editNameEn });
                        } catch (e:any) {
                          alert(e?.message || 'تعذر حفظ التعديلات');
                        }
                      }}
                      className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                    >حفظ</button>
                    <button
                      onClick={async () => {
                        if (!confirm('تأكيد حذف القسم؟ سيتم حذف الصور المرتبطة.')) return;
                        await handleDeleteCategory(selectedCategory.id);
                      }}
                      className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                    >حذف</button>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs mb-1">تعيين أب جديد (أي قسم موجود، باستثناء الأزياء)</label>
                    <div className="flex gap-2 items-end">
                      <select value={selectedNewParentId ?? ''} onChange={e=>setSelectedNewParentId(e.target.value || null)} className="border rounded px-2 py-1">
                        <option value="">بدون أب — مستوى 0</option>
                        {availableParents.map(p => (
                          <option key={p.id} value={p.id}>{buildPathLabel(p)}</option>
                        ))}
                      </select>
                      <button
                        onClick={async () => {
                          setUiMessage(null); setUiError(null);
                          try { setMovingParent(true); await reassignCategoryParent(selectedCategory.id, selectedNewParentId); setUiMessage('تم تعيين الأب'); await loadCategories(); }
                          catch(e:any){ setUiError(e?.message || 'تعذر التعيين'); }
                          finally { setMovingParent(false); }
                        }}
                        className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded"
                        disabled={movingParent}
                      >{movingParent ? 'جارٍ التعين...' : 'تعيين الأب'}</button>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">جاري التحميل...</p>
                  </div>
                ) : categoryImages.length === 0 ? (
                  <div className="text-center py-12">
                    <ImagePlus size={48} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                      لا توجد صور في هذا القسم
                    </p>
                    <button
                      onClick={() => setShowAddImageModal(true)}
                      className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm"
                    >
                      إضافة صورة
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {categoryImages.map(image => (
                      <div
                        key={image.id}
                        className="group relative aspect-[3/4] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-purple-400 hover:shadow-lg transition"
                      >
                        <img
                          src={image.imageUrl}
                          alt={image.label}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* زر القائمة في الأعلى */}
                        <div className="absolute top-2 left-2 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenImageMenu(openImageMenu === image.id ? null : image.id);
                            }}
                            className="p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-md transition"
                          >
                            <MoreVertical size={14} className="text-white" />
                          </button>
                          {openImageMenu === image.id && (
                            <div className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-700 rounded-lg shadow-xl border border-slate-200 dark:border-slate-600 min-w-[120px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenImageMenu(null);
                                  handleDeleteImage(image.id);
                                }}
                                className="w-full px-3 py-2 text-xs text-right text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-lg transition"
                              >
                                <Trash2 size={12} />
                                حذف الصورة
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                          <p className="text-white text-[10px] line-clamp-2 leading-tight">{image.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <ImagePlus size={40} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    اختر قسماً لعرض الصور
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">إضافة قسم جديد</h3>
              <button onClick={() => setShowAddCategoryModal(false)}>
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  اسم القسم (عربي) *
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="مثال: دشداشات"
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  اسم القسم (إنجليزي) *
                </label>
                <input
                  type="text"
                  value={newCategoryNameEn}
                  onChange={(e) => setNewCategoryNameEn(e.target.value)}
                  placeholder="مثال: dishdasha"
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ترتيب العرض
                </label>
                <input
                  type="number"
                  value={newCategoryOrder}
                  onChange={(e) => setNewCategoryOrder(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">الأب (اختياري)</label>
                <select
                  value={(selectedLevel1Id || selectedLevel0Id) ?? ''}
                  onChange={() => {}}
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md"
                >
                  <option value="">بدون أب — مستوى 0</option>
                  {rootParents.map(r => (
                    <option key={r.id} value={r.id}>{r.nameAr || r.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">سيتم استخدام الاختيار في المستوى أعلاه كأب للقسم.</p>
              </div>

              <button
                onClick={handleAddCategory}
                disabled={loading}
                className="w-full py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50"
              >
                {loading ? 'جاري الإضافة...' : 'إضافة القسم'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Image Modal */}
      {showAddImageModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate flex-1">
                إضافة صورة إلى {selectedCategory.name}
              </h3>
              <button onClick={() => {
                setShowAddImageModal(false);
                setNewImageFile(null);
                setNewImageLabel('');
                if (imagePreviewUrl) {
                  URL.revokeObjectURL(imagePreviewUrl);
                  setImagePreviewUrl(null);
                }
              }}>
                <X size={18} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  اختر صورة *
                </label>
                <input
                  key={imagePreviewUrl || 'file-input'}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    console.log('📁 تم اختيار ملف:', file?.name, file?.type, file?.size);
                    
                    setNewImageFile(file);
                    
                    // إنشاء معاينة base64 بدلاً من blob لتجنب مشاكل CSP
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64 = reader.result as string;
                        console.log('🖼️ تم إنشاء معاينة base64');
                        setImagePreviewUrl(base64);
                      };
                      reader.readAsDataURL(file);
                    } else {
                      setImagePreviewUrl(null);
                    }
                  }}
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-200 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-200"
                />
              </div>
              
              {newImageFile && imagePreviewUrl && (
                <div className="animate-fadeIn">
                  <div className="flex items-center gap-2 mb-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                    <p className="text-xs text-green-700 dark:text-green-300 truncate flex-1">
                      {newImageFile.name}
                    </p>
                    <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded flex-shrink-0">
                      {(newImageFile.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <div className="relative rounded-lg overflow-hidden border-2 border-green-300 dark:border-green-700 shadow-lg">
                    <img
                      key={imagePreviewUrl}
                      src={imagePreviewUrl}
                      alt="Preview"
                      className="w-full h-56 object-contain bg-slate-100 dark:bg-slate-900"
                      onLoad={() => console.log('✅ تم تحميل صورة المعاينة')}
                      onError={() => console.error('❌ خطأ في تحميل صورة المعاينة')}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  وصف الصورة *
                </label>
                <textarea
                  value={newImageLabel}
                  onChange={(e) => setNewImageLabel(e.target.value)}
                  placeholder="مثال: دشداشة بيضاء كلاسيكية"
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md resize-none"
                />
              </div>

              <button
                onClick={handleAddImage}
                disabled={uploadProgress}
                className="w-full py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium disabled:opacity-50"
              >
                {uploadProgress ? 'جاري الرفع...' : 'إضافة الصورة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
