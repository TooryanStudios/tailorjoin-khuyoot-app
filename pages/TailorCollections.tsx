
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, DollarSign, Clock, Image as ImageIcon, Trash2, RefreshCw, Edit, Save, X, Grid, List, LayoutGrid, Star, ImagePlus } from 'lucide-react';
import { Button } from '../components/Button';
import { ProductFormDialog } from '../components/ProductFormDialog';
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
import { StableImage } from '../components/StableImage';
import { MontHeader } from '../src/components/MontHeader';
import { DeleteConfirmModal } from '../src/pages/DesignerV2_1/components/DeleteConfirmModal';

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

const MONT_HEADER_ID = 'khuyoot-mont-header';
const DEFAULT_HEADER_SPACER_HEIGHT = 72;


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

  const productsQuery = useQuery<Product[]>({
    queryKey: ['tailor-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as Product[];
      return firebaseService.getProductsByTailorId(user.id);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15, // Keep in cache 15min instead of default 5min
  });

  useEffect(() => {
    if (productsQuery.data) {
      setTailorProducts(productsQuery.data);
      setInitialLoading(false);
      // Preload first few images for perceived performance
      if (typeof preloadImages === 'function') {
        preloadImages(productsQuery.data.slice(0, 5).map((p: any) => p.image));
      }
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
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null); // Video file waiting to be uploaded
  const [pendingVideoUrl, setPendingVideoUrl] = useState<string>(''); // Blob URL or existing video URL
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
  const [uploadJobs, setUploadJobs] = useState<SaveJob[]>([]);
  const [isImageDragOver, setIsImageDragOver] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [headerHeight, setHeaderHeight] = useState(DEFAULT_HEADER_SPACER_HEIGHT);
  
  // Delete confirm modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  
  // Success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const normalizeGenderValue = React.useCallback((value?: string): 'male' | 'female' | null => {
    if (!value) return null;
    const v = value.toLowerCase().trim();

    if (v === 'male' || v === 'males' || v === 'men') return 'male';
    if (v === 'female' || v === 'females' || v === 'women') return 'female';
    return null;
  }, []);

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;

    const updateHeaderHeight = () => {
      const headerEl = document.getElementById(MONT_HEADER_ID);
      if (!headerEl) return;
      const measuredHeight = headerEl.getBoundingClientRect().height;
      if (measuredHeight > 0) {
        setHeaderHeight(measuredHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

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
      
      // تحديد الجنس/التخصص من بيانات المستخدم المخزنة فقط (بدون تخمينات نصية)
      let tailorGender: 'male' | 'female' | null = null;

      const detectedFromTailorGender = normalizeGenderValue(user?.tailorGender);
      const detectedFromSpecialization = normalizeGenderValue(user?.specialization);
      const detectedFromSpecializations = Array.isArray(user?.specializations)
        ? (user.specializations
            .map((s: string) => normalizeGenderValue(s))
            .find((v): v is 'male' | 'female' => Boolean(v)) || null)
        : null;
      const detectedFromGender = normalizeGenderValue(user?.gender);

      if (detectedFromTailorGender) {
        tailorGender = detectedFromTailorGender;
      } else if (detectedFromSpecialization) {
        tailorGender = detectedFromSpecialization;
      } else if (detectedFromSpecializations) {
        tailorGender = detectedFromSpecializations;
      } else if (detectedFromGender) {
        tailorGender = detectedFromGender;
      }
      
      console.log('🔍 [TailorCollections] Loading categories for gender:', tailorGender);
      console.log('   User:', user?.name);
      console.log('   tailorGender field:', user?.tailorGender);
      console.log('   specialization field:', user?.specialization);
      
      if (!tailorGender) {
        console.warn('⚠️ لا يوجد gender/specialization صالح في ملف المستخدم، سيتم عرض جميع تصنيفات الأزياء');
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
      
      const matchesCategoryGender = (data: any, targetGender: 'male' | 'female' | null) => {
        if (!targetGender) return true;

        const rawCandidates: string[] = [];
        if (typeof data?.tailorGender === 'string') rawCandidates.push(data.tailorGender);
        if (typeof data?.gender === 'string') rawCandidates.push(data.gender);
        if (typeof data?.targetGender === 'string') rawCandidates.push(data.targetGender);
        if (typeof data?.audienceGender === 'string') rawCandidates.push(data.audienceGender);
        if (typeof data?.forGender === 'string') rawCandidates.push(data.forGender);
        if (typeof data?.specialization === 'string') rawCandidates.push(data.specialization);
        if (Array.isArray(data?.genders)) {
          data.genders.forEach((g: any) => {
            if (typeof g === 'string') rawCandidates.push(g);
          });
        }

        if (rawCandidates.length === 0) return true;

        const normalized = rawCandidates
          .map((v) => normalizeGenderValue(v))
          .filter((v): v is 'male' | 'female' => Boolean(v));

        if (normalized.length === 0) return true;
        return normalized.includes(targetGender);
      };

      level1Snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        console.log('  - Checking category:', data.nameAr || data.nameEn || doc.id);
        
        // فلترة مبنية على حقول الجندر المخزنة في قاعدة البيانات
        if (!matchesCategoryGender(data, tailorGender)) {
          console.log('    ❌ Skipped (DB gender mismatch)');
          return;
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
  }, [user?.id, user?.tailorGender, user?.specialization, JSON.stringify(user?.specializations || []), user?.gender, normalizeGenderValue]);

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

  const addImageFilesToForm = React.useCallback(
    (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length === 0) return;

      const totalImages = allProductImages.length;
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

  const uploadVideo = React.useCallback(
    async (videoFile: File, userId: string): Promise<string> => {
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const storageRef = ref(storage, `products/${userId}/videos/${uniqueId}_${videoFile.name}`);
      await uploadBytes(storageRef, videoFile);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    },
    []
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

          // Upload video if present
          let videoUrl: string | undefined = undefined;
          if (pendingVideoFile) {
            videoUrl = await uploadVideo(pendingVideoFile, user.id);
          } else if (pendingVideoUrl && !pendingVideoUrl.startsWith('blob:')) {
            // Keep existing video URL if no new video was uploaded
            videoUrl = pendingVideoUrl;
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
            ...(videoUrl ? { videoUrl } : {}),
            isDraft: saveAsDraft,
          };

          await firebaseService.addProduct(newProduct);
          await refreshProducts();
        },
      });
      
      // إخفاء النموذج وإعادة تعيين الحقول
      setShowAddForm(false);
      resetForm();
      
      setSuccessMessage(saveAsDraft ? 'تم حفظ المنتج كمسودة!' : 'تم نشر المنتج بنجاح!');
      setShowSuccessDialog(true);
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

    setProductToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    const id = productToDelete;
    
    // Optimistic update
    const previousProducts = [...tailorProducts];
    setTailorProducts(tailorProducts.filter(p => p.id !== id));
    setShowDeleteModal(false);
    
    try {
      if (user?.id) {
        await firebaseService.deleteProduct(id, user.id);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('حدث خطأ أثناء حذف المنتج');
      // Revert state
      setTailorProducts(previousProducts);
    } finally {
      setProductToDelete(null);
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
    // تحميل الفيديو الموجود (إن وجد)
    setPendingVideoFile(null);
    setPendingVideoUrl(product.videoUrl || '');
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

          // Upload video if present
          let videoUrl: string | undefined = undefined;
          if (pendingVideoFile) {
            videoUrl = await uploadVideo(pendingVideoFile, user.id);
          } else if (pendingVideoUrl && !pendingVideoUrl.startsWith('blob:')) {
            // Keep existing video URL if no new video was uploaded
            videoUrl = pendingVideoUrl;
          } else if (editingProduct.videoUrl) {
            // Keep existing video URL from the product being edited
            videoUrl = editingProduct.videoUrl;
          }

          // تحديث الصور (يجب أن تكون موجودة)
          updates.image = uploadedUrls[coverImageIndex] || uploadedUrls[0];
          updates.coverImageIndex = coverImageIndex;
          updates.images = uploadedUrls;
          if (videoUrl) {
            updates.videoUrl = videoUrl;
          }

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
        setSuccessMessage('تم نشر المنتج بنجاح!');
      } else {
        setSuccessMessage('تم تحديث المنتج بنجاح!');
      }
      setShowSuccessDialog(true);
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
    if (pendingVideoUrl && pendingVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingVideoUrl);
    }
    
    setNewName('');
    setNewPrice('');
    // Keep duration & category for reuse
    setNewDescription('');
    setNewTags('');
    setAllProductImages([]);
    setPendingImageFiles([]);
    setPendingBlobUrls([]);
    setPendingVideoFile(null);
    setPendingVideoUrl('');
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
              id: '', // Will be generated by Firestore
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
    if (pendingVideoUrl && pendingVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingVideoUrl);
    }
    
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
    setPendingVideoFile(null);
    setPendingVideoUrl('');
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
    <div className="h-screen overflow-hidden bg-[#ededed] font-['Tajawal'] text-slate-900 selection:bg-[var(--theme-primary)] selection:text-white flex flex-col">
      <MontHeader />
      <div
        aria-hidden="true"
        className="pointer-events-none"
        style={{ height: headerHeight }}
      />
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollPaddingTop: headerHeight }}
      >
        {/* --- HERO / BANNER SECTION --- */}
        <section className="px-4 md:px-6 lg:px-8 py-3 max-w-[1400px] mx-auto">
        <div className="relative rounded-xl bg-[var(--theme-primary)] p-6 md:p-8 overflow-hidden min-h-[140px] flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4" dir="rtl">
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl text-white leading-tight">إدارة المنتجات</h1>
              <p className="text-white/70 text-xs md:text-sm max-w-sm">أضف بضائعك وعروضك وقم بتحديث مخزونك ومسوداتك بكل سهولة.</p>
            </div>
            
            <div className="flex gap-3">
               <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/10 flex flex-col items-center justify-center min-w-[70px]">
                  <span className="text-xl text-white">{myProducts.length}</span>
                  <span className="text-[9px] text-white/60">إجمالي المنتجات</span>
               </div>
               <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/10 flex flex-col items-center justify-center min-w-[70px]">
                  <span className="text-xl text-white">{myProducts.filter(p => !p.isDraft).length}</span>
                  <span className="text-[9px] text-white/60">منشور</span>
               </div>
               <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/10 flex flex-col items-center justify-center min-w-[70px]">
                  <span className="text-xl text-white">{myProducts.filter(p => p.isDraft).length}</span>
                  <span className="text-[9px] text-white/60">مسودة</span>
               </div>
               <button 
                onClick={handleRefresh}
                title="تحديث البيانات"
                className="px-3 py-3 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
               >
                 <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
               </button>
            </div>
          </div>
        </div>
      </section>

      <main className="px-4 md:px-6 lg:px-8 py-4 max-w-[1400px] mx-auto pb-8">
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-xl font-bold text-slate-900">قائمة المنتجات</h2>
           <div className="flex items-center gap-2">
             {/* View Mode Buttons */}
             <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
               <button
                 onClick={() => setViewMode('list')}
                 className={`p-2 rounded transition ${
                   viewMode === 'list'
                     ? 'bg-[var(--theme-primary)] text-white shadow'
                     : 'text-slate-600 hover:bg-slate-100'
                 }`}
                 title="عرض قائمة"
               >
                 <List size={16} />
               </button>
               <button
                 onClick={() => setViewMode('grid')}
                 className={`p-2 rounded transition ${
                   viewMode === 'grid'
                     ? 'bg-[var(--theme-primary)] text-white shadow'
                     : 'text-slate-600 hover:bg-slate-100'
                 }`}
                 title="عرض شبكة"
               >
                 <Grid size={16} />
               </button>
               <button
                 onClick={() => setViewMode('compact')}
                 className={`p-2 rounded transition ${
                   viewMode === 'compact'
                     ? 'bg-[var(--theme-primary)] text-white shadow'
                     : 'text-slate-600 hover:bg-slate-100'
                 }`}
                 title="عرض مضغوط"
               >
                 <LayoutGrid size={16} />
               </button>
             </div>
             
             <button
               onClick={() => setShowAddForm(true)}
               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--theme-primary)] text-white font-medium text-sm transition-all shadow-sm hover:bg-[var(--theme-primary)]/90"
             >
               <Plus size={16} /> إضافة منتج
             </button>
           </div>
        </div>

        {/* Filter Tabs */}
        <div className="relative group/filters mb-6">

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
                  ? 'bg-[var(--theme-primary)] text-white'
                  : 'bg-white text-slate-600 border border-gray-200 hover:bg-slate-50'
              }`}
            >
              الكل ({myProducts.length})
            </button>
            <button
              onClick={() => setFilterMode('published')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                filterMode === 'published'
                  ? 'bg-[#10b981] text-white'
                  : 'bg-white text-slate-600 border border-gray-200 hover:bg-slate-50'
              }`}
            >
              ✓ المنشورة ({myProducts.filter(p => !p.isDraft).length})
            </button>
            <button
              onClick={() => setFilterMode('drafts')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                filterMode === 'drafts'
                  ? 'bg-[#f59e0b] text-white'
                  : 'bg-white text-slate-600 border border-gray-200 hover:bg-slate-50'
              }`}
            >
              📄 المسودات ({myProducts.filter(p => p.isDraft).length})
            </button>
          </div>
        </div>

        {(showAddForm || editingProduct) && (
          <ProductFormDialog
            isOpen={showAddForm || !!editingProduct}
            isEditing={!!editingProduct}
            editingProduct={editingProduct}
            formState={{
              newName,
              newPrice,
              newDuration,
              newCategory,
              newDescription,
              newTags,
              categorySearch,
              allProductImages,
              coverImageIndex,
              isImageDragOver,
              bulkMode,
              loading,
              uploadError,
              pendingImageFiles,
              pendingBlobUrls,
              pendingVideoFile,
              pendingVideoUrl,
              draggedImageIndex,
            }}
            handlers={{
              setNewName,
              setNewPrice,
              setNewDuration,
              setNewCategory,
              setNewDescription,
              setNewTags,
              setCategorySearch,
              setAllProductImages,
              setCoverImageIndex,
              setIsImageDragOver,
              setBulkMode,
              setUploadError,
              setPendingImageFiles,
              setPendingBlobUrls,
              setPendingVideoFile,
              setPendingVideoUrl,
              setDraggedImageIndex,
            }}
            callbacks={{
              handleAddProduct,
              handleUpdateProduct,
              handleSaveAndAddAnother,
              cancelEdit,
              resetForm,
              closeDialog: () => setShowAddForm(false),
              addImageFilesToForm,
              reorderImages,
              showDefaultImagesModal: setShowDefaultImagesModal,
            }}
            availableCategories={availableCategories}
            groupedCategoryOptions={groupedCategoryOptions}
            user={user}
          />
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
                  <div key={product.id} className="bg-white rounded-xl p-4 border border-slate-200 flex gap-4 group hover:shadow-md transition">
                    <div className="relative w-20 aspect-square bg-slate-100 rounded-lg overflow-hidden shrink-0">
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
                            <h3 className="font-bold text-slate-900">{product.name}</h3>
                            {product.isDraft && (
                              <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold">📄 مسودة</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mb-2">{product.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => startEditProduct(product)} 
                            className="text-[var(--theme-primary)] hover:text-[var(--theme-primary)]/80 p-1"
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
                        <span className="font-bold text-[var(--theme-primary)]">{product.price.toFixed(3)} ر.ع</span>
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <Clock size={12} /> {product.duration}
                        </span>
                        {product.likes && product.likes > 0 && (
                          <span className="text-red-400 text-xs">♥ {product.likes}</span>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-xs bg-purple-100 text-[var(--theme-primary)] px-2 py-0.5 rounded">
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
                          <h3 className="text-xl font-bold text-slate-900">{categoryName}</h3>
                          <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            {products.length}
                          </span>
                        </div>
                        {products.length > 4 && (
                           <button className="text-xs font-semibold text-[var(--theme-primary)] hover:underline">
                             عرض الكل
                           </button>
                        )}
                      </div>

                      {/* Horizontal Scrolling List */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {products.map((product) => (
                           <div key={product.id} className="bg-white rounded-xl overflow-hidden group hover:shadow-xl transition-all duration-300 border border-slate-100">
                             {/* Image Area */}
                             <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
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
                                   className="bg-white/90 backdrop-blur p-2 rounded-lg text-[var(--theme-primary)] hover:bg-[var(--theme-primary)] hover:text-white transition shadow-lg"
                                   title="تعديل"
                                 >
                                   <Edit size={14} />
                                 </button>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); removeProduct(product.id); }} 
                                   className="bg-white/90 backdrop-blur p-2 rounded-lg text-red-600 hover:bg-red-600 hover:text-white transition shadow-lg"
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
                             <div className="p-3 flex items-center justify-between bg-white border-t border-slate-100">
                               <p className="font-bold text-[var(--theme-primary)] text-sm">
                                 {product.price.toFixed(3)} <span className="text-[10px] text-slate-400 font-normal">ر.ع</span>
                               </p>
                               {product.likes > 0 && (
                                 <div className="flex items-center gap-1 text-xs text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded">
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
                  <div key={product.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden group hover:shadow-md transition">
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
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
                          className="bg-white p-2 rounded-lg text-[var(--theme-primary)] hover:bg-[var(--theme-primary)] hover:text-white transition"
                          title="تعديل"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => removeProduct(product.id)} 
                          className="bg-white p-2 rounded-lg text-red-600 hover:bg-red-600 hover:text-white transition"
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="p-2">
                      <h3 className="font-bold text-xs text-slate-900 truncate">{product.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-bold text-xs text-[var(--theme-primary)]">{product.price.toFixed(2)} ر.ع</span>
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
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Package size={48} className="mx-auto mb-2 opacity-50 text-slate-400" />
            <p className="text-slate-600 dark:text-slate-400">
              {filterMode === 'drafts' ? 'لا توجد مسودات' : filterMode === 'published' ? 'لا توجد منتجات منشورة' : 'لا توجد منتجات مضافة حالياً'}
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-6 py-2 bg-[var(--theme-primary)] text-white rounded-lg hover:bg-[var(--theme-primary)]/90 transition"
            >
              إضافة منتج جديد
            </button>
          </div>
        )}

      {/* Modal الصور الافتراضية */}
      {showDefaultImagesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10060] p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ImagePlus size={24} className="text-[var(--theme-primary)]" />
                  اختر صورة افتراضية للمنتج
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  اختر صورة مناسبة من المكتبة أو قم برفع صورك الخاصة لاحقاً
                </p>
              </div>
              <button
                onClick={() => setShowDefaultImagesModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
                title="إغلاق"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {loadingLibrary ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--theme-primary)] mx-auto mb-4"></div>
                  <p className="text-slate-600">جاري تحميل المكتبة...</p>
                </div>
              ) : libraryImages.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon size={64} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600 font-medium mb-2">
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
                      className="group relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-slate-200 hover:border-[var(--theme-primary)] transition-all hover:shadow-md"
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
                      <div className="absolute top-1 right-1 w-6 h-6 bg-[var(--theme-primary)] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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

      <DeleteConfirmModal 
        isOpen={showDeleteModal}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        itemName="هذا المنتج"
      />

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div 
          className="fixed inset-0 z-[15000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowSuccessDialog(false)}
        >
          <div 
            className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{successMessage}</h3>
              <button
                onClick={() => setShowSuccessDialog(false)}
                className="w-full px-6 py-3 bg-theme-primary text-white rounded-xl font-medium hover:bg-emerald-600 transition-all active:scale-95"
              >
                حسناً
              </button>
            </div>
          </div>
        </div>
      )}

      </main>
      </div>
    </div>
  );
};
