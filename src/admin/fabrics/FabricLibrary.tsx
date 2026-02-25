import { useConfirmDialog } from '../hooks/useConfirmDialog';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { firebaseService, db, storage } from '../../../services/firebase';
import { useAuth } from '../../auth/useAuth';
import imageCompression from 'browser-image-compression';
import {
   addDoc,
   collection,
   deleteDoc,
   doc,
   getDoc,
   getDocs,
   orderBy,
   query,
   runTransaction,
   Timestamp,
   updateDoc,
   where,
} from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';

type FabricCategory = {
   id: string;
   name: string;
   nameAr?: string;
   description?: string;
   order: number;
   nextSeq?: number;
};

type FabricItem = {
   id: string;
   categoryId: string;
   name: string;
   nameAr?: string;
   imageUrl?: string;
   imageUrls?: string[];
   thumbnailUrl?: string;
   thumbnailUrls?: string[];
   code?: string;
   type?: string;
   color?: string;
   stock?: number;
   pricePerMeter?: number;
};

type RemoteImageInfo = {
   contentType: string | null;
   contentLength: number | null;
};

type ImageDimensions = {
   width: number;
   height: number;
};

type ThumbProgress = {
   done: number;
   total: number;
};

interface FabricLibraryProps {
   fabrics?: any[];
}

