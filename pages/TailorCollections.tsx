
import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, DollarSign, Clock, Image as ImageIcon, Trash2, RefreshCw, Edit, Save, X, Grid, List, LayoutGrid, Star, ImagePlus, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '../components/Button';
import { firebaseService } from '../services/firebase';
import { storageService } from '../services/storageService';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { storage } from '../services/firebase';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { getActiveOrdersForProduct } from '../services/orderService';
import { getDefaultImagesForCategory, type DefaultImageOption } from '../utils/defaultImages';
import { useAppStore } from '../src/store/useAppStore';
import { preloadImages } from '../src/utils/imagePreloader';
import { StableImage } from '../src/components/StableImage';

type UploadItemStatus = 'queued' | 'compressing' | 'uploading' | 'done' | 'error';
type SaveJobStatus = 'uploading' | 'saving' | 'done' | 'error';

type UploadItem = {
  id: string;
  fileName: string;
  status: UploadItemStatus;
  progress: number; // 0..100
  error?: string;
};

type SaveJob = {
  id: string;
  title: string;
  status: SaveJobStatus;
  createdAt: number;
  items: UploadItem[];
  message?: string;
};

const UploadJobsPanel = React.memo(function UploadJobsPanel(props: {
  jobs: SaveJob[];
  onDismiss: (jobId: string) => void;
}) {
  if (props.jobs.length === 0) return null;

  const activeJobs = props.jobs
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-bold text-slate-900 dark:text-white">عمليات الرفع والحفظ</div>
        <div className="text-xs text-slate-500">{props.jobs.length} عملية</div>
      </div>

      <div className="mt-3 space-y-3">
        {activeJobs.map((job) => {
          const total = job.items.length;
          const done = job.items.filter((i) => i.status === 'done').length;
          const uploading = job.items.find((i) => i.status === 'uploading' || i.status === 'compressing');
          const overall = total === 0 ? 100 : Math.round(job.items.reduce((s, i) => s + (i.progress || 0), 0) / total);

          const statusLabel =
            job.status === 'done'
              ? 'تم'
              : job.status === 'error'
                ? 'خطأ'
                : job.status === 'saving'
                  ? 'حفظ المنتج…'
                  : 'رفع الصور…';

          return (
            <div key={job.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{job.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {statusLabel} • {done}/{total}
                    {uploading ? ` • ${uploading.fileName}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => props.onDismiss(job.id)}
                  className="shrink-0 p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                  title="إخفاء"
                >
                  <X size={16} className="text-slate-500" />
                </button>
              </div>

              <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className={`h-full transition-all ${job.status === 'error' ? 'bg-red-500' : job.status === 'done' ? 'bg-green-600' : 'bg-blue-600'}`}
                  style={{ width: `${overall}%` }}
                />
              </div>

              {(job.message || job.status === 'error') && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400">{job.message || 'حدث خطأ أثناء العملية'}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export const TailorCollections = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const tailorProducts = useAppStore((state) => state.tailorProducts);
  const setTailorProducts = useAppStore((state) => state.setTailorProducts);
  const viewMode = useAppStore((state) => state.tailorViewMode);
  const setViewMode = useAppStore((state) => state.setTailorViewMode);
  const myProducts = tailorProducts;
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'published' | 'drafts'>('all');
  const [bulkMode, setBulkMode] = useState(false); // Quick add mode

  const productsQuery = useQuery({
    queryKey: ['tailor-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as Product[];
      return firebaseService.getProductsByTailorId(user.id);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15, // Keep in cache 15min instead of default 5min
    onSuccess: (data) => {
      preloadImages(data.slice(0, 5).map((p) => p.image));
    },
  });

  useEffect(() => {
    if (productsQuery.data) {
      setTailorProducts(productsQuery.data);
      setInitialLoading(false);
    }
  }, [productsQuery.data, setTailorProducts]);

  useEffect(() => {
    if (productsQuery.isFetched && !productsQuery.isLoading) {
      setInitialLoading(false);
    }
  }, [productsQuery.isFetched, productsQuery.isLoading]);

  // **NEW: Cache-First Logic**
  // Only show loading skeleton if NO data exists (initial load)
  // If data exists, show it immediately during background refetch
  const shouldShowLoadingSpinner = initialLoading && !productsQuery.data;

  const refreshProducts = React.useCallback(async () => {
    setRefreshing(true);
    const result = await productsQuery.refetch();
    if (result.data) {
      setTailorProducts(result.data);
    }
    setRefreshing(false);
  }, [productsQuery, setTailorProducts]);
  
  // Scroll state for filter tabs
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const [filtersScrollable, setFiltersScrollable] = useState(false);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('');
  const [allProductImages, setAllProductImages] = useState<string[]>([]); // Array of all product images
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([]); // Files waiting to be uploaded on submit
  const [pendingBlobUrls, setPendingBlobUrls] = useState<string[]>([]); // Maps 1:1 with pendingImageFiles
  const [uploadError, setUploadError] = useState<string>('');
  const [coverImageIndex, setCoverImageIndex] = useState<number>(0); // index صورة الغلاف
  const [showDefaultImagesModal, setShowDefaultImagesModal] = useState(false); // modal الصور الافتراضية
  const [libraryImages, setLibraryImages] = useState<DefaultImageOption[]>([]); // صور المكتبة
  const [loadingLibrary, setLoadingLibrary] = useState(false); // تحميل صور المكتبة
  const [availableCategories, setAvailableCategories] = useState<Array<{
    id: string;
    nameEn: string;
    nameAr: string;
    nameEnOriginal?: string;
    image?: string;
    parentName?: string;
    isParent?: boolean;
  }>>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false); // modal اختيار التصنيف
  const [uploadJobs, setUploadJobs] = useState<SaveJob[]>([]);
  const [isImageDragOver, setIsImageDragOver] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);

  const groupedCategoryOptions = React.useMemo(() => {
    const groups = new Map<string, Array<{ id: string; nameAr: string; image?: string }>>();
    let currentGroupName = '';
    for (const cat of availableCategories) {
      if (cat.isParent) {
        currentGroupName = cat.nameAr;
        if (!groups.has(currentGroupName)) groups.set(currentGroupName, []);
        continue;
      }
      const groupName = cat.parentName || currentGroupName || 'تصنيفات';
      if (!groups.has(groupName)) groups.set(groupName, []);
      groups.get(groupName)!.push({ id: cat.id, nameAr: cat.nameAr, image: cat.image });
    }

    const q = categorySearch.trim().toLowerCase();
    const result: Array<{ groupName: string; children: Array<{ id: string; nameAr: string; image?: string }> }> = [];
    for (const [groupName, children] of groups.entries()) {
      const filtered = q
        ? children.filter((c) => c.nameAr.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
        : children;
      if (filtered.length > 0) result.push({ groupName, children: filtered });
    }
    return result;
  }, [availableCategories, categorySearch]);

  // تصفية المنتجات حسب filterMode
  const filteredProducts = React.useMemo(() => {
    return myProducts.filter(p => {
      if (filterMode === 'drafts') return p.isDraft === true;
      if (filterMode === 'published') return !p.isDraft;
      return true; // 'all'
    });
  }, [myProducts, filterMode]);

  // جلب التصنيفات الهرمية من productCategories
  const loadCategories = async () => {
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      
      // تحديد جنس الخياط من user (تحقق من tailorGender أولاً ثم specialization كبديل)
      let tailorGender: 'male' | 'female' = 'male'; // الافتراضي
      
      if (user?.tailorGender) {
        tailorGender = user.tailorGender;
      } else if (user?.specialization) {
        // Fallback: check specialization field for old data
        const spec = String(user.specialization).toLowerCase();
        if (spec.includes('female') || spec.includes('نسائي') || spec.includes('women')) {
          tailorGender = 'female';
        }
      }
      
      console.log('🔍 [TailorCollections] Loading categories for gender:', tailorGender);
      console.log('   User:', user?.name);
      console.log('   tailorGender field:', user?.tailorGender);
      console.log('   specialization field:', user?.specialization);
      
      if (!user?.tailorGender && !user?.specialization) {
        console.warn('⚠️ لم يتم تحديد جنس الخياط، سيتم عرض التصنيفات الرجالية (افتراضي)');
      } else if (!user?.tailorGender && user?.specialization) {
        console.warn('⚠️ استخدام حقل specialization كبديل لـ tailorGender');
      }
      
      const categoriesRef = collection(db, 'productCategories');
      
      // جلب التصنيفات Level 1 (الآباء) من نوع fashion
      const level1Query = query(
        categoriesRef,
        where('level', '==', 1),
        where('categoryType', '==', 'fashion')
      );
      const level1Snapshot = await getDocs(level1Query);
      const parentCategories = new Map();
      
      console.log('📦 Found', level1Snapshot.size, 'Level 1 categories');
      
      level1Snapshot.docs.forEach(doc => {
        const data = doc.data();
        const nameAr = data.nameAr;
        
        console.log('  - Checking category:', nameAr);
        
        // فلترة حسب جنس الخياط
        if (tailorGender === 'male' && nameAr === 'الملابس النسائية') {
          console.log('    ❌ Skipped (female category for male tailor)');
          return; // تجاهل التصنيفات النسائية للخياط الرجالي
        }
        if (tailorGender === 'female' && nameAr === 'الملابس الرجالية') {
          console.log('    ❌ Skipped (male category for female tailor)');
          return; // تجاهل التصنيفات الرجالية للخياط النسائي
        }
        
        console.log('    ✅ Included');
        parentCategories.set(doc.id, {
          id: doc.id,
          nameAr: data.nameAr,
          nameEn: data.nameEn
        });
      });
      
      console.log('✅ Filtered parent categories:', parentCategories.size);
      
      // جلب التصنيفات Level 2 (الأبناء)
      const level2Query = query(
        categoriesRef,
        where('level', '==', 2),
        where('categoryType', '==', 'fashion')
      );
      const level2Snapshot = await getDocs(level2Query);
      
      // تجميع التصنيفات حسب الأب (فقط الآباء المفلترين)
      const categoriesByParent = new Map<string, any[]>();
      
      level2Snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data.nameAr && !data.nameEn) return;
        
        const parentId = data.parentId;
        
        // فقط الأطفال الذين آباؤهم في القائمة المفلترة
        if (!parentCategories.has(parentId)) return;
        
        if (!categoriesByParent.has(parentId)) {
          categoriesByParent.set(parentId, []);
        }
        
        categoriesByParent.get(parentId)?.push({
          id: doc.id, // معرف التصنيف الفريد
          nameEn: data.nameAr || data.nameEn,
          nameAr: data.nameAr || data.nameEn,
          nameEnOriginal: data.nameEn,
          image: data.image,
          parentName: parentCategories.get(parentId)?.nameAr
        });
      });
      
      // بناء القائمة الهرمية
      const hierarchicalList: any[] = [];
      
      parentCategories.forEach((parent, parentId) => {
        const children = categoriesByParent.get(parentId) || [];
        if (children.length > 0) {
          // إضافة الأب كعنوان
          hierarchicalList.push({
            id: `parent_${parentId}`,
            nameEn: `parent_${parentId}`,
            nameAr: parent.nameAr,
            isParent: true
          });
          
          // إضافة الأبناء مرتبين أبجدياً
          children.sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));
          hierarchicalList.push(...children);
        }
      });
      
      console.log('📋 التصنيفات الهرمية المحملة:', hierarchicalList.length, 'items');
      console.log('📋 Categories:', hierarchicalList.map(c => c.nameAr).join(', '));
      setAvailableCategories(hierarchicalList);
      
      // تعيين أول قسم فرعي كافتراضي
      const firstChild = hierarchicalList.find(cat => !cat.isParent);
      if (firstChild && !newCategory) {
        setNewCategory(firstChild.id); // استخدام ID بدلاً من nameEn
      }
    } catch (error) {
      console.error('خطأ في جلب التصنيفات:', error);
    }
  };

  // جلب منتجات الخياط عند تحميل الصفحة
  useEffect(() => {
    if (user?.id) {
      loadCategories();
    }
  }, [user?.id]);

  // تحميل صور المكتبة عند فتح modal
  useEffect(() => {
    if (showDefaultImagesModal) {
      loadLibraryImages();
    }
  }, [showDefaultImagesModal, newCategory]);

  // تحديث الأقسام عند فتح نموذج إضافة منتج
  useEffect(() => {
    if (showAddForm) {
      loadCategories();
    }
  }, [showAddForm]);

  // Auto-fill product name when category matches
  useEffect(() => {
    if (newCategory) {
      const cat = availableCategories.find(c => c.id === newCategory);
      if (cat && cat.nameAr) {
        // Only set if empty to avoid overwriting user input
        if (newName.trim() === '') {
           setNewName(cat.nameAr);
        }
      }
    }
  }, [newCategory, availableCategories]);

  // Check scroll position for filter tabs
  const checkFilterScroll = () => {
    const element = filterScrollRef.current;
    if (!element) return;

    const hasOverflow = element.scrollWidth > element.clientWidth + 2;
    setFiltersScrollable(hasOverflow);
  };

  // Update scroll arrows when products load or window resizes
  useEffect(() => {
    checkFilterScroll();
    window.addEventListener('resize', checkFilterScroll);
    return () => window.removeEventListener('resize', checkFilterScroll);
  }, [myProducts]);

  // Scroll filter tabs container
  const scrollFilters = (direction: 'left' | 'right') => {
    const element = filterScrollRef.current;
    if (!element) return;

    const scrollAmount = 200;
    const isRTL = getComputedStyle(element).direction === 'rtl';
    const directionFactor = direction === 'right' ? 1 : -1;
    const rtlFactor = isRTL ? -1 : 1;
    const delta = scrollAmount * directionFactor * rtlFactor;

    element.scrollBy({
      left: delta,
      behavior: 'smooth'
    });

    setTimeout(checkFilterScroll, 200);
  };

  const loadLibraryImages = async () => {
    setLoadingLibrary(true);
    console.log('🔍 تحميل صور المكتبة للقسم:', newCategory);
    try {
      const images = await getDefaultImagesForCategory(newCategory);
      console.log('📸 عدد الصور المحملة:', images.length, images);
      setLibraryImages(images);
    } catch (error) {
      console.error('❌ خطأ في تحميل صور المكتبة:', error);
      setLibraryImages([]);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const dismissUploadJob = React.useCallback((jobId: string) => {
    setUploadJobs((prev) => prev.filter((j) => j.id !== jobId));
  }, []);

  const addImageFilesToForm = React.useCallback(
    (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length === 0) return;

      const totalImages = allProductImages.length + pendingImageFiles.length;
      const remainingSlots = 10 - totalImages;
      const filesToAdd = imageFiles.slice(0, Math.max(0, remainingSlots));

      if (filesToAdd.length === 0) {
        alert('وصلت للحد الأقصى (10 صور)');
        return;
      }

      if (imageFiles.length > remainingSlots) {
        alert(`يمكنك رفع ${remainingSlots} صور فقط`);
      }

      const blobUrls = filesToAdd.map((file) => URL.createObjectURL(file));
      setPendingImageFiles((prev) => [...prev, ...filesToAdd]);
      setPendingBlobUrls((prev) => [...prev, ...blobUrls]);
      setAllProductImages((prev) => [...prev, ...blobUrls]);
      setUploadError('');
    },
    [allProductImages.length, pendingImageFiles.length]
  );

  const reorderImages = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      if (fromIndex < 0 || toIndex < 0) return;
      if (fromIndex >= allProductImages.length || toIndex >= allProductImages.length) return;

      const currentBlobUrls = pendingBlobUrls;
      const currentFiles = pendingImageFiles;
      const fileByBlob = new Map<string, File>();
      for (let i = 0; i < currentBlobUrls.length; i++) {
        const blobUrl = currentBlobUrls[i];
        const file = currentFiles[i];
        if (blobUrl && file) fileByBlob.set(blobUrl, file);
      }

      const nextImages = allProductImages.slice();
      const [moved] = nextImages.splice(fromIndex, 1);
      nextImages.splice(toIndex, 0, moved);

      // Rebuild pending lists from nextImages order
      const nextPendingBlobUrls = nextImages.filter((u) => u.startsWith('blob:'));
      const nextPendingFiles = nextPendingBlobUrls.map((u) => fileByBlob.get(u)).filter(Boolean) as File[];

      setAllProductImages(nextImages);
      setPendingBlobUrls(nextPendingBlobUrls);
      setPendingImageFiles(nextPendingFiles);

      // Adjust cover index
      setCoverImageIndex((prev) => {
        if (prev === fromIndex) return toIndex;
        // moving item from left to right
        if (fromIndex < toIndex) {
          if (prev > fromIndex && prev <= toIndex) return prev - 1;
          return prev;
        }
        // moving item from right to left
        if (toIndex <= prev && prev < fromIndex) return prev + 1;
        return prev;
      });
    },
    [allProductImages, pendingBlobUrls, pendingImageFiles]
  );

  const createSaveJob = React.useCallback((title: string, files: File[]): SaveJob => {
    const jobId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return {
      id: jobId,
      title,
      status: 'uploading',
      createdAt: Date.now(),
      items: files.map((f, idx) => ({
        id: `${jobId}_${idx}`,
        fileName: f.name,
        status: 'queued',
        progress: 0,
      })),
    };
  }, []);

  const updateJob = React.useCallback(
    (jobId: string, updater: (prev: SaveJob) => SaveJob) => {
      setUploadJobs((prev) => prev.map((j) => (j.id === jobId ? updater(j) : j)));
    },
    []
  );

  const uploadPendingImagesPreservingOrderWithProgress = React.useCallback(
    async (params: {
      jobId: string;
      userId: string;
      images: string[];
      pendingFiles: File[];
      pendingBlobs: string[];
    }) => {
      const { jobId, userId, images, pendingFiles, pendingBlobs } = params;
      if (images.length === 0 && pendingFiles.length === 0) return [] as string[];

      const fileByBlob = new Map<string, File>();
      for (let i = 0; i < pendingBlobs.length; i++) {
        const blobUrl = pendingBlobs[i];
        const file = pendingFiles[i];
        if (blobUrl && file) fileByBlob.set(blobUrl, file);
      }

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const finalUrls: string[] = [];
      const blobUrlsInOrder = images.filter((u) => u.startsWith('blob:'));
      const blobIndexByUrl = new Map<string, number>();
      blobUrlsInOrder.forEach((u, idx) => blobIndexByUrl.set(u, idx));

      for (const url of images) {
        if (!url.startsWith('blob:')) {
          finalUrls.push(url);
          continue;
        }

        const file = fileByBlob.get(url);
        if (!file) continue;

        const itemIndex = blobIndexByUrl.get(url) ?? 0;
        const itemId = `${jobId}_${itemIndex}`;

        updateJob(jobId, (prevJob) => {
          const items = prevJob.items.map((it) => (it.id === itemId ? { ...it, status: 'compressing', progress: 0 } : it));
          return { ...prevJob, items };
        });

        const compressedFile = await imageCompression(file, options);
        const uniqueId = `${Date.now()}_${itemIndex}_${Math.random().toString(36).substring(7)}`;
        const storageRef = ref(storage, `products/${userId}/${uniqueId}_${file.name}`);

        const uploadedUrl = await new Promise<string>((resolve, reject) => {
          const task = uploadBytesResumable(storageRef, compressedFile);

          updateJob(jobId, (prevJob) => {
            const items = prevJob.items.map((it) => (it.id === itemId ? { ...it, status: 'uploading', progress: 0 } : it));
            return { ...prevJob, items };
          });

          task.on(
            'state_changed',
            (snapshot) => {
              const progress = snapshot.totalBytes ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
              updateJob(jobId, (prevJob) => {
                const items = prevJob.items.map((it) => (it.id === itemId ? { ...it, progress } : it));
                return { ...prevJob, items };
              });
            },
            (err) => reject(err),
            async () => {
              try {
                const url = await getDownloadURL(task.snapshot.ref);
                resolve(url);
              } catch (e) {
                reject(e);
              }
            }
          );
        });

        updateJob(jobId, (prevJob) => {
          const items = prevJob.items.map((it) => (it.id === itemId ? { ...it, status: 'done', progress: 100 } : it));
          return { ...prevJob, items };
        });

        finalUrls.push(uploadedUrl);
      }

      // Safety: append any pending files that are not represented by blob previews
      const remaining = pendingFiles.filter((f) => !Array.from(fileByBlob.values()).includes(f));
      for (const file of remaining) {
        const compressedFile = await imageCompression(file, options);
        const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const storageRef = ref(storage, `products/${userId}/${uniqueId}_${file.name}`);
        await uploadBytes(storageRef, compressedFile);
        const uploadedUrl = await getDownloadURL(storageRef);
        finalUrls.push(uploadedUrl);
      }

      return finalUrls;
    },
    [updateJob]
  );

  const runAddOrUpdateJob = React.useCallback(
    async (params: {
      title: string;
      userId: string;
      images: string[];
      pendingFiles: File[];
      pendingBlobs: string[];
      buildAndSave: (uploadedUrls: string[]) => Promise<void>;
    }) => {
      const blobUrlsInOrder = params.images.filter((u) => u.startsWith('blob:'));
      const fileByBlob = new Map<string, File>();
      for (let i = 0; i < params.pendingBlobs.length; i++) {
        const blobUrl = params.pendingBlobs[i];
        const file = params.pendingFiles[i];
        if (blobUrl && file) fileByBlob.set(blobUrl, file);
      }
      const orderedPendingFiles = blobUrlsInOrder.map((u) => fileByBlob.get(u)).filter(Boolean) as File[];

      const job = createSaveJob(params.title, orderedPendingFiles);
      setUploadJobs((prev) => [job, ...prev]);

      try {
        updateJob(job.id, (j) => ({ ...j, status: 'uploading', message: undefined }));
        const uploadedUrls = await uploadPendingImagesPreservingOrderWithProgress({
          jobId: job.id,
          userId: params.userId,
          images: params.images,
          pendingFiles: params.pendingFiles,
          pendingBlobs: params.pendingBlobs,
        });

        updateJob(job.id, (j) => ({ ...j, status: 'saving' }));
        await params.buildAndSave(uploadedUrls);
        updateJob(job.id, (j) => ({ ...j, status: 'done' }));
      } catch (err: any) {
        console.error('Save job failed:', err);
        updateJob(job.id, (j) => ({
          ...j,
          status: 'error',
          message: typeof err?.message === 'string' ? err.message : 'فشل حفظ المنتج',
        }));
        throw err;
      }
    },
    [createSaveJob, updateJob, uploadPendingImagesPreservingOrderWithProgress]
  );

  const handleAddProduct = async (e: React.FormEvent, saveAsDraft: boolean = false) => {
    e.preventDefault();
    if (!user?.id) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }

    // إذا لم توجد صور، عرض modal الصور الافتراضية
    if (allProductImages.length === 0 && pendingImageFiles.length === 0) {
      setShowDefaultImagesModal(true);
      return;
    }
    
    try {
      setLoading(true);
      const selectedCategory = availableCategories.find(cat => cat.id === newCategory);
      const trimmedDescription = newDescription.trim();
      const parsedTags = newTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      const title = `${saveAsDraft ? 'مسودة' : 'نشر'}: ${newName || 'منتج جديد'}`;

      await runAddOrUpdateJob({
        title,
        userId: user.id,
        images: allProductImages,
        pendingFiles: pendingImageFiles,
        pendingBlobs: pendingBlobUrls,
        buildAndSave: async (uploadedUrls) => {
          if (uploadedUrls.length === 0) {
            setShowDefaultImagesModal(true);
            return;
          }

          const newProduct: Product = {
            id: '', // سيتم إنشاؤه تلقائياً في Firebase
            name: newName,
            category: selectedCategory?.nameAr || newCategory, // للعرض فقط (deprecated)
            categoryId: newCategory, // معرف التصنيف الفعلي
            price: parseFloat(newPrice),
            duration: newDuration,
            image: uploadedUrls[coverImageIndex] || uploadedUrls[0],
            coverImageIndex: coverImageIndex,
            images: uploadedUrls, // جميع الصور
            rating: 0,
            location: user.location || 'عمان',
            tailorId: user.id,
            tailorName: user.name,
            ...(trimmedDescription ? { description: trimmedDescription } : {}),
            ...(parsedTags.length > 0 ? { tags: parsedTags } : {}),
            isDraft: saveAsDraft,
          };

          await firebaseService.addProduct(newProduct);
          await refreshProducts();
        },
      });
      
      // إخفاء النموذج وإعادة تعيين الحقول
      setShowAddForm(false);
      resetForm();
      
      alert(saveAsDraft ? 'تم حفظ المنتج كمسودة!' : 'تم نشر المنتج بنجاح!');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('حدث خطأ أثناء إضافة المنتج');
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (id: string) => {
    // التحقق من وجود طلبات نشطة
    const activeOrders = await getActiveOrdersForProduct(id);
    if (activeOrders.length > 0) {
      alert(`لا يمكن حذف هذا المنتج لأن لديه ${activeOrders.length} طلب نشط. يرجى إكمال أو إلغاء الطلبات أولاً.`);
      return;
    }

    if(!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    try {
      await firebaseService.deleteProduct(id, user.id);
      await refreshProducts();
      alert('تم حذف المنتج بنجاح');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('حدث خطأ أثناء حذف المنتج');
    }
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewName(product.name);
    setNewPrice(product.price.toString());
    setNewDuration(product.duration || '');
    setNewCategory(product.categoryId || product.category); // استخدام categoryId أولاً
    setNewDescription(product.description || '');
    setNewTags(product.tags?.join(', ') || '');
    // تحميل الصور الموجودة
    setAllProductImages(product.images || (product.image ? [product.image] : []));
    setPendingImageFiles([]);
    setPendingBlobUrls([]);
    // تحميل index صورة الغلاف
    setCoverImageIndex(product.coverImageIndex || 0);
    setShowAddForm(false);
  };

  const handleUpdateProduct = async (e: React.FormEvent, publishDraft: boolean = false) => {
    e.preventDefault();
    if (!editingProduct) return;

    // التحقق من وجود طلبات نشطة إذا تم حذف جميع الصور
    if (allProductImages.length === 0 && pendingImageFiles.length === 0) {
      const activeOrders = await getActiveOrdersForProduct(editingProduct.id);
      if (activeOrders.length > 0) {
        alert(`لا يمكن حذف جميع صور المنتج لأن لديه ${activeOrders.length} طلب نشط. يرجى إكمال أو إلغاء الطلبات أولاً.`);
        return;
      }
      // إذا لم توجد صور، عرض modal الصور الافتراضية
      setShowDefaultImagesModal(true);
      return;
    }

    try {
      setLoading(true);
      
      // إرسال التحديثات فقط بدلاً من المنتج كاملاً
      const selectedCategory = availableCategories.find(cat => cat.id === newCategory);
      const updates: Partial<Product> = {
        tailorId: user.id, // Required for subcollection path
        name: newName,
        price: parseFloat(newPrice),
        duration: newDuration,
        category: selectedCategory?.nameAr || newCategory, // للعرض فقط (deprecated)
        categoryId: newCategory, // معرف التصنيف الفعلي
        description: newDescription,
        tags: newTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        updatedAt: new Date().toISOString()
      };

      const title = `${publishDraft ? 'نشر' : 'تحديث'}: ${editingProduct.name}`;
      await runAddOrUpdateJob({
        title,
        userId: user.id,
        images: allProductImages,
        pendingFiles: pendingImageFiles,
        pendingBlobs: pendingBlobUrls,
        buildAndSave: async (uploadedUrls) => {
          if (uploadedUrls.length === 0) {
            setShowDefaultImagesModal(true);
            return;
          }

          // تحديث الصور (يجب أن تكون موجودة)
          updates.image = uploadedUrls[coverImageIndex] || uploadedUrls[0];
          updates.coverImageIndex = coverImageIndex;
          updates.images = uploadedUrls;

          // إذا كان المنتج مسودة ونريد نشره
          if (publishDraft && editingProduct.isDraft) {
            updates.isDraft = false;
          }

          await firebaseService.updateProduct(editingProduct.id, updates);
          await refreshProducts();
        },
      });
      
      setEditingProduct(null);
      resetForm();
      
      if (publishDraft && editingProduct.isDraft) {
        alert('تم نشر المنتج بنجاح!');
      } else {
        alert('تم تحديث المنتج بنجاح!');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('حدث خطأ أثناء تحديث المنتج');
    } finally {
      setLoading(false);
    }
  };

  const resetFormForBatch = () => {
    // Revoke blob URLs to prevent memory leaks
    pendingBlobUrls.forEach((url) => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
    
    setNewName('');
    setNewPrice('');
    // Keep duration & category for reuse
    setNewDescription('');
    setNewTags('');
    setAllProductImages([]);
    setPendingImageFiles([]);
    setPendingBlobUrls([]);
    setCoverImageIndex(0);
    setUploadError('');
    
    // Focus on name input
    setTimeout(() => {
      document.getElementById('product-name-input')?.focus();
    }, 100);
  };

  const handleSaveAndAddAnother = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName || !newPrice || !newCategory) {
      alert('الرجاء تعبئة جميع الحقول المطلوبة (الاسم، السعر، التصنيف)');
      return;
    }

    if (allProductImages.length === 0 && pendingImageFiles.length === 0) {
      alert('يجب إضافة صورة واحدة على الأقل');
      return;
    }

    try {
      const trimmedDescription = newDescription.trim();
      const parsedTags = newTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Snapshot state for async background job
      const snapshot = {
        name: newName,
        price: newPrice,
        duration: newDuration,
        categoryId: newCategory,
        description: trimmedDescription,
        tags: parsedTags,
        coverIndex: coverImageIndex,
        images: allProductImages.slice(),
        pendingFiles: pendingImageFiles.slice(),
        pendingBlobs: pendingBlobUrls.slice(),
      };

      const title = `نشر (سريع): ${snapshot.name || 'منتج'}`;

      // Reset immediately so user can add next product while uploads run
      resetFormForBatch();

      void (async () => {
        await runAddOrUpdateJob({
          title,
          userId: user?.id as string,
          images: snapshot.images,
          pendingFiles: snapshot.pendingFiles,
          pendingBlobs: snapshot.pendingBlobs,
          buildAndSave: async (uploadedUrls) => {
            if (uploadedUrls.length === 0) throw new Error('يجب إضافة صورة واحدة على الأقل');

            const productData = {
              name: snapshot.name,
              price: parseFloat(snapshot.price),
              duration: snapshot.duration,
              category: availableCategories.find(cat => cat.id === snapshot.categoryId)?.nameAr || 'غير محدد',
              categoryId: snapshot.categoryId,
              ...(snapshot.description ? { description: snapshot.description } : {}),
              image: uploadedUrls[snapshot.coverIndex] || uploadedUrls[0],
              images: uploadedUrls,
              coverImageIndex: snapshot.coverIndex,
              tailorId: user?.id,
              tailorName: user?.shopName || user?.name,
              tailorLocation: user?.location || '',
              tailorImage: user?.photoURL || '',
              likes: 0,
              isDraft: false,
              rating: 0,
              reviews: 0,
              createdAt: new Date().toISOString(),
              ...(snapshot.tags.length > 0 ? { tags: snapshot.tags } : {}),
            };

            await firebaseService.addProduct(productData);
            productsQuery.refetch();
          },
        });
      })().catch((error) => {
        console.error('Background bulk save failed:', error);
        alert('حدث خطأ أثناء إضافة المنتج');
      });
      
      // Show small toast or notification instead of blocking alert? 
      // For now, no alert to be fast, just a sound or visual cue would be better, but console log is fine.
      // Or separate UI message in the form "Last item added: Name"
    } catch (error) {
      console.error('Error adding product:', error);
      alert('حدث خطأ أثناء إضافة المنتج');
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    resetForm();
  };

  const resetForm = () => {
    // Revoke blob URLs to prevent memory leaks
    pendingBlobUrls.forEach((url) => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
    
    setNewName('');
    setNewPrice('');
    setNewDuration('');
    const firstChild = availableCategories.find(cat => !cat.isParent);
    setNewCategory(firstChild ? firstChild.id : '');
    setNewDescription('');
    setNewTags('');
    setAllProductImages([]);
    setPendingImageFiles([]);
    setPendingBlobUrls([]);
    setCoverImageIndex(0);
    setUploadError('');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProducts();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Group products by category for the Shelf View
  const groupedProducts = React.useMemo(() => {
    if (filteredProducts.length === 0) return null;
    
    // Group by category name
    const groups: Map<string, Product[]> = new Map();
    
    filteredProducts.forEach(product => {
      const catName = product.category || 'أخرى';
      if (!groups.has(catName)) {
        groups.set(catName, []);
      }
      groups.get(catName)?.push(product);
    });
    
    return groups;
  }, [filteredProducts]);

  return (
    <div className="pb-24 pt-6 px-4">
      <div className="max-w-3xl mx-auto">
        <UploadJobsPanel jobs={uploadJobs} onDismiss={dismissUploadJob} />
        <div className="flex items-center justify-between mb-6">
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">إدارة منتجاتي</h1>
           <div className="flex items-center gap-2">
             {/* View Mode Buttons */}
             <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
               <button
                 onClick={() => setViewMode('list')}
                 className={`p-2 rounded transition ${
                   viewMode === 'list'
                     ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow'
                     : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
                 }`}
                 title="عرض قائمة"
               >
                 <List size={16} />
               </button>
               <button
                 onClick={() => setViewMode('grid')}
                 className={`p-2 rounded transition ${
                   viewMode === 'grid'
                     ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow'
                     : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
                 }`}
                 title="عرض شبكة"
               >
                 <Grid size={16} />
               </button>
               <button
                 onClick={() => setViewMode('compact')}
                 className={`p-2 rounded transition ${
                   viewMode === 'compact'
                     ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow'
                     : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
                 }`}
                 title="عرض مضغوط"
               >
                 <LayoutGrid size={16} />
               </button>
             </div>
             
             <button
               onClick={handleRefresh}
               disabled={refreshing}
               className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
               title="تحديث القائمة"
             >
               <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
               تحديث
             </button>
             <Button onClick={() => setShowAddForm(true)} size="sm" className="flex items-center gap-2">
               <Plus size={16} /> إضافة منتج
             </Button>
             <button
               onClick={() => navigate('/tailor/product/new')}
               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium text-sm transition-all shadow-lg"
             >
               <Sparkles size={16} /> تجربة الواجهة الجديدة
             </button>
           </div>
        </div>

        {/* Filter Tabs with Scroll Arrows */}
        <div className="relative group/filters mb-6">
          {/* Left Arrow */}
          <button
            onClick={() => scrollFilters('right')}
            className={`absolute left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-10 md:h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center shadow-xl ${
              filtersScrollable
                ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 hover:scale-110'
                : 'bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-default'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft size={22} strokeWidth={3} />
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scrollFilters('left')}
            className={`absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-10 md:h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center shadow-xl ${
              filtersScrollable
                ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 hover:scale-110'
                : 'bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-default'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight size={22} strokeWidth={3} />
          </button>

          {/* Scrollable filter tabs */}
          <div 
            ref={filterScrollRef}
            onScroll={checkFilterScroll}
            className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth px-0"
          >
            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              الكل ({myProducts.length})
            </button>
            <button
              onClick={() => setFilterMode('published')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                filterMode === 'published'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              ✓ المنشورة ({myProducts.filter(p => !p.isDraft).length})
            </button>
            <button
              onClick={() => setFilterMode('drafts')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                filterMode === 'drafts'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              📄 المسودات ({myProducts.filter(p => p.isDraft).length})
            </button>
          </div>
        </div>

        {(showAddForm || editingProduct) && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg mb-8 animate-in slide-in-from-top-4">
             <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">
               {editingProduct ? 'تعديل المنتج' : 'تفاصيل المنتج الجديد'}
             </h3>
             
             {/* Debug Panel */}
             <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
               <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">🐛 معلومات التصنيف</p>
               <div className="space-y-1 text-[10px]">
                 <div className="flex items-center justify-between">
                   <span className="text-slate-600 dark:text-slate-400">التصنيف المحدد:</span>
                   <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                     {availableCategories.find(cat => cat.id === newCategory)?.nameAr || 'غير محدد'}
                   </span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-slate-600 dark:text-slate-400">categoryId:</span>
                   <span className="font-mono text-[9px] text-green-600 dark:text-green-400 break-all max-w-[200px] text-left">
                     {newCategory || '❌ Not Set'}
                   </span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-slate-600 dark:text-slate-400">category (old):</span>
                   <span className="font-mono text-[9px] text-slate-500 dark:text-slate-500 line-through">
                     {availableCategories.find(cat => cat.id === newCategory)?.nameAr || 'N/A'}
                   </span>
                 </div>
                 {editingProduct && (
                   <>
                     <div className="border-t border-blue-200 dark:border-blue-800 my-1 pt-1">
                       <p className="text-blue-600 dark:text-blue-400 font-bold mb-1">المنتج الحالي:</p>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-slate-600 dark:text-slate-400">categoryId الحالي:</span>
                       <span className={`font-mono text-[9px] font-bold ${editingProduct.categoryId ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                         {editingProduct.categoryId || '❌ غير موجود'}
                       </span>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-slate-600 dark:text-slate-400">category القديم:</span>
                       <span className="font-mono text-[9px] text-slate-500">
                         {editingProduct.category || 'N/A'}
                       </span>
                     </div>
                   </>
                 )}
               </div>
             </div>
             
             <div className="flex justify-end mb-4">
               {!editingProduct && (
                 <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                   <button type="button" onClick={() => setBulkMode(false)} className={`px-3 py-1 text-xs font-medium rounded-md transition ${!bulkMode ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>عادي</button>
                   <button type="button" onClick={() => setBulkMode(true)} className={`px-3 py-1 text-xs font-medium rounded-md transition ${bulkMode ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>إدخال سريع</button>
                 </div>
               )}
             </div>

             <form onSubmit={editingProduct ? handleUpdateProduct : (bulkMode ? handleSaveAndAddAnother : handleAddProduct)} className="space-y-4">
               <div className={bulkMode ? "grid grid-cols-1 md:grid-cols-12 gap-6" : "space-y-4"}>
                 <div className={bulkMode ? "md:col-span-8 space-y-4 order-1" : "space-y-4"}>
                   <div>
                     <label className="block text-xs font-medium text-slate-500 mb-1">اسم المنتج</label>
                     <div className="flex items-center gap-2">
                   <input 
                      type="text" 
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      required
                      className="input-std flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5" 
                      placeholder="مثال: دشداشة مطرزة فاخرة"
                   />
                   <span className="text-xs font-mono bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                     {newName.length} chars
                   </span>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">السعر (ر.ع)</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <DollarSign size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
                        <input 
                          type="number" 
                          value={newPrice}
                          onChange={e => setNewPrice(e.target.value)}
                          required
                          className="input-std w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 pr-8" 
                          placeholder="25.000"
                        />
                      </div>
                      <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded whitespace-nowrap">
                        {newPrice || '0'} OMR
                      </span>
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">مدة الإنجاز</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Clock size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
                        <input 
                          type="text" 
                          value={newDuration}
                          onChange={e => setNewDuration(e.target.value)}
                          required
                          className="input-std w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 pr-8" 
                          placeholder="مثال: 5 أيام"
                        />
                      </div>
                      <span className="text-xs font-mono bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded whitespace-nowrap">
                        {newDuration || 'N/A'}
                      </span>
                    </div>
                 </div>
               </div>

               <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">الفئة</label>
                  
                  {newCategory ? (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg group hover:border-blue-400 transition-colors">
                       {(() => {
                          const cat = availableCategories.find(c => c.id === newCategory);
                          return (
                            <>
                              <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                                {cat?.image ? <img src={cat.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><LayoutGrid size={20}/></div>}
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-slate-900 dark:text-white">{cat?.nameAr}</div>
                                <div className="text-xs text-slate-500">{cat?.parentName || 'تصنيف'}</div>
                              </div>
                              <button type="button" onClick={() => setNewCategory('')} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all">
                                <Edit size={16} />
                              </button>
                            </>
                          );
                       })()}
                    </div>
                  ) : (
                    <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="relative">
                        <input
                          type="text"
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          placeholder="ابحث... (جلابية، فستان، دشداشة)"
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 pl-10 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          autoFocus={bulkMode}
                        />
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                           <LayoutGrid size={16} />
                         </div>
                      </div>

                      <div className="max-h-[220px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 custom-scrollbar">
                        {/* Compact Grouped List */}
                        {groupedCategoryOptions.map(({ groupName, children }) => (
                           <div key={groupName} className="mb-3 last:mb-0">
                             <h4 className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1.5 tracking-wider">{groupName}</h4>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                               {children.map((child) => (
                                 <button
                                   key={child.id}
                                   type="button"
                                   onClick={() => setNewCategory(child.id)}
                                   className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group text-right"
                                 >
                                    <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 group-hover:scale-110 transition-transform">
                                      {child.image && <img src={child.image} className="w-full h-full object-cover" loading="lazy" />}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{child.nameAr}</span>
                                 </button>
                               ))}
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
               </div>

               <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">الوصف</label>
                 <textarea 
                   value={newDescription}
                   onChange={e => setNewDescription(e.target.value)}
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 min-h-[100px]" 
                   placeholder="وصف تفصيلي للمنتج..."
                 />
                 <span className="text-xs font-mono bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded inline-block mt-1">
                   {newDescription.length} / 500 chars
                 </span>
               </div>

               <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">الوسوم (افصل بينها بفاصلة)</label>
                 <div className="flex items-start gap-2">
                   <input 
                     type="text" 
                     value={newTags}
                     onChange={e => setNewTags(e.target.value)}
                     className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5" 
                     placeholder="مثال: فاخر، مطرز، عماني"
                   />
                   <span className="text-xs font-mono bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 px-2 py-1 rounded whitespace-nowrap self-center">
                     {newTags.split(',').filter(t => t.trim()).length} tags
                   </span>
                 </div>
               </div>
               
               </div>
               
               <div className={bulkMode ? "md:col-span-4 order-2" : ""}>
               {/* Image Management Section */}
               <div>
                 <div className="flex items-center justify-between mb-2">
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                     صور المنتج {!editingProduct && '*'} (حتى 10 صور)
                   </label>
                   <span className="text-xs font-mono bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
                     {allProductImages.length} / 10 images
                   </span>
                 </div>
                 
                 {/* منطقة رفع الصور */}
                 {allProductImages.length < 10 && (
                   <div
                     className={`border-2 border-dashed rounded-xl p-8 text-center transition-all mb-4 ${
                       isImageDragOver
                         ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                         : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                     }`}
                     onDragEnter={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       setIsImageDragOver(true);
                     }}
                     onDragOver={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       setIsImageDragOver(true);
                     }}
                     onDragLeave={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       setIsImageDragOver(false);
                     }}
                     onDrop={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       setIsImageDragOver(false);
                       const files = Array.from(e.dataTransfer.files || []);
                       addImageFilesToForm(files);
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
                         addImageFilesToForm(files);
                       };
                       input.click();
                       }}
                       className="w-full"
                       disabled={loading}
                     >
                       <div className="flex flex-col items-center gap-3">
                         <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                           <ImageIcon size={32} className="text-blue-600" />
                         </div>
                         <div>
                           <p className="text-base font-medium text-slate-700 dark:text-slate-300">
                             {loading ? 'جاري الرفع...' : 'اضغط لرفع الصور'}
                           </p>
                           <p className="text-sm text-slate-500 mt-1">
                             أو اسحب الصور وأفلتها هنا
                           </p>
                         </div>
                         <p className="text-xs text-slate-400">
                           JPG, PNG, WEBP, AVIF (بحد أقصى 10MB لكل صورة) • حتى {10 - allProductImages.length} صور
                         </p>
                       </div>
                     </button>
                   </div>
                 )}
                 
                 {/* مربع منفصل لمكتبة الصور */}
                 {allProductImages.length < 10 && (
                   <div className="border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-xl p-6 text-center hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all mb-4">
                     <button
                       type="button"
                       onClick={() => setShowDefaultImagesModal(true)}
                       className="w-full"
                     >
                       <div className="flex flex-col items-center gap-3">
                         <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                           <ImagePlus size={28} className="text-purple-600" />
                         </div>
                         <div>
                           <p className="text-base font-medium text-slate-700 dark:text-slate-300">
                             اختر من مكتبة الصور
                           </p>
                           <p className="text-sm text-slate-500 mt-1">
                             استخدم صور جاهزة من المكتبة
                           </p>
                         </div>
                       </div>
                     </button>
                   </div>
                 )}
                 
                 {uploadError && (
                   <p className="mt-2 text-sm text-red-600 dark:text-red-400">{uploadError}</p>
                 )}
                 
                    {pendingImageFiles.length > 0 && (
                   <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                     📝 {pendingImageFiles.length} صورة جاهزة للرفع عند حفظ المنتج
                   </p>
                 )}
                 
                 {editingProduct && allProductImages.length === 0 && (
                   <p className="mt-2 text-xs text-slate-500">لن يتم تغيير الصور إلا إذا قمت برفع صور جديدة</p>
                 )}

                 {/* Image Management Grid */}
                 {allProductImages.length > 0 && (
                   <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                     <div className="flex items-center justify-between mb-3">
                       <label className="text-xs font-medium text-slate-500">
                         إدارة الصور ({allProductImages.length}/10)
                       </label>
                       <span className="text-xs text-slate-400">
                         الصورة #{coverImageIndex + 1} هي صورة الغلاف
                       </span>
                     </div>
                     <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                       {allProductImages.map((img, index) => (
                         <div 
                           key={index} 
                           className={`relative group rounded-lg overflow-hidden ${
                             index === coverImageIndex 
                               ? 'ring-2 ring-blue-500 shadow-lg' 
                               : 'ring-1 ring-slate-200 dark:ring-slate-700'
                           }`}
                           draggable
                           onDragStart={(e) => {
                             e.dataTransfer.setData('text/plain', String(index));
                             setDraggedImageIndex(index);
                           }}
                           onDragEnd={() => setDraggedImageIndex(null)}
                           onDragOver={(e) => {
                             e.preventDefault();
                           }}
                           onDrop={(e) => {
                             e.preventDefault();
                             const fromRaw = e.dataTransfer.getData('text/plain');
                             const from = Number(fromRaw);
                             if (!Number.isFinite(from)) return;
                             reorderImages(from, index);
                             setDraggedImageIndex(null);
                           }}
                         >
                           <img 
                             src={img} 
                             alt={`صورة ${index + 1}`}
                             className="w-full aspect-square object-cover"
                           />
                           
                           {/* Cover Badge */}
                           {index === coverImageIndex && (
                             <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                               <Star size={10} fill="white" />
                               غلاف
                             </div>
                           )}

                           {/* Image Number */}
                          <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                             {index + 1}
                           </div>

                          {/* Drag hint */}
                          {draggedImageIndex !== null && draggedImageIndex === index && (
                            <div className="absolute inset-0 bg-blue-500/15 pointer-events-none" />
                          )}

                           {/* Action Buttons - Show on hover */}
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                             {index !== coverImageIndex && (
                               <button
                                 type="button"
                                 onClick={() => setCoverImageIndex(index)}
                                 className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded flex items-center justify-center gap-1"
                               >
                                 <Star size={12} />
                                 تعيين كغلاف
                               </button>
                             )}
                             <button
                               type="button"
                               onClick={() => {
                                 // Create hidden file input
                                 const input = document.createElement('input');
                                 input.type = 'file';
                                 input.accept = 'image/*,image/avif';
                                 input.onchange = async (e) => {
                                   const file = (e.target as HTMLInputElement).files?.[0];
                                   if (file) {
                                     try {
                                       setLoading(true);
                                       // Compress image
                                       const options = {
                                         maxSizeMB: 1,
                                         maxWidthOrHeight: 1920,
                                         useWebWorker: true
                                       };
                                       const compressedFile = await imageCompression(file, options);
                                       
                                       // Upload to Firebase Storage with unique ID
                                       const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
                                       const storageRef = ref(storage, `products/${user?.id}/${uniqueId}_${file.name}`);
                                       await uploadBytes(storageRef, compressedFile);
                                       const newUrl = await getDownloadURL(storageRef);
                                       
                                       // Replace in array
                                       setAllProductImages(prev => {
                                         const newArr = [...prev];
                                         newArr[index] = newUrl;
                                         return newArr;
                                       });
                                       setLoading(false);
                                     } catch (error) {
                                       console.error('Error replacing image:', error);
                                       setUploadError('فشل استبدال الصورة');
                                       setLoading(false);
                                     }
                                   }
                                 };
                                 input.click();
                               }}
                               className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs px-2 py-1 rounded flex items-center justify-center gap-1"
                               disabled={loading}
                             >
                               <RefreshCw size={12} />
                               استبدال
                             </button>
                             <button
                               type="button"
                               onClick={async () => {
                                 // التحقق من الطلبات النشطة إذا كانت هذه آخر صورة
                                 if (allProductImages.length === 1 && editingProduct) {
                                   const activeOrders = await getActiveOrdersForProduct(editingProduct.id);
                                   if (activeOrders.length > 0) {
                                     alert(`لا يمكن حذف آخر صورة لأن المنتج لديه ${activeOrders.length} طلب نشط. يرجى إكمال أو إلغاء الطلبات أولاً.`);
                                     return;
                                   }
                                 }

                                 // إذا كانت آخر صورة، اعرض خيار اختيار صورة افتراضية
                                 if (allProductImages.length === 1) {
                                   if (confirm('هل تريد حذف آخر صورة واختيار صورة افتراضية بدلاً منها؟')) {
                                     setAllProductImages([]);
                                     setShowDefaultImagesModal(true);
                                   }
                                   return;
                                 }

                                 if (confirm(`هل تريد حذف الصورة #${index + 1}؟`)) {
                                   // Revoke blob URL if it's a local preview
                                   const urlToDelete = allProductImages[index];
                                   if (urlToDelete.startsWith('blob:')) {
                                     URL.revokeObjectURL(urlToDelete);
                                     // Also remove from pending files/blob mapping
                                     const blobIndex = allProductImages.slice(0, index).filter(u => u.startsWith('blob:')).length;
                                     setPendingImageFiles(prev => prev.filter((_, i) => i !== blobIndex));
                                     setPendingBlobUrls(prev => prev.filter((_, i) => i !== blobIndex));
                                   }
                                   
                                   setAllProductImages(prev => prev.filter((_, i) => i !== index));
                                   // Adjust cover index if needed
                                   if (index === coverImageIndex && allProductImages.length > 1) {
                                     setCoverImageIndex(0); // Reset to first image
                                   } else if (index < coverImageIndex) {
                                     setCoverImageIndex(prev => prev - 1); // Adjust index
                                   }
                                 }
                               }}
                               className="w-full bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center justify-center gap-1"
                             >
                               <Trash2 size={12} />
                               حذف
                             </button>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
               
               </div>
               </div>

               <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                 {!editingProduct && bulkMode ? (
                    <>
                      <Button 
                        type="button" 
                        onClick={handleSaveAndAddAnother}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={loading}
                      >
                         {loading ? 'جاري الحفظ...' : (
                           <span className="flex items-center gap-2 justify-center">
                             <Plus size={16} /> حفظ وإضافة التالي
                           </span>
                         )}
                      </Button>
                      <Button 
                         type="submit" 
                         variant="outline"
                         className="flex-1"
                         disabled={loading}
                       >
                         {loading ? 'جاري النشر...' : 'حفظ وإنهاء'}
                       </Button>
                    </>
                  ) : (
                    <>
                 {/* إذا كان المنتج مسودة، نعرض زر نشر */}
                 {editingProduct?.isDraft ? (
                   <>
                     <Button 
                       type="button" 
                       onClick={(e) => handleUpdateProduct(e as any, true)}
                       className="flex-1 bg-green-600 hover:bg-green-700" 
                       disabled={loading}
                     >
                       {loading ? 'جاري النشر...' : '✓ نشر المنتج'}
                     </Button>
                     <Button 
                       type="submit" 
                       variant="outline"
                       className="flex-1"
                       disabled={loading}
                     >
                       {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                     </Button>
                   </>
                 ) : editingProduct ? (
                   // منتج منشور - فقط تحديث
                   <Button type="submit" className="flex-1" disabled={loading}>
                     {loading ? 'جاري التحديث...' : 'تحديث المنتج'}
                   </Button>
                 ) : (
                   // منتج جديد - خياران: مسودة أو نشر
                   <>
                     <Button 
                       type="button" 
                       onClick={(e) => handleAddProduct(e as any, true)}
                       variant="outline"
                       className="flex-1"
                       disabled={loading}
                     >
                       {loading ? 'جاري الحفظ...' : '📄 حفظ كمسودة'}
                     </Button>
                     <Button 
                       type="submit" 
                       className="flex-1 bg-green-600 hover:bg-green-700"
                       disabled={loading}
                     >
                       {loading ? 'جاري النشر...' : '✓ نشر المنتج'}
                     </Button>
                   </>
                 )}
                    </>
                  )}
                 
                 <Button  
                   type="button" 
                   variant="outline" 
                   onClick={() => {
                     if (editingProduct) {
                       cancelEdit();
                     } else {
                       setShowAddForm(false);
                       resetForm();
                     }
                   }}
                 >
                   إلغاء
                 </Button>
               </div>
             </form>
          </div>
        )}

        {/* Products Display */}
        {shouldShowLoadingSpinner ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">جاري تحميل المنتجات...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            {/* List View - Always Flat */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex gap-4 group hover:shadow-md transition">
                    <div className="relative w-20 aspect-square bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden shrink-0">
                      <StableImage src={product.image} alt={product.name} aspectClass="h-full" className="absolute inset-0" />
                      {product.images && product.images.length > 1 && (
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                          {product.images.length}/10
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-white">{product.name}</h3>
                            {product.isDraft && (
                              <span className="text-[10px] bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">📄 مسودة</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mb-2">{product.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => startEditProduct(product)} 
                            className="text-blue-400 hover:text-blue-500 p-1"
                            title="تعديل المنتج"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => removeProduct(product.id)} 
                            className="text-red-400 hover:text-red-500 p-1"
                            title="حذف المنتج"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-bold text-blue-600 dark:text-blue-400">{product.price.toFixed(3)} ر.ع</span>
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <Clock size={12} /> {product.duration}
                        </span>
                        {product.likes && product.likes > 0 && (
                          <span className="text-red-400 text-xs">♥ {product.likes}</span>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Grid View (Now Grouped Sections like Netflix/Storefront) */}
            {viewMode === 'grid' && groupedProducts && (
               <div className="space-y-12">
                 {Array.from(groupedProducts.entries()).map(([categoryName, products]) => (
                   <div key={categoryName} className="relative">
                      {/* Section Header */}
                      <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{categoryName}</h3>
                          <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                            {products.length}
                          </span>
                        </div>
                        {products.length > 4 && (
                           <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                             عرض الكل <ChevronLeft size={14} />
                           </button>
                        )}
                      </div>

                      {/* Horizontal Scrolling List */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {products.map((product) => (
                           <div key={product.id} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden group hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-800">
                             {/* Image Area */}
                             <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-slate-900">
                               <StableImage 
                                 src={product.image} 
                                 alt={product.name} 
                                 aspectClass="h-full w-full" 
                                 className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                               />
                               
                               {/* Gradient Overlay */}
                               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                               
                               {/* Badges */}
                               <div className="absolute top-2 left-2 flex flex-col gap-1">
                                 {product.isDraft && (
                                   <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                                     مسودة
                                   </span>
                                 )}
                                  {product.images && product.images.length > 1 && (
                                   <span className="bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                     <ImageIcon size={10} /> {product.images.length}
                                   </span>
                                 )}
                               </div>

                               {/* Action Buttons (visible on hover) */}
                               <div className="absolute top-2 right-2 flex flex-col gap-2 translate-x-10 group-hover:translate-x-0 transition-transform duration-300">
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); startEditProduct(product); }} 
                                   className="bg-white/90 dark:bg-slate-800/90 backdrop-blur p-2 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition shadow-lg"
                                   title="تعديل"
                                 >
                                   <Edit size={14} />
                                 </button>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); removeProduct(product.id); }} 
                                   className="bg-white/90 dark:bg-slate-800/90 backdrop-blur p-2 rounded-lg text-red-600 hover:bg-red-600 hover:text-white transition shadow-lg"
                                   title="حذف"
                                 >
                                   <Trash2 size={14} />
                                 </button>
                               </div>

                               {/* Price Tag & Likes */}
                               <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                                  <div>
                                    <h4 className="font-bold text-sm leading-tight mb-0.5 line-clamp-2 text-shadow-sm">{product.name}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-200">
                                      <span className="flex items-center gap-0.5"><Clock size={10} /> {product.duration}</span>
                                    </div>
                                  </div>
                               </div>
                             </div>
                             
                             {/* Footer Clean */}
                             <div className="p-3 flex items-center justify-between bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/50">
                               <p className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                                 {product.price.toFixed(3)} <span className="text-[10px] text-slate-400 font-normal">ر.ع</span>
                               </p>
                               {product.likes > 0 && (
                                 <div className="flex items-center gap-1 text-xs text-red-500 font-medium bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                                   <span className="text-[10px]">♥</span> {product.likes}
                                 </div>
                               )}
                             </div>
                           </div>
                        ))}
                      </div>
                   </div>
                 ))}
               </div>
            )}

            {/* Compact View */}
            {viewMode === 'compact' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden group hover:shadow-md transition">
                    <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900">
                      <StableImage src={product.image} alt={product.name} aspectClass="aspect-square" />
                      {product.images && product.images.length > 1 && (
                        <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                          {product.images.length}/10
                        </div>
                      )}
                      {product.isDraft && (
                        <div className="absolute bottom-1 left-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          📄 مسودة
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button 
                          onClick={() => startEditProduct(product)} 
                          className="bg-white p-2 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => removeProduct(product.id)} 
                          className="bg-white p-2 rounded-lg text-red-600 hover:bg-red-600 hover:text-white transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="p-2">
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">{product.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-bold text-xs text-blue-600 dark:text-blue-400">{product.price.toFixed(2)} ر.ع</span>
                        {product.likes && product.likes > 0 && (
                          <span className="text-red-400 text-xs">♥ {product.likes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <Package size={48} className="mx-auto mb-2 opacity-50 text-slate-400" />
            <p className="text-slate-600 dark:text-slate-400">
              {filterMode === 'drafts' ? 'لا توجد مسودات' : filterMode === 'published' ? 'لا توجد منتجات منشورة' : 'لا توجد منتجات مضافة حالياً'}
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              إضافة منتج جديد
            </button>
          </div>
        )}
      </div>

      {/* Modal الصور الافتراضية */}
      {showDefaultImagesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ImagePlus size={24} className="text-blue-600" />
                  اختر صورة افتراضية للمنتج
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  اختر صورة مناسبة من المكتبة أو قم برفع صورك الخاصة لاحقاً
                </p>
              </div>
              <button
                onClick={() => setShowDefaultImagesModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {loadingLibrary ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-400">جاري تحميل المكتبة...</p>
                </div>
              ) : libraryImages.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon size={64} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                  <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">
                    المكتبة فارغة حالياً
                  </p>
                  <p className="text-sm text-slate-500">
                    لم يتم إضافة صور لهذا القسم بعد. يمكنك رفع صورك الخاصة.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {libraryImages.map((imageOption) => (
                    <button
                      key={imageOption.id}
                    type="button"
                    onClick={() => {
                      setAllProductImages([imageOption.url]);
                      setCoverImageIndex(0);
                      setShowDefaultImagesModal(false);
                      // إذا كانت النموذج مفتوح، أرسله تلقائياً
                      if (showAddForm || editingProduct) {
                        setTimeout(() => {
                          if (editingProduct) {
                            handleUpdateProduct(new Event('submit') as any);
                          } else {
                            handleAddProduct(new Event('submit') as any);
                          }
                        }, 100);
                      }
                    }}
                      className="group relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-purple-500 transition-all hover:shadow-md"
                    >
                      <img
                        src={imageOption.url}
                        alt={imageOption.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                          <p className="text-xs font-medium line-clamp-2">{imageOption.label}</p>
                        </div>
                      </div>
                      <div className="absolute top-1 right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImagePlus size={14} className="text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!loadingLibrary && libraryImages.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                    💡 يمكنك تغيير الصورة لاحقاً برفع صورك الخاصة
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal اختيار التصنيف */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-xl max-h-[70vh] overflow-hidden animate-scale-in">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold mb-0.5">اختر التصنيف المناسب</h3>
                <p className="text-blue-100 text-xs">اضغط على التصنيف لاختياره</p>
              </div>
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-3 overflow-y-auto max-h-[calc(70vh-60px)]">
              {availableCategories.length === 0 ? (
                <div className="text-center py-8">
                  <Package size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                    لا توجد تصنيفات متاحة حالياً
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const sections: React.ReactElement[] = [];
                    let currentParent = '';
                    let currentParentName = '';
                    let currentChildren: any[] = [];
                    
                    availableCategories.forEach((cat, idx) => {
                      if (cat.isParent) {
                        // إذا كان هناك أطفال سابقين، أضف العنوان والـ grid
                        if (currentChildren.length > 0) {
                          sections.push(
                            <div key={`section-${currentParent}`} className={sections.length > 0 ? 'pt-2' : ''}>
                              {/* عنوان القسم */}
                              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 pb-1.5 border-b border-blue-500/30">
                                {currentParentName}
                              </h4>
                              {/* Grid الأبناء */}
                              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                                {currentChildren.map(child => (
                                  <button
                                    key={child.id}
                                    type="button"
                                    onClick={() => {
                                      setNewCategory(child.id);
                                      setShowCategoryModal(false);
                                    }}
                                    className={`group relative rounded-md overflow-hidden transition-all duration-200 ${
                                      newCategory === child.id
                                        ? 'ring-2 ring-blue-500 shadow-md'
                                        : 'hover:shadow-md border border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                    }`}
                                  >
                                    {/* صورة التصنيف */}
                                    <div className="aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                                      {child.image ? (
                                        <img
                                          src={child.image}
                                          alt={child.nameAr}
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Package size={20} className="text-slate-400 dark:text-slate-600" />
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* الأسماء */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-1.5 pt-6">
                                      <h5 className="font-bold text-white text-xs mb-0 text-center leading-tight">
                                        {child.nameAr}
                                      </h5>
                                      {child.nameEnOriginal && (
                                        <p className="text-[10px] text-white/70 text-center leading-tight">
                                          {child.nameEnOriginal}
                                        </p>
                                      )}
                                    </div>
                                    
                                    {/* علامة الاختيار */}
                                    {newCategory === child.id && (
                                      <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        currentParent = cat.nameEn;
                        currentParentName = cat.nameAr;
                        currentChildren = [];
                      } else {
                        currentChildren.push(cat);
                      }
                    });
                    
                    // إضافة آخر مجموعة
                    if (currentChildren.length > 0 && currentParentName) {
                      sections.push(
                        <div key={`section-${currentParent}`} className={sections.length > 0 ? 'pt-2' : ''}>
                          {/* عنوان القسم */}
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 pb-1.5 border-b border-blue-500/30">
                            {currentParentName}
                          </h4>
                          {/* Grid الأبناء */}
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                            {currentChildren.map(child => (
                              <button
                                key={child.id}
                                type="button"
                                onClick={() => {
                                  setNewCategory(child.id);
                                  setShowCategoryModal(false);
                                }}
                                className={`group relative rounded-md overflow-hidden transition-all duration-200 ${
                                  newCategory === child.id
                                    ? 'ring-2 ring-blue-500 shadow-md'
                                    : 'hover:shadow-md border border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                }`}
                              >
                                {/* صورة التصنيف */}
                                <div className="aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                                  {child.image ? (
                                    <img
                                      src={child.image}
                                      alt={child.nameAr}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package size={20} className="text-slate-400 dark:text-slate-600" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* الأسماء */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-1.5 pt-6">
                                  <h5 className="font-bold text-white text-xs mb-0 text-center leading-tight">
                                    {child.nameAr}
                                  </h5>
                                  {child.nameEnOriginal && (
                                    <p className="text-[10px] text-white/70 text-center leading-tight">
                                      {child.nameEnOriginal}
                                    </p>
                                  )}
                                </div>
                                
                                {/* علامة الاختيار */}
                                {newCategory === child.id && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    
                    return sections;
                  })()}
                </div>
              )}
              
              {availableCategories.length > 0 && (
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 text-center">
                    💡 اختر التصنيف الذي يتناسب مع نوع المنتج
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