export const FabricLibrary: React.FC<FabricLibraryProps> = () => {
   const { confirm, confirmDialog } = useConfirmDialog();
   const [categories, setCategories] = useState<FabricCategory[]>([]);
   const [items, setItems] = useState<FabricItem[]>([]);
   const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);
   const [uiError, setUiError] = useState<string | null>(null);

   const [showCategoryForm, setShowCategoryForm] = useState(false);
   const [showItemForm, setShowItemForm] = useState(false);

   const [categoryForm, setCategoryForm] = useState<{ id: string; name: string; nameAr: string; description: string; order: number }>({
      id: '',
      name: '',
      nameAr: '',
      description: '',
      order: 0,
   });
   const [itemForm, setItemForm] = useState<{ id: string; categoryId: string; name: string; nameAr: string; imageUrls: string[]; code: string; type: string; color: string; stock: number; pricePerMeter: number }>({
      id: '',
      categoryId: '',
      name: '',
      nameAr: '',
      imageUrls: [],
      code: '',
      type: '',
      color: '',
      stock: 0,
      pricePerMeter: 0,
   });
   const [uploadingImage, setUploadingImage] = useState(false);
   const [codeTouched, setCodeTouched] = useState(false);
   const codeTouchedRef = useRef(false);

   const [viewingItem, setViewingItem] = useState<FabricItem | null>(null);
   const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

   const [imageInfoByUrl, setImageInfoByUrl] = useState<Record<string, RemoteImageInfo>>({});
   const [imageDimsByUrl, setImageDimsByUrl] = useState<Record<string, ImageDimensions>>({});

   const [creatingThumbForItemId, setCreatingThumbForItemId] = useState<string | null>(null);
   const [creatingThumbInForm, setCreatingThumbInForm] = useState(false);
   const [thumbProgressByItemId, setThumbProgressByItemId] = useState<Record<string, ThumbProgress>>({});
   const [thumbProgressInForm, setThumbProgressInForm] = useState<ThumbProgress | null>(null);

   const THUMB_MAX_DIM = 200;
   const THUMB_MAX_MB = 0.03;
   const THUMB_QUALITY = 0.55;

   const formatBytes = (bytes: number | null | undefined) => {
      if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return '—';
      const units = ['B', 'KB', 'MB', 'GB'];
      let v = bytes;
      let i = 0;
      while (v >= 1024 && i < units.length - 1) {
         v /= 1024;
         i++;
      }
      const fixed = i === 0 ? 0 : (v >= 100 ? 0 : v >= 10 ? 1 : 2);
      return `${v.toFixed(fixed)} ${units[i]}`;
   };

   const formatDims = (dims: ImageDimensions | undefined) => {
      if (!dims?.width || !dims?.height) return '—';
      return `${dims.width}×${dims.height}`;
   };

   const recordImgDims = (url: string, img: HTMLImageElement) => {
      const width = img.naturalWidth || 0;
      const height = img.naturalHeight || 0;
      if (!width || !height) return;
      setImageDimsByUrl((prev) => {
         const existing = prev[url];
         if (existing?.width === width && existing?.height === height) return prev;
         return { ...prev, [url]: { width, height } };
      });
   };

   const getRemoteImageInfo = async (url: string): Promise<RemoteImageInfo> => {
      const res = await fetch(`/api/proxy-image-info?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
         throw new Error('Failed to read image info');
      }
      const json = await res.json();
      return {
         contentType: typeof json?.contentType === 'string' ? json.contentType : null,
         contentLength: typeof json?.contentLength === 'number' ? json.contentLength : null,
      };
   };

   const getItemImageUrls = (it: FabricItem): string[] => {
      const urls = Array.isArray((it as any).imageUrls)
         ? (((it as any).imageUrls as string[]) || []).filter(Boolean)
         : [];
      if (it.imageUrl && !urls.includes(it.imageUrl)) urls.push(it.imageUrl);
      return urls;
   };

   const getItemThumbnailUrls = (it: FabricItem): string[] => {
      const urls = Array.isArray((it as any).thumbnailUrls)
         ? (((it as any).thumbnailUrls as string[]) || []).slice()
         : [];
      if (it.thumbnailUrl) {
         if (!urls[0]) urls[0] = it.thumbnailUrl;
      }
      return urls;
   };

   const getImagePairs = (it: FabricItem): Array<{ full: string; thumb: string }> => {
      const full = getItemImageUrls(it);
      const thumbs = getItemThumbnailUrls(it);
      return full.map((u, idx) => ({ full: u, thumb: thumbs[idx] || u }));
   };

   const openViewerForItem = (it: FabricItem) => {
      const urls = getItemImageUrls(it);
      setViewingItem(it);
      setViewingImageUrl(urls[0] || null);
   };

   const fetchImageBlob = async (sourceUrl: string) => {
      if (sourceUrl.startsWith('gs://')) {
         throw new Error('رابط الصورة غير صالح (gs://). يجب أن يكون رابط تحميل (https)');
      }

      const tryProxyFirst = (() => {
         try {
            // Relative URLs (same-origin) are safe to fetch directly
            if (sourceUrl.startsWith('/')) return false;
            const u = new URL(sourceUrl);
            // Same-origin: fetch directly
            if (u.origin === window.location.origin) return false;
            // In local dev, proxy all cross-origin image fetches to avoid CORS failures
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return true;
            // Otherwise, only proxy known problematic hosts
            return u.hostname === 'firebasestorage.googleapis.com' || u.hostname === 'storage.googleapis.com';
         } catch {
            // If URL parsing fails, fall back to direct fetch attempt
            return false;
         }
      })();

      const fetchViaProxy = async () => {
         const proxied = `/api/proxy-image?url=${encodeURIComponent(sourceUrl)}`;
         const res2 = await fetch(proxied);
         if (!res2.ok) {
            const txt = await res2.text().catch(() => '');
            throw new Error(txt || 'Failed to fetch');
         }
         return await res2.blob();
      };

      if (tryProxyFirst) {
         return await fetchViaProxy();
      }

      try {
         const res = await fetch(sourceUrl);
         if (!res.ok) throw new Error('فشل تحميل الصورة');
         return await res.blob();
      } catch {
         return await fetchViaProxy();
      }
   };

   const createThumbnailFromUrl = async (sourceUrl: string) => {
      const blob = await fetchImageBlob(sourceUrl);
      const nameGuess = `image_${Date.now()}`;
      const file = new File([blob], nameGuess, { type: blob.type || 'image/jpeg' });

      const thumbnailOptions: any = {
         maxSizeMB: THUMB_MAX_MB,
         maxWidthOrHeight: THUMB_MAX_DIM,
         useWebWorker: true,
         fileType: 'image/webp',
         initialQuality: THUMB_QUALITY,
      };

      return await imageCompression(file, thumbnailOptions);
   };

   useEffect(() => {
      if (!viewingItem) {
         setViewingImageUrl(null);
         return;
      }
      const urls = getItemImageUrls(viewingItem);
      if (!urls.length) {
         setViewingImageUrl(null);
         return;
      }
      if (!viewingImageUrl || !urls.includes(viewingImageUrl)) {
         setViewingImageUrl(urls[0]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [viewingItem]);

   useEffect(() => {
      if (!viewingItem) return;
      const pairs = getImagePairs(viewingItem);
      const selected = pairs.find((p) => p.full === viewingImageUrl) || pairs[0];
      if (!selected?.full) return;

      const urlsToCheck = [selected.full, selected.thumb].filter(Boolean);
      urlsToCheck.forEach((u) => {
         if (imageInfoByUrl[u]) return;
         getRemoteImageInfo(u)
            .then((info) => {
               setImageInfoByUrl((prev) => ({ ...prev, [u]: info }));
            })
            .catch(() => {
               // ignore
            });
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [viewingItem, viewingImageUrl]);

   const arrayMove = <T,>(arr: T[], from: number, to: number) => {
      const a = arr.slice();
      if (from < 0 || from >= a.length) return a;
      if (to < 0 || to >= a.length) return a;
      const [it] = a.splice(from, 1);
      a.splice(to, 0, it);
      return a;
   };

   const moveImage = (from: number, to: number) => {
      setItemForm((prev) => ({
         ...prev,
         imageUrls: arrayMove(prev.imageUrls || [], from, to),
      }));
   };

   const setAsCoverImage = (idx: number) => {
      setItemForm((prev) => {
         const urls = prev.imageUrls || [];
         if (idx <= 0 || idx >= urls.length) return prev;
         return { ...prev, imageUrls: arrayMove(urls, idx, 0) };
      });
   };

   const buildCategoryPrefix = (cat: Pick<FabricCategory, 'name' | 'nameAr'> | null | undefined) => {
      const source = (cat?.name || '').trim();
      const cleaned = source.replace(/[^A-Za-z0-9]+/g, ' ').trim();
      const compact = cleaned.replace(/\s+/g, '');
      const prefix = (compact.slice(0, 3) || 'FAB').toUpperCase();
      return prefix;
   };

   const padSeq = (n: number) => {
      if (!Number.isFinite(n) || n <= 0) return '001';
      if (n < 10) return `00${n}`;
      if (n < 100) return `0${n}`;
      return String(n);
   };

   const previewNextFabricCode = async (categoryId: string) => {
      try {
         const catRef = doc(db, 'fabricCategories', categoryId);
         const snap = await getDoc(catRef);
         const data: any = snap.exists() ? snap.data() : {};
         const prefix = buildCategoryPrefix({ name: data?.name || '', nameAr: data?.nameAr || '' });
         const nextSeq = typeof data?.nextSeq === 'number' && data.nextSeq > 0 ? data.nextSeq : 1;
         return `${prefix}-${padSeq(nextSeq)}`;
      } catch {
         return 'FAB-001';
      }
   };

   const { status: authStatus } = useAuth();
   const isFirebaseAuthed = authStatus === 'authenticated';

   const loadCategories = async () => {
      setLoading(true);
      setUiError(null);
      try {
         const q = query(collection(db, 'fabricCategories'), orderBy('order', 'asc'));
         const snap = await getDocs(q);
         const cats = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FabricCategory[];
         setCategories(cats);
         if (!selectedCategoryId && cats.length > 0) setSelectedCategoryId(cats[0].id);
      } catch (e: any) {
         console.error('Error loading fabric categories:', e);
         setUiError(e?.message || 'تعذر تحميل أقسام الأقمشة');
      } finally {
         setLoading(false);
      }
   };

   const loadItems = async (categoryId: string) => {
      setLoading(true);
      setUiError(null);
      try {
         const q = query(
            collection(db, 'fabricItems'),
            where('categoryId', '==', categoryId),
            orderBy('name', 'asc')
         );
         const snap = await getDocs(q);
         const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FabricItem[];
         setItems(rows);
      } catch (e: any) {
         console.error('Error loading fabric items:', e);
         setUiError(e?.message || 'تعذر تحميل الأقمشة');
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      loadCategories();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   useEffect(() => {
      if (!selectedCategoryId) {
         setItems([]);
         return;
      }
      loadItems(selectedCategoryId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [selectedCategoryId]);

   const handleSaveCategory = async () => {
      setUiError(null);
      try {
         if (!categoryForm.name.trim() && !categoryForm.nameAr.trim()) {
            alert('يرجى إدخال اسم القسم');
            return;
         }

         if (categoryForm.id) {
            await updateDoc(doc(db, 'fabricCategories', categoryForm.id), {
               name: categoryForm.name.trim(),
               nameAr: categoryForm.nameAr.trim(),
               description: categoryForm.description.trim(),
               order: Number(categoryForm.order) || 0,
               updatedAt: Timestamp.now(),
            });
         } else {
            const created = await addDoc(collection(db, 'fabricCategories'), {
               name: categoryForm.name.trim(),
               nameAr: categoryForm.nameAr.trim(),
               description: categoryForm.description.trim(),
               order: Number(categoryForm.order) || 0,
               createdAt: Timestamp.now(),
            });
            setSelectedCategoryId(created.id);
         }

         setShowCategoryForm(false);
         setCategoryForm({ id: '', name: '', nameAr: '', description: '', order: 0 });
         await loadCategories();
      } catch (e: any) {
         console.error('Error saving fabric category:', e);
         setUiError(e?.message || 'فشل حفظ القسم');
         alert('فشل حفظ القسم');
      }
   };

   const handleDeleteCategory = async (categoryId: string) => {
      const shouldDelete = await confirm({
         title: 'حذف القسم',
         message: 'هل تريد حذف هذا القسم؟',
         confirmText: 'حذف',
         cancelText: 'إلغاء',
         danger: true,
      });
      if (!shouldDelete) return;
      setUiError(null);
      try {
         await deleteDoc(doc(db, 'fabricCategories', categoryId));
         if (selectedCategoryId === categoryId) setSelectedCategoryId(null);
         await loadCategories();
      } catch (e: any) {
         console.error('Error deleting fabric category:', e);
         setUiError(e?.message || 'فشل حذف القسم');
         alert('فشل حذف القسم');
      }
   };

   const handleImageUpload = async (files: FileList | File[]) => {
      if (!isFirebaseAuthed) {
         alert('لا يمكنك رفع الصور بدون تسجيل الدخول.');
         return;
      }
      setUploadingImage(true);
      setUiError(null);
      try {
         const arr = Array.from(files as any);
         if (arr.length === 0) return;

         const uploadedUrls: string[] = [];
         const uploadedThumbUrls: string[] = [];
         for (const file of arr) {
            const safeName = String(file.name || 'image').replace(/[^A-Za-z0-9._-]+/g, '_');
            const baseId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const fileName = `fabrics/${baseId}_${safeName}`;
            const r = storageRef(storage, fileName);
            await uploadBytes(r, file);
            const url = await getDownloadURL(r);
            uploadedUrls.push(url);

            // Create & upload thumbnail (best-effort)
            try {
               const thumbnailOptions: any = {
                  maxSizeMB: THUMB_MAX_MB,
                  maxWidthOrHeight: THUMB_MAX_DIM,
                  useWebWorker: true,
                  fileType: 'image/webp',
                  initialQuality: THUMB_QUALITY,
               };
               const thumbFile = await imageCompression(file, thumbnailOptions);
               const thumbName = `fabrics/${baseId}_thumb.webp`;
               const tr = storageRef(storage, thumbName);
               await uploadBytes(tr, thumbFile);
               const thumbUrl = await getDownloadURL(tr);
               uploadedThumbUrls.push(thumbUrl);
            } catch (err) {
               console.warn('Thumbnail generation failed (fabric upload):', err);
               uploadedThumbUrls.push('');
            }
         }

         setItemForm((prev) => {
            const prevThumbs: string[] = Array.isArray((prev as any).thumbnailUrls)
               ? (((prev as any).thumbnailUrls as string[]) || [])
               : [];
            return {
               ...(prev as any),
               imageUrls: [...(prev.imageUrls || []), ...uploadedUrls],
               thumbnailUrls: [...prevThumbs, ...uploadedThumbUrls],
            } as any;
         });
      } catch (e: any) {
         console.error('Error uploading fabric image:', e);
         setUiError(e?.message || 'فشل رفع الصورة');
         alert('فشل رفع الصورة');
      } finally {
         setUploadingImage(false);
      }
   };

   const removeImageAt = (idx: number) => {
      setItemForm((prev) => ({
         ...prev,
         imageUrls: (prev.imageUrls || []).filter((_, i) => i !== idx),
      }));
   };

   const ensureThumbnailsForItemInForm = async () => {
      if (!isFirebaseAuthed) return;
      if (!itemForm.id) {
         alert('هذه الميزة تعمل على الأقمشة المحفوظة فقط. احفظ القماش أولاً.');
         return;
      }
      const urls = (itemForm.imageUrls || []).filter(Boolean);
      if (!urls.length) {
         alert('لا توجد صور لإنشاء مصغرات');
         return;
      }

      setCreatingThumbInForm(true);
      setThumbProgressInForm({ done: 0, total: (itemForm.imageUrls || []).filter(Boolean).length });
      setUiError(null);
      try {
         const currentThumbs: string[] = Array.isArray((itemForm as any).thumbnailUrls)
            ? (((itemForm as any).thumbnailUrls as string[]) || [])
            : [];

         const nextThumbs: string[] = [];
         for (let i = 0; i < urls.length; i++) {
            const existing = currentThumbs[i];
            if (existing) {
               nextThumbs[i] = existing;
               setThumbProgressInForm((p) => (p ? { ...p, done: Math.min(p.done + 1, p.total) } : p));
               continue;
            }
            const thumbFile = await createThumbnailFromUrl(urls[i]);
            const thumbName = `fabrics/${itemForm.id}_${Date.now()}_${i}_thumb.webp`;
            const tr = storageRef(storage, thumbName);
            await uploadBytes(tr, thumbFile);
            const thumbUrl = await getDownloadURL(tr);
            nextThumbs[i] = thumbUrl;
            setThumbProgressInForm((p) => (p ? { ...p, done: Math.min(p.done + 1, p.total) } : p));
         }

         await updateDoc(doc(db, 'fabricItems', itemForm.id), {
            thumbnailUrls: nextThumbs.map((u) => (typeof u === 'string' ? u : '')),
            thumbnailUrl: (nextThumbs[0] || ''),
            updatedAt: Timestamp.now(),
         });

         setItemForm((p) => ({ ...(p as any), thumbnailUrls: nextThumbs.map((u) => (typeof u === 'string' ? u : '')) } as any));
         if (selectedCategoryId) await loadItems(selectedCategoryId);
      } catch (e: any) {
         console.error('Error creating fabric thumbnails:', e);
         setUiError(e?.message || 'فشل إنشاء المصغرات');
         alert(e?.message || 'فشل إنشاء المصغرات');
      } finally {
         setCreatingThumbInForm(false);
         setThumbProgressInForm(null);
      }
   };

   const ensureThumbnailsForItem = async (it: FabricItem) => {
      if (!isFirebaseAuthed) return;
      const urls = getItemImageUrls(it);
      if (!urls.length) return;

      setCreatingThumbForItemId(it.id);
      setThumbProgressByItemId((prev) => ({ ...prev, [it.id]: { done: 0, total: urls.length } }));
      setUiError(null);
      try {
         const existingThumbs = getItemThumbnailUrls(it);
         const nextThumbs: string[] = [];
         for (let i = 0; i < urls.length; i++) {
            const existing = existingThumbs[i];
            if (existing) {
               nextThumbs[i] = existing;
               setThumbProgressByItemId((prev) => {
                  const p = prev[it.id];
                  if (!p) return prev;
                  return { ...prev, [it.id]: { ...p, done: Math.min(p.done + 1, p.total) } };
               });
               continue;
            }
            const thumbFile = await createThumbnailFromUrl(urls[i]);
            const thumbName = `fabrics/${it.id}_${Date.now()}_${i}_thumb.webp`;
            const tr = storageRef(storage, thumbName);
            await uploadBytes(tr, thumbFile);
            const thumbUrl = await getDownloadURL(tr);
            nextThumbs[i] = thumbUrl;
            setThumbProgressByItemId((prev) => {
               const p = prev[it.id];
               if (!p) return prev;
               return { ...prev, [it.id]: { ...p, done: Math.min(p.done + 1, p.total) } };
            });
         }

         await updateDoc(doc(db, 'fabricItems', it.id), {
            thumbnailUrls: nextThumbs.map((u) => (typeof u === 'string' ? u : '')),
            thumbnailUrl: (nextThumbs[0] || ''),
            updatedAt: Timestamp.now(),
         });
         if (selectedCategoryId) await loadItems(selectedCategoryId);
      } catch (e: any) {
         console.error('Error creating fabric thumbnails:', e);
         setUiError(e?.message || 'فشل إنشاء المصغرات');
         alert(e?.message || 'فشل إنشاء المصغرات');
      } finally {
         setCreatingThumbForItemId(null);
         setThumbProgressByItemId((prev) => {
            const copy = { ...prev };
            delete copy[it.id];
            return copy;
         });
      }
   };

   const handleSaveItem = async (opts?: { andAddNew?: boolean }) => {
      setUiError(null);
      try {
         if (!itemForm.categoryId) {
            alert('يرجى اختيار القسم أولاً');
            return;
         }
         if (!itemForm.name.trim() && !itemForm.nameAr.trim()) {
            alert('يرجى إدخال اسم القماش');
            return;
         }

         if (itemForm.id) {
            // Update existing item: keep user-provided code (no resequencing)
            const normalizedThumbUrls: string[] = Array.isArray((itemForm as any).thumbnailUrls)
               ? (((itemForm as any).thumbnailUrls as string[]) || []).map((u) => (typeof u === 'string' ? u : ''))
               : [];
            const payload: any = {
               categoryId: itemForm.categoryId,
               name: itemForm.name.trim(),
               nameAr: itemForm.nameAr.trim(),
               imageUrls: Array.isArray(itemForm.imageUrls) ? itemForm.imageUrls.filter(Boolean) : [],
               imageUrl: (Array.isArray(itemForm.imageUrls) && itemForm.imageUrls[0]) ? itemForm.imageUrls[0] : '',
               thumbnailUrls: normalizedThumbUrls,
               thumbnailUrl: normalizedThumbUrls[0] || '',
               code: (itemForm.code || '').trim(),
               type: itemForm.type.trim(),
               color: itemForm.color.trim(),
               stock: Number(itemForm.stock) || 0,
               pricePerMeter: Number(itemForm.pricePerMeter) || 0,
            };
            await updateDoc(doc(db, 'fabricItems', itemForm.id), {
               ...payload,
               updatedAt: Timestamp.now(),
            });
         } else {
            // Create new item: assign category prefix + short sequential code atomically
            await runTransaction(db, async (tx) => {
               const catRef = doc(db, 'fabricCategories', itemForm.categoryId);
               const catSnap = await tx.get(catRef);
               const catData: any = catSnap.exists() ? catSnap.data() : {};
               const prefix = buildCategoryPrefix({ name: catData?.name || '', nameAr: catData?.nameAr || '' });
               const nextSeq = typeof catData?.nextSeq === 'number' && catData.nextSeq > 0 ? catData.nextSeq : 1;
               const code = `${prefix}-${padSeq(nextSeq)}`;

               const normalizedThumbUrls: string[] = Array.isArray((itemForm as any).thumbnailUrls)
                  ? (((itemForm as any).thumbnailUrls as string[]) || []).map((u) => (typeof u === 'string' ? u : ''))
                  : [];

               const itemRef = doc(collection(db, 'fabricItems'));
               tx.set(itemRef, {
                  categoryId: itemForm.categoryId,
                  name: itemForm.name.trim(),
                  nameAr: itemForm.nameAr.trim(),
                  imageUrls: Array.isArray(itemForm.imageUrls) ? itemForm.imageUrls.filter(Boolean) : [],
                  imageUrl: (Array.isArray(itemForm.imageUrls) && itemForm.imageUrls[0]) ? itemForm.imageUrls[0] : '',
                  thumbnailUrls: normalizedThumbUrls,
                  thumbnailUrl: normalizedThumbUrls[0] || '',
                  code: (itemForm.code || '').trim() || code,
                  type: itemForm.type.trim(),
                  color: itemForm.color.trim(),
                  stock: Number(itemForm.stock) || 0,
                  pricePerMeter: Number(itemForm.pricePerMeter) || 0,
                  createdAt: Timestamp.now(),
               });
               tx.set(catRef, { nextSeq: nextSeq + 1 }, { merge: true });
            });
         }

         if (selectedCategoryId) await loadItems(selectedCategoryId);

         if (opts?.andAddNew) {
            const nextCode = await previewNextFabricCode(itemForm.categoryId);
            setCodeTouched(false);
            codeTouchedRef.current = false;
            setItemForm({
               id: '',
               categoryId: itemForm.categoryId,
               name: '',
               nameAr: '',
               imageUrls: [],
               code: nextCode,
               type: '',
               color: '',
               stock: 0,
               pricePerMeter: 0,
            });
         } else {
            setShowItemForm(false);
            setCodeTouched(false);
            codeTouchedRef.current = false;
            setItemForm({ id: '', categoryId: '', name: '', nameAr: '', imageUrls: [], code: '', type: '', color: '', stock: 0, pricePerMeter: 0 });
         }
      } catch (e: any) {
         console.error('Error saving fabric item:', e);
         setUiError(e?.message || 'فشل حفظ القماش');
         alert('فشل حفظ القماش');
      }
   };

   const handleDeleteItem = async (itemId: string) => {
      const shouldDelete = await confirm({
         title: 'حذف القماش',
         message: 'هل تريد حذف هذا القماش؟',
         confirmText: 'حذف',
         cancelText: 'إلغاء',
         danger: true,
      });
      if (!shouldDelete) return;
      setUiError(null);
      try {
         await deleteDoc(doc(db, 'fabricItems', itemId));
         if (selectedCategoryId) await loadItems(selectedCategoryId);
      } catch (e: any) {
         console.error('Error deleting fabric item:', e);
         setUiError(e?.message || 'فشل حذف القماش');
         alert('فشل حذف القماش');
      }
   };

   const selectedCategory = useMemo(() => categories.find((c) => c.id === selectedCategoryId) || null, [categories, selectedCategoryId]);

   return (
      <div className="space-y-6" dir="rtl">
         <div className="flex items-center justify-between">
            <div>
               <h2 className="text-xl font-bold text-slate-800 dark:text-white">مكتبة الأقمشة</h2>
               <p className="text-sm text-slate-500 dark:text-slate-400">إدارة أقسام وأصناف الأقمشة</p>
            </div>
            <Button
               size="sm"
               onClick={() => {
                  setCategoryForm({ id: '', name: '', nameAr: '', description: '', order: categories.length });
                  setShowCategoryForm(true);
               }}
               disabled={!isFirebaseAuthed}
            >
               إضافة قسم
            </Button>
         </div>

         {!isFirebaseAuthed && (
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm">
               لا يمكنك التعديل لأنك غير مسجل دخولًا في Firebase (لا يوجد auth token). سجّل الدخول بحساب الأدمن من شاشة /admin.
            </div>
         )}

         {uiError && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
               {uiError}
            </div>
         )}

         <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
               {loading && categories.length === 0 ? (
                  <div className="text-sm text-slate-500">جارٍ التحميل...</div>
               ) : categories.length === 0 ? (
                  <div className="text-sm text-slate-500">لا توجد أقسام بعد</div>
               ) : (
                  categories.map((cat) => (
                     <div
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                           selectedCategoryId === cat.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                     >
                        <div className="flex items-start justify-between">
                           <div>
                              <div className="font-bold text-slate-900 dark:text-white">{cat.nameAr || cat.name}</div>
                              {cat.description && <div className="text-xs text-slate-500 mt-1">{cat.description}</div>}
                           </div>
                           <div className="flex gap-1">
                              <button
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    setCategoryForm({
                                       id: cat.id,
                                       name: cat.name || '',
                                       nameAr: cat.nameAr || '',
                                       description: cat.description || '',
                                       order: Number(cat.order) || 0,
                                    });
                                    setShowCategoryForm(true);
                                 }}
                                 className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                                 disabled={!isFirebaseAuthed}
                              >
                                 <Pencil size={14} />
                              </button>
                              <button
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCategory(cat.id);
                                 }}
                                 className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600"
                                 disabled={!isFirebaseAuthed}
                              >
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        </div>
                     </div>
                  ))
               )}
            </div>
         </div>

         {selectedCategory && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
               <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">الأقمشة في قسم: {selectedCategory.nameAr || selectedCategory.name}</h3>
                  <Button
                     size="sm"
                     onClick={() => {
                        // optimistic default; then load preview from category counter
                        setCodeTouched(false);
                        codeTouchedRef.current = false;
                        setItemForm({ id: '', categoryId: selectedCategory.id, name: '', nameAr: '', imageUrls: [], code: '...', type: '', color: '', stock: 0, pricePerMeter: 0 });
                        setShowItemForm(true);
                        previewNextFabricCode(selectedCategory.id).then((nextCode) => {
                           setItemForm((p) => {
                              if (p.id) return p;
                              if (codeTouchedRef.current) return p;
                              if (p.code && p.code !== '...') return p;
                              return { ...p, code: nextCode };
                           });
                        });
                     }}
                     disabled={!isFirebaseAuthed}
                  >
                     إضافة قماش
                  </Button>
               </div>

               {loading && items.length === 0 ? (
                  <div className="text-sm text-slate-500">جارٍ التحميل...</div>
               ) : items.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">لا توجد أقمشة في هذا القسم</div>
               ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                     {items.map((it) => (
                        <div
                           key={it.id}
                           className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer"
                           onClick={() => openViewerForItem(it)}
                        >
                           <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-900">
                              {(() => {
                                 const pairs = getImagePairs(it);
                                 const cover = pairs[0]?.thumb;
                                 if (!cover) return null;
                                 return <img src={cover} alt={it.name} className="w-full h-full object-cover" />;
                              })()}
                           </div>
                           <div className="p-3">
                              <div className="flex items-start justify-between">
                                 <div>
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{it.nameAr || it.name}</h4>
                                    {it.code ? <p className="text-[10px] text-slate-500 font-mono">{it.code}</p> : null}
                                    {(it.type || it.color) ? <p className="text-[10px] text-slate-500">{it.type || ''}{it.type && it.color ? ' • ' : ''}{it.color || ''}</p> : null}
                                 </div>
                                 <div className="flex gap-1">
                                    <button
                                       type="button"
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          openViewerForItem(it);
                                       }}
                                       className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                                       title="عرض الصور"
                                    >
                                       <Eye size={14} />
                                    </button>
                                    <button
                                       type="button"
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          ensureThumbnailsForItem(it);
                                       }}
                                       className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                                       title="إنشاء مصغرات (للصور القديمة)"
                                       disabled={!isFirebaseAuthed || creatingThumbForItemId === it.id}
                                    >
                                       {creatingThumbForItemId === it.id ? (
                                          <span className="text-[10px] font-bold">
                                             {thumbProgressByItemId[it.id]?.done ?? 0}/{thumbProgressByItemId[it.id]?.total ?? 0}
                                          </span>
                                       ) : (
                                          <span className="text-[10px] font-bold">TH</span>
                                       )}
                                    </button>
                                    <button
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          setItemForm({
                                             id: it.id,
                                             categoryId: it.categoryId,
                                             name: it.name || '',
                                             nameAr: it.nameAr || '',
                                             imageUrls: Array.isArray((it as any).imageUrls)
                                                ? ((it as any).imageUrls as string[]).filter(Boolean)
                                                : (it.imageUrl ? [it.imageUrl] : []),
                                             thumbnailUrls: Array.isArray((it as any).thumbnailUrls)
                                                ? ((it as any).thumbnailUrls as string[])
                                                : (it.thumbnailUrl ? [it.thumbnailUrl] : []),
                                             code: it.code || '',
                                             type: it.type || '',
                                             color: it.color || '',
                                             stock: Number(it.stock) || 0,
                                             pricePerMeter: Number(it.pricePerMeter) || 0,
                                          });
                                          setCodeTouched(false);
                                          codeTouchedRef.current = false;
                                          setShowItemForm(true);
                                       }}
                                       className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                                       disabled={!isFirebaseAuthed}
                                    >
                                       <Pencil size={14} />
                                    </button>
                                    <button
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteItem(it.id);
                                       }}
                                       className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600"
                                       disabled={!isFirebaseAuthed}
                                    >
                                       <Trash2 size={14} />
                                    </button>
                                 </div>
                              </div>

                              {(it.stock || it.pricePerMeter) ? (
                                 <div className="mt-2 flex gap-3 text-[10px]">
                                    {it.stock ? (
                                       <div>
                                          <span className="text-slate-500">المخزون:</span>{' '}
                                          <span className="font-bold">{it.stock}م</span>
                                       </div>
                                    ) : null}
                                    {it.pricePerMeter ? (
                                       <div>
                                          <span className="text-slate-500">السعر:</span>{' '}
                                          <span className="font-bold text-green-600">{it.pricePerMeter} ر.ع</span>
                                       </div>
                                    ) : null}
                                 </div>
                              ) : null}
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         )}

         {showCategoryForm && (
            <Modal
               isOpen={showCategoryForm}
               onClose={() => setShowCategoryForm(false)}
               title={categoryForm.id ? 'تعديل القسم' : 'إضافة قسم جديد'}
               debugId="ADMIN-FABRIC-CATEGORY"
            >
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-bold mb-2">الاسم بالإنجليزية</label>
                     <input
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        placeholder="Cotton, Silk, etc."
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-bold mb-2">الاسم بالعربية</label>
                     <input
                        value={categoryForm.nameAr}
                        onChange={(e) => setCategoryForm((p) => ({ ...p, nameAr: e.target.value }))}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        placeholder="قطن، حرير، إلخ"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-bold mb-2">الوصف</label>
                     <textarea
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm((p) => ({ ...p, description: e.target.value }))}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        rows={3}
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-bold mb-2">الترتيب</label>
                     <input
                        type="number"
                        value={categoryForm.order}
                        onChange={(e) => setCategoryForm((p) => ({ ...p, order: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                     />
                  </div>
                  <div className="flex gap-3">
                     <Button onClick={handleSaveCategory}>حفظ</Button>
                     <Button variant="secondary" onClick={() => setShowCategoryForm(false)}>إلغاء</Button>
                  </div>
               </div>
            </Modal>
         )}

         {showItemForm && (
            <Modal
               isOpen={showItemForm}
               onClose={() => setShowItemForm(false)}
               title={itemForm.id ? 'تعديل القماش' : 'إضافة قماش جديد'}
               debugId="ADMIN-FABRIC-ITEM"
               maxWidth="max-w-2xl"
            >
               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-sm font-bold mb-2">الاسم بالإنجليزية</label>
                        <input
                           value={itemForm.name}
                           onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))}
                           className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold mb-2">الاسم بالعربية</label>
                        <input
                           value={itemForm.nameAr}
                           onChange={(e) => setItemForm((p) => ({ ...p, nameAr: e.target.value }))}
                           className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                     </div>
                  </div>

                  <div>
                        <label className="block text-sm font-bold mb-2">صور القماش</label>
                     <input
                        type="file"
                        accept="image/*"
                           multiple
                           onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        disabled={uploadingImage || !isFirebaseAuthed}
                     />
                     {uploadingImage ? <p className="text-xs text-blue-600 mt-2">جارِ الرفع...</p> : null}
                     <div className="mt-2 flex justify-start">
                        <Button
                           variant="outline"
                           size="sm"
                           onClick={ensureThumbnailsForItemInForm}
                           disabled={!isFirebaseAuthed || creatingThumbInForm}
                        >
                           {creatingThumbInForm
                              ? `جارِ إنشاء المصغرات... (${thumbProgressInForm?.done ?? 0}/${thumbProgressInForm?.total ?? 0})`
                              : 'إنشاء مصغرات للصور القديمة'}
                        </Button>
                     </div>
                     {Array.isArray(itemForm.imageUrls) && itemForm.imageUrls.length > 0 ? (
                        <div className="mt-3 grid grid-cols-4 gap-2">
                           {itemForm.imageUrls.map((url, idx) => (
                              <div key={url + idx} className="relative">
                                 <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-20 object-cover rounded-lg border" />
                                 <div className="absolute bottom-1 left-1 flex gap-1">
                                    <button
                                       type="button"
                                       onClick={() => moveImage(idx, idx - 1)}
                                       className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white"
                                       disabled={!isFirebaseAuthed || idx === 0}
                                       title="السابق"
                                    >
                                       ‹
                                    </button>
                                    <button
                                       type="button"
                                       onClick={() => moveImage(idx, idx + 1)}
                                       className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white"
                                       disabled={!isFirebaseAuthed || idx === itemForm.imageUrls.length - 1}
                                       title="التالي"
                                    >
                                       ›
                                    </button>
                                    <button
                                       type="button"
                                       onClick={() => setAsCoverImage(idx)}
                                       className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white"
                                       disabled={!isFirebaseAuthed || idx === 0}
                                       title="تعيين كصورة أساسية"
                                    >
                                       أساسي
                                    </button>
                                 </div>
                                 <button
                                    type="button"
                                    onClick={() => removeImageAt(idx)}
                                    className="absolute top-1 left-1 text-xs px-1.5 py-0.5 rounded bg-black/60 text-white"
                                    disabled={!isFirebaseAuthed}
                                 >
                                    ×
                                 </button>
                              </div>
                           ))}
                        </div>
                     ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-sm font-bold mb-2">الكود</label>
                        <input
                           value={itemForm.code}
                              onChange={(e) => {
                                 setCodeTouched(true);
                                 codeTouchedRef.current = true;
                                 setItemForm((p) => ({ ...p, code: e.target.value }));
                              }}
                           className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                           placeholder="FAB-001"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold mb-2">النوع</label>
                        <input
                           value={itemForm.type}
                           onChange={(e) => setItemForm((p) => ({ ...p, type: e.target.value }))}
                           className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                           placeholder="Cotton, Silk, etc."
                        />
                     </div>
                  </div>

                     <div className="flex justify-start">
                        <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                              const code = (itemForm.code || '').trim();
                              if (!code) return;
                              setItemForm((p) => ({ ...p, name: code, nameAr: code }));
                           }}
                           disabled={!itemForm.code.trim()}
                        >
                           استخدام الكود كاسم (عربي/إنجليزي)
                        </Button>
                     </div>

                  <div className="grid grid-cols-3 gap-3">
                     <div>
                        <label className="block text-sm font-bold mb-2">اللون</label>
                        <input
                           value={itemForm.color}
                           onChange={(e) => setItemForm((p) => ({ ...p, color: e.target.value }))}
                           className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold mb-2">المخزون (متر)</label>
                        <input
                           type="number"
                           value={itemForm.stock}
                           onChange={(e) => setItemForm((p) => ({ ...p, stock: parseFloat(e.target.value) || 0 }))}
                           className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold mb-2">السعر/متر (ر.ع)</label>
                        <input
                           type="number"
                           step="0.01"
                           value={itemForm.pricePerMeter}
                           onChange={(e) => setItemForm((p) => ({ ...p, pricePerMeter: parseFloat(e.target.value) || 0 }))}
                           className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                     </div>
                  </div>

                  <div className="flex gap-3">
                     <Button onClick={() => handleSaveItem()}>حفظ</Button>
                     <Button variant="secondary" onClick={() => handleSaveItem({ andAddNew: true })}>حفظ وإضافة جديد</Button>
                     <Button variant="secondary" onClick={() => setShowItemForm(false)}>إلغاء</Button>
                  </div>
               </div>
            </Modal>
         )}

         {viewingItem && (
            <Modal
               isOpen={!!viewingItem}
               onClose={() => {
                  setViewingItem(null);
                  setViewingImageUrl(null);
               }}
               title={`عرض القماش: ${viewingItem.nameAr || viewingItem.name || ''}`}
               debugId="ADMIN-FABRIC-VIEW"
               maxWidth="max-w-4xl"
            >
               <div className="space-y-3">
                  {viewingItem.code ? (
                     <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">{viewingItem.code}</div>
                  ) : null}

                  {(() => {
                     const pairs = getImagePairs(viewingItem);
                     const selected = pairs.find((p) => p.full === viewingImageUrl) || pairs[0];

                     const fullInfo = selected?.full ? imageInfoByUrl[selected.full] : undefined;
                     const thumbInfo = selected?.thumb ? imageInfoByUrl[selected.thumb] : undefined;
                     const fullDims = selected?.full ? imageDimsByUrl[selected.full] : undefined;
                     const thumbDims = selected?.thumb ? imageDimsByUrl[selected.thumb] : undefined;

                     return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                           <div className="md:col-span-2 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                              {selected?.full ? (
                                 <div className="p-2">
                                    <img
                                       src={selected.full}
                                       alt={viewingItem.nameAr || viewingItem.name}
                                       className="w-full max-h-[70vh] object-contain"
                                       onLoad={(e) => recordImgDims(selected.full, e.currentTarget)}
                                    />
                                    <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                                       <span>Full</span>
                                       <span>{formatDims(fullDims)} • {formatBytes(fullInfo?.contentLength)}</span>
                                    </div>
                                 </div>
                              ) : (
                                 <div className="p-8 text-center text-sm text-slate-500">لا توجد صور لهذا القماش</div>
                              )}
                           </div>

                           <div className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                              {selected?.thumb ? (
                                 <div className="p-2">
                                    <img
                                       src={selected.thumb}
                                       alt="thumbnail"
                                       className="w-full max-h-[70vh] object-contain"
                                       onLoad={(e) => recordImgDims(selected.thumb, e.currentTarget)}
                                    />
                                    <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                                       <span>Thumb</span>
                                       <span>{formatDims(thumbDims)} • {formatBytes(thumbInfo?.contentLength)}</span>
                                    </div>
                                 </div>
                              ) : (
                                 <div className="p-8 text-center text-sm text-slate-500">لا توجد مصغرات بعد</div>
                              )}
                           </div>
                        </div>
                     );
                  })()}

                  {(() => {
                     const pairs = getImagePairs(viewingItem);
                     if (pairs.length <= 1) return null;
                     return (
                        <div className="flex gap-2 flex-wrap">
                           {pairs.map((p, idx) => (
                              <button
                                 type="button"
                                 key={p.full + idx}
                                 onClick={() => setViewingImageUrl(p.full)}
                                 className={`h-16 w-16 rounded-lg overflow-hidden border transition ${
                                    viewingImageUrl === p.full
                                       ? 'border-blue-500 ring-2 ring-blue-500/30'
                                       : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                 }`}
                                 title={`صورة ${idx + 1}`}
                              >
                                 <img src={p.thumb} alt={`thumb-${idx + 1}`} className="w-full h-full object-cover" />
                              </button>
                           ))}
                        </div>
                     );
                  })()}

                  <div className="flex gap-3">
                     <Button variant="secondary" onClick={() => {
                        setViewingItem(null);
                        setViewingImageUrl(null);
                     }}>إغلاق</Button>
                  </div>
               </div>
            </Modal>
         )}
         {confirmDialog}
      </div>
   );
};
