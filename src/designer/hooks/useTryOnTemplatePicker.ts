import React from 'react';
import { firebaseService } from '../../../services/firebase';
import { GARMENT_TEMPLATES } from '../templates/garmentTemplates';
import type { TemplatePickerItem } from '../components/TemplatePicker';
import { getOptimizedImageUrl, preloadImage } from '../../utils/imageOptimization';

export type GarmentTemplate = {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  enabled?: boolean;
  order?: number;
  isPremium?: boolean;
};

export const CUSTOM_UPLOAD_TEMPLATE_ID = 'custom-upload';

const isLikelyStorableUrl = (url: string): boolean => {
  if (!url) return false;
  if (url.startsWith('blob:')) return false;
  if (url.startsWith('data:image/')) return true;
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  return false;
};

// Add this helper to detect slow connections
const getNetworkStatus = () => {
  const conn = (navigator as any).connection;
  if (!conn) return { slow: false, saveData: false };
  return {
    // Treat 2g or slow-3g as "slow"
    slow: conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g',
    saveData: conn.saveData === true
  };
};

export function useTryOnTemplatePicker(params: {
  initialTemplateId?: string;
  initialTemplateImageUrl?: string | null;
  templatesProp?: GarmentTemplate[];
  isSubscribed: boolean;

  useExternalCards: boolean;
  externalTemplateImageUrl?: string | null;

  templatePickerPageSize: number;
  maxRecentTemplates: number;
  recentTemplatesStorageKey: string;
}) {
  const {
    initialTemplateId,
    templatesProp,
    isSubscribed,
    useExternalCards,
    externalTemplateImageUrl,
    templatePickerPageSize,
    maxRecentTemplates,
    recentTemplatesStorageKey,
  } = params;

  const [templates, setTemplates] = React.useState<GarmentTemplate[]>(
    Array.isArray(templatesProp) && templatesProp.length > 0 ? templatesProp : (GARMENT_TEMPLATES as any)
  );
  const [templatesLoading, setTemplatesLoading] = React.useState(false);
  
  const [userTemplates, setUserTemplates] = React.useState<GarmentTemplate[]>([]);
  const [userTemplatesLoading, setUserTemplatesLoading] = React.useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(initialTemplateId || null);
  const [customTemplateFile, setCustomTemplateFile] = React.useState<File | null>(null);
  const [customTemplatePreview, setCustomTemplatePreview] = React.useState<string | null>(null);
  const [templatePreviewLoading, setTemplatePreviewLoading] = React.useState(false);
  const templatePreviewSrcRef = React.useRef<string | null>(null);
  const templatePreviewImgElRef = React.useRef<HTMLImageElement | null>(null);

  const [templateSidePreviewLoading, setTemplateSidePreviewLoading] = React.useState(false);
  const templateSidePreviewSrcRef = React.useRef<string | null>(null);
  const templateSidePreviewImgElRef = React.useRef<HTMLImageElement | null>(null);

  const [templateDragActive, setTemplateDragActive] = React.useState(false);

  const templatePickerLeftScrollRef = React.useRef<HTMLDivElement | null>(null);

  const templateUploadInputRef = React.useRef<HTMLInputElement | null>(null);

  const [showTemplateImageLibrary, setShowTemplateImageLibrary] = React.useState(false);
  const [templatePickerPage, setTemplatePickerPage] = React.useState(1);
  const prevShowTemplateImageLibraryRef = React.useRef<boolean>(false);

  const [cachedTemplateThumbnailById, setCachedTemplateThumbnailById] = React.useState<Record<string, string>>({});
  const cachedTemplateThumbnailByIdRef = React.useRef<Record<string, string>>({});
  const cachedTemplateThumbDirtyIdsRef = React.useRef<Set<string>>(new Set());

  const thumbCacheFlushTimerRef = React.useRef<number | null>(null);
  const scheduleThumbCacheFlush = React.useCallback((mode: 'immediate' | 'debounced' = 'debounced') => {
    if (thumbCacheFlushTimerRef.current !== null) return;
    const delayMs = mode === 'immediate' ? 0 : 120;
    thumbCacheFlushTimerRef.current = window.setTimeout(() => {
      thumbCacheFlushTimerRef.current = null;

      const flush = () => {
        setCachedTemplateThumbnailById((prev) => {
          const dirtySet = cachedTemplateThumbDirtyIdsRef.current;
          if (dirtySet.size === 0) return prev;

          // Snapshot IDs to avoid dropping updates added while flushing.
          const dirtyIds = Array.from(dirtySet);

          let next: Record<string, string> | null = null;
          dirtyIds.forEach((id: string) => {
            const value = cachedTemplateThumbnailByIdRef.current[id];
            // Mark id as processed regardless; if it becomes dirty again it will be re-added.
            dirtySet.delete(id);
            if (!value) return;
            if (prev[id] === value) return;
            if (!next) next = { ...prev };
            next[id] = value;
          });
          return next ?? prev;
        });
      };

      // Make cache flush low priority to keep the picker interactions snappy.
      if (typeof (React as any).startTransition === 'function') {
        (React as any).startTransition(flush);
      } else {
        flush();
      }
    }, delayMs);
  }, []);

  React.useEffect(() => {
    return () => {
      if (thumbCacheFlushTimerRef.current !== null) {
        window.clearTimeout(thumbCacheFlushTimerRef.current);
        thumbCacheFlushTimerRef.current = null;
      }
      Object.values(cachedTemplateThumbnailByIdRef.current).forEach((url) => {
        if (typeof url === 'string' && url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(url);
          } catch {
            // ignore
          }
        }
      });
    };
  }, []);

  const cacheTemplateThumbnail = React.useCallback(async (
    id: string,
    sourceUrl: string | null | undefined,
    options?: { commit?: 'immediate' | 'debounced'; signal?: AbortSignal }
  ) => {
    if (!id || !sourceUrl) return;

    // Check in-memory cache first
    if (cachedTemplateThumbnailByIdRef.current[id]) return;

    const commitMode = options?.commit ?? 'debounced';

    // Handle blob/data URLs directly
    if (sourceUrl.startsWith('blob:') || sourceUrl.startsWith('data:image/')) {
      if (cachedTemplateThumbnailByIdRef.current[id] === sourceUrl) return;
      cachedTemplateThumbnailByIdRef.current[id] = sourceUrl;
      cachedTemplateThumbDirtyIdsRef.current.add(id);
      scheduleThumbCacheFlush(commitMode);
      return;
    }

    // Get optimized thumbnail URL (WebP, 300x400)
    // If it doesn't exist, browser's <img> error handler will fall back to original
    const optimizedUrl = getOptimizedImageUrl(sourceUrl, 'thumbnail');
    const urlToUse = optimizedUrl || sourceUrl;

    // Store URL (no preloading - let browser handle it)
    cachedTemplateThumbnailByIdRef.current[id] = urlToUse;
    cachedTemplateThumbDirtyIdsRef.current.add(id);
    scheduleThumbCacheFlush(commitMode);
  }, [scheduleThumbCacheFlush]);

  const [recentTemplates, setRecentTemplates] = React.useState<
    Array<{ id: string; imageUrl: string; thumbnailUrl?: string | null; name?: string; ts: number }>
  >([]);
  const [showAllRecents, setShowAllRecents] = React.useState(false);
  const [saveTemplateToHistory, setSaveTemplateToHistory] = React.useState(true);

  // Load templates from Firestore (admin-managed)
  React.useEffect(() => {
    let cancelled = false;
    setTemplatesLoading(true);

    (async () => {
      try {
        if (!firebaseService.isInitialized()) return;
        const list = await firebaseService.getTryOnGarmentTemplates();
        if (cancelled) return;
        const enabled = (list || []).filter((t) => t.enabled !== false);
        if (enabled.length > 0) {
          setTemplates(
            enabled.map((t) => ({
              id: t.id,
              name: t.name,
              imageUrl: t.imageUrl,
              thumbnailUrl: (t.thumbnailUrl || t.imageUrl) as any,
              enabled: t.enabled,
              order: t.order,
              isPremium: t.isPremium === true,
            }))
          );
        }
      } catch (error) {
        // Keep behavior: only log.
        console.error('Error loading try-on templates from Firestore:', error);
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load user-uploaded templates from Firestore
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!firebaseService.isInitialized()) return;
        const currentUser = firebaseService.auth?.currentUser;
        if (!currentUser?.uid) return;

        setUserTemplatesLoading(true);
        const list = await firebaseService.getUserTemplates(currentUser.uid);
        if (cancelled) return;

        if (list && list.length > 0) {
          setUserTemplates(
            list.map((t) => ({
              id: t.id,
              name: t.name,
              imageUrl: t.imageUrl,
              thumbnailUrl: (t.thumbnailUrl || t.imageUrl) as any,
              enabled: true,
              order: undefined,
              isPremium: false,
            }))
          );
        } else {
          setUserTemplates([]);
        }
      } catch (error) {
        console.error('Error loading user templates from Firestore:', error);
        setUserTemplates([]);
      } finally {
        if (!cancelled) setUserTemplatesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep template preview loading state in sync.
  React.useEffect(() => {
    if (!customTemplatePreview) {
      templatePreviewSrcRef.current = null;
      setTemplatePreviewLoading(false);
      return;
    }
    templatePreviewSrcRef.current = customTemplatePreview;
    setTemplatePreviewLoading(true);

    const el = templatePreviewImgElRef.current;
    if (el && el.src === customTemplatePreview && el.complete && el.naturalWidth > 0) {
      setTemplatePreviewLoading(false);
    }
  }, [customTemplatePreview]);

  // (Moved) Jump-to-selected-page now runs only on open, and uses curated ordering.

  // External-mode: keep panel in sync with the designer's selected template id.
  React.useEffect(() => {
    if (!useExternalCards) return;
    if (!initialTemplateId) return;
    if (showTemplateImageLibrary) return;
    setSelectedTemplateId(initialTemplateId);
  }, [useExternalCards, initialTemplateId, showTemplateImageLibrary]);

  // Load recents from localStorage on mount.
  React.useEffect(() => {
    try {
      const recentsRaw = localStorage.getItem(recentTemplatesStorageKey);
      if (recentsRaw) {
        const parsed = JSON.parse(recentsRaw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter((r) => r && typeof r.id === 'string' && typeof r.imageUrl === 'string')
            .map((r) => ({
              id: r.id as string,
              imageUrl: r.imageUrl as string,
              thumbnailUrl: (typeof r.thumbnailUrl === 'string' ? r.thumbnailUrl : null) as string | null,
              name: (typeof r.name === 'string' ? r.name : undefined) as string | undefined,
              ts: (typeof r.ts === 'number' ? r.ts : Date.now()) as number,
            }))
            .filter((r) => isLikelyStorableUrl(r.imageUrl))
            .slice(0, maxRecentTemplates);
          setRecentTemplates(cleaned);
          try {
            localStorage.setItem(recentTemplatesStorageKey, JSON.stringify(cleaned));
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }
  }, [maxRecentTemplates, recentTemplatesStorageKey]);

  const upsertRecentTemplate = React.useCallback((payload: { id?: string; imageUrl?: string; thumbnailUrl?: string | null; name?: string }) => {
    const imageUrl = payload.imageUrl || '';
    if (!imageUrl || !isLikelyStorableUrl(imageUrl)) return;
    const id = payload.id || `custom-${Date.now()}`;
    const ts = Date.now();
    setRecentTemplates((prev) => {
      const filtered = prev.filter((r) => !(r.id === id && r.imageUrl === imageUrl));
      const next = [{ id, imageUrl, thumbnailUrl: payload.thumbnailUrl ?? null, name: payload.name, ts }, ...filtered].slice(0, maxRecentTemplates);
      try {
        localStorage.setItem(recentTemplatesStorageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [maxRecentTemplates, recentTemplatesStorageKey]);

  const validateTemplateFile = React.useCallback((file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('يرجى اختيار صورة بصيغة JPG أو PNG فقط');
      return false;
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('حجم الصورة يجب أن لا يتجاوز 10 ميجابايت');
      return false;
    }
    return true;
  }, []);

  const onTemplateUpload = React.useCallback((file: File | null) => {
    setCustomTemplateFile(file);
    setSelectedTemplateId(null);
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomTemplatePreview(url);
    } else {
      setCustomTemplatePreview(null);
    }
  }, []);

  const handleTemplateDrop = React.useCallback((e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setTemplateDragActive(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateTemplateFile(file)) {
        onTemplateUpload(file);
      }
    }
  }, [onTemplateUpload, validateTemplateFile]);

  const handleTemplateDragOver = React.useCallback((e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleTemplateDragEnter = React.useCallback((e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setTemplateDragActive(true);
  }, []);

  const handleTemplateDragLeave = React.useCallback((e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setTemplateDragActive(false);
  }, []);

  const handleTemplateSelect = React.useCallback((item: { id: string; name?: string; imageUrl?: string; thumbnailUrl?: string; isPremium?: boolean; isLocked?: boolean }) => {
    if (item.isLocked) {
      const shouldSubscribe = window.confirm(
        '⭐ هذا القالب حصري للأعضاء Premium\n\nللوصول إلى جميع القوالب والميزات الحصرية، قم بالترقية إلى الاشتراك Premium.\n\nهل تريد معرفة المزيد عن الاشتراك?'
      );
      if (shouldSubscribe) {
        window.location.hash = '#/account';
      }
      return;
    }

    setSelectedTemplateId(item.id);
    setCustomTemplateFile(null);
    setCustomTemplatePreview(null);

    void cacheTemplateThumbnail(item.id, item.thumbnailUrl || item.imageUrl, { commit: 'immediate' });
  }, [cacheTemplateThumbnail]);

  const handleRecentClick = React.useCallback((item: { id: string; imageUrl: string; name?: string }) => {
    const existsInLibrary = templates.some((t) => (t as any).id === item.id);
    const isCustom = item.id.startsWith('custom-') || !existsInLibrary;
    if (isCustom) {
      setCustomTemplateFile(null);
      setCustomTemplatePreview(item.imageUrl);
      setSelectedTemplateId(null);
    } else {
      handleTemplateSelect({ id: item.id, name: item.name, imageUrl: item.imageUrl });
    }
  }, [templates, handleTemplateSelect]);

  const resolvedTemplateImageUrl = React.useMemo(() => {
    if (customTemplatePreview) return customTemplatePreview;
    if (selectedTemplateId) {
      const fromLibrary = templates.find(t => t.id === selectedTemplateId)?.imageUrl || null;
      if (fromLibrary) return fromLibrary;
    }
    if (useExternalCards) return externalTemplateImageUrl || null;
    return null;
  }, [customTemplatePreview, selectedTemplateId, templates, useExternalCards, externalTemplateImageUrl]);

  const resolvedTemplateThumbnailUrlForUi = React.useMemo(() => {
    if (customTemplatePreview) return customTemplatePreview;
    // If using external cards (like from DesignerV2), use the external URL
    if (useExternalCards) return externalTemplateImageUrl || null;
    const id = (selectedTemplateId || initialTemplateId || null) as string | null;
    if (!id) return null;
    return cachedTemplateThumbnailById[id] || null;
  }, [customTemplatePreview, useExternalCards, externalTemplateImageUrl, selectedTemplateId, initialTemplateId, cachedTemplateThumbnailById, templates]);

  // Always try to keep the currently-selected template's thumbnail cached.
  // UI preview intentionally uses ONLY the cached blob/data URL (never the real http(s) URL).
  React.useEffect(() => {
    if (customTemplatePreview) return;

    const id = (selectedTemplateId || initialTemplateId || null) as string | null;
    if (!id) return;
    if (cachedTemplateThumbnailByIdRef.current[id]) return;

    const sourceUrl = useExternalCards
      ? (externalTemplateImageUrl || null)
      : (templates.find((t) => t.id === id)?.thumbnailUrl || templates.find((t) => t.id === id)?.imageUrl || null);

    void cacheTemplateThumbnail(id, sourceUrl, { commit: 'immediate' });
  }, [customTemplatePreview, selectedTemplateId, initialTemplateId, useExternalCards, externalTemplateImageUrl, templates, cacheTemplateThumbnail]);

  // Keep right-side preview spinner in sync.
  React.useEffect(() => {
    if (!showTemplateImageLibrary) {
      templateSidePreviewSrcRef.current = null;
      setTemplateSidePreviewLoading(false);
      return;
    }
    if (!resolvedTemplateImageUrl) {
      templateSidePreviewSrcRef.current = null;
      setTemplateSidePreviewLoading(false);
      return;
    }
    templateSidePreviewSrcRef.current = resolvedTemplateImageUrl;
    setTemplateSidePreviewLoading(true);

    const el = templateSidePreviewImgElRef.current;
    if (el && el.src === resolvedTemplateImageUrl && el.complete && el.naturalWidth > 0) {
      setTemplateSidePreviewLoading(false);
    }
  }, [showTemplateImageLibrary, resolvedTemplateImageUrl]);


  const curatedTemplateItems = React.useMemo(() => {
    const userIsPremium = isSubscribed;
    
    // Admin-managed templates
    const adminTemplates: TemplatePickerItem[] = (templates || []).map((t) => ({
      id: t.id,
      name: t.name,
      imageUrl: t.imageUrl,
      thumbnailUrl: t.thumbnailUrl || t.imageUrl,
      isPremium: t.isPremium === true,
      isLocked: t.isPremium === true && !userIsPremium,
    }));

    // User-uploaded templates (always free, always available)
    const userUploads: TemplatePickerItem[] = (userTemplates || []).map((t) => ({
      id: t.id,
      name: t.name,
      imageUrl: t.imageUrl,
      thumbnailUrl: t.thumbnailUrl || t.imageUrl,
      isPremium: false,
      isLocked: false,
    }));

    // Combine: user uploads first, then admin templates
    const all = [...userUploads, ...adminTemplates];
    const free = all.filter((x) => !x.isPremium);
    const premium = all.filter((x) => x.isPremium);
    return [...free, ...premium];
  }, [templates, userTemplates, isSubscribed]);

  const prefetchTemplateThumbsInFlightRef = React.useRef<Set<string>>(new Set());
  const firstPagePrefetchKeyRef = React.useRef<string>('');
  const prefetchPickerWasOpenRef = React.useRef<boolean>(false);

  const prefetchThumbsForItems = React.useCallback((items: TemplatePickerItem[], options: {
    maxWorkers: number;
    delayMs: number;
    commit: 'immediate' | 'debounced';
    idleTimeoutMs?: number;
    schedule?: 'immediate' | 'idle';
    gapMs?: number;
  }) => {
    if (!items || items.length === 0) return () => {};

    // BANDWIDTH CHECK: Don't background download if user is on a slow connection
    const status = getNetworkStatus();
    // Only skip if strictly idle scheduling AND connection is confirmed slow/save-data
    if (options.schedule === 'idle' && (status.slow || status.saveData)) {
      return () => {};
    }

    let cancelled = false;
    const abortController = typeof AbortController !== 'undefined' ? new AbortController() : null;

    const queue = items
      .map((item) => ({ id: item.id, url: item.thumbnailUrl || item.imageUrl }))
      .filter(({ id, url }) => {
        if (!url) return false;
        if (cachedTemplateThumbnailByIdRef.current[id]) return false;
        if (prefetchTemplateThumbsInFlightRef.current.has(id)) return false;
        return true;
      });

    if (queue.length === 0) return () => {};

    // Mark queued IDs as in-flight up-front to avoid duplicate work across overlapping prefetch calls.
    // IMPORTANT: cleanup must remove any ids that were queued but never processed.
    const queuedIds = new Set(queue.map((q) => q.id));
    queuedIds.forEach((id) => prefetchTemplateThumbsInFlightRef.current.add(id));

    const runWorker = async () => {
      while (!cancelled && queue.length > 0) {
        const next = queue.shift();
        if (!next) break;

        prefetchTemplateThumbsInFlightRef.current.add(next.id);
        try {
          await cacheTemplateThumbnail(next.id, next.url, { 
            commit: options.commit, 
            signal: abortController?.signal 
          });
        } finally {
          prefetchTemplateThumbsInFlightRef.current.delete(next.id);
          queuedIds.delete(next.id);
        }
        
        // IMPORTANT: 150ms gap between downloads to prevent bandwidth spikes
        if (options.schedule === 'idle') {
          await new Promise(r => setTimeout(r, 150)); 
        }
      }
    };

    const start = async () => {
      // Use only 1 worker for background tasks to keep it silent
      const workerCount = Math.min(options.maxWorkers, queue.length);
      await Promise.all(Array.from({ length: workerCount }).map(() => runWorker()));
    };

    let timeoutId: number | null = null;
    let idleId: number | null = null;
    const scheduleMode = options.schedule ?? 'idle';
    const schedule = () => {
      if (scheduleMode === 'immediate') {
        void start();
        return;
      }

      if (typeof (window as any).requestIdleCallback === 'function') {
        idleId = (window as any).requestIdleCallback(
          () => {
            void start();
          },
          { timeout: options.idleTimeoutMs ?? 4000 }
        );
      } else {
        timeoutId = window.setTimeout(() => {
          void start();
        }, 50);
      }
    };

    timeoutId = window.setTimeout(schedule, Math.max(0, options.delayMs));

    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (idleId !== null && typeof (window as any).cancelIdleCallback === 'function') {
        (window as any).cancelIdleCallback(idleId);
      }
      try {
        abortController?.abort();
      } catch {
        // ignore
      }

      // Ensure we don't leak in-flight flags for ids that never got processed.
      queuedIds.forEach((id) => prefetchTemplateThumbsInFlightRef.current.delete(id));
    };
  }, [cacheTemplateThumbnail]);

  // On designer visit: ensure the first 20 templates are cached in the background.
  React.useEffect(() => {
    // Disabled: Background prefetching removed - only download when picker is opened
  }, [curatedTemplateItems, prefetchThumbsForItems]);

  // When opening the template library, jump to the page containing the selected template.
  // Important: do NOT re-run on every selection change, otherwise clicking a card can "jump" pages.
  React.useEffect(() => {
    const wasOpen = prevShowTemplateImageLibraryRef.current;
    prevShowTemplateImageLibraryRef.current = showTemplateImageLibrary;
    if (!showTemplateImageLibrary || wasOpen) return;

    const idx = selectedTemplateId ? curatedTemplateItems.findIndex((t) => t.id === selectedTemplateId) : -1;
    if (idx >= 0) {
      setTemplatePickerPage(Math.floor(idx / templatePickerPageSize) + 1);
    } else {
      setTemplatePickerPage(1);
    }
  }, [showTemplateImageLibrary, selectedTemplateId, curatedTemplateItems, templatePickerPageSize]);

  const templatePickerTotalPages = React.useMemo(() => {
    return Math.max(1, Math.ceil(curatedTemplateItems.length / templatePickerPageSize));
  }, [curatedTemplateItems.length, templatePickerPageSize]);

  React.useEffect(() => {
    setTemplatePickerPage((p) => Math.min(Math.max(1, p), templatePickerTotalPages));
  }, [templatePickerTotalPages]);

  const pagedCuratedTemplateItems = React.useMemo(() => {
    const start = (templatePickerPage - 1) * templatePickerPageSize;
    return curatedTemplateItems.slice(start, start + templatePickerPageSize);
  }, [curatedTemplateItems, templatePickerPage, templatePickerPageSize]);

  // When the picker is open, ensure the current page thumbnails are available.
  // Cache-first: if missing, download in the background.
  React.useEffect(() => {
    if (!showTemplateImageLibrary) return;
    if (!pagedCuratedTemplateItems || pagedCuratedTemplateItems.length === 0) return;

    // Track open transitions locally for prefetch aggressiveness.
    const wasOpen = prefetchPickerWasOpenRef.current;
    prefetchPickerWasOpenRef.current = true;

    // When picker opens, aggressively download missing images from the current page
    // Serial (1 worker) to avoid flooding, but immediate schedule for fast completion
    return prefetchThumbsForItems(pagedCuratedTemplateItems, {
      maxWorkers: 1,
      delayMs: 0,
      commit: 'immediate',
      schedule: 'immediate', // Changed back to immediate for visible images
      gapMs: 50, // Faster gap for visible items
    });
  }, [showTemplateImageLibrary, pagedCuratedTemplateItems, prefetchThumbsForItems]);

  React.useEffect(() => {
    if (showTemplateImageLibrary) return;
    prefetchPickerWasOpenRef.current = false;
  }, [showTemplateImageLibrary]);

  const resolvedTemplateIdToApply = React.useMemo(() => {
    if (customTemplatePreview) return CUSTOM_UPLOAD_TEMPLATE_ID;
    if (useExternalCards) return (initialTemplateId || null);
    return (selectedTemplateId || initialTemplateId || null);
  }, [customTemplatePreview, useExternalCards, selectedTemplateId, initialTemplateId]);

  const canSubmitTemplate = Boolean(resolvedTemplateImageUrl && resolvedTemplateIdToApply);

  return {
    templates,
    templatesLoading,

    cachedTemplateThumbnailById,

    showTemplateImageLibrary,
    setShowTemplateImageLibrary,
    templatePickerPage,
    setTemplatePickerPage,

    selectedTemplateId,
    setSelectedTemplateId,
    customTemplateFile,
    setCustomTemplateFile,
    customTemplatePreview,
    setCustomTemplatePreview,

    templateUploadInputRef,
    templateDragActive,
    handleTemplateDrop,
    handleTemplateDragOver,
    handleTemplateDragEnter,
    handleTemplateDragLeave,
    validateTemplateFile,
    onTemplateUpload,

    templatePreviewImgElRef,
    templatePreviewSrcRef,
    templatePreviewLoading,
    setTemplatePreviewLoading,

    templateSidePreviewImgElRef,
    templateSidePreviewSrcRef,
    templateSidePreviewLoading,
    setTemplateSidePreviewLoading,

    templatePickerLeftScrollRef,

    recentTemplates,
    setRecentTemplates,
    showAllRecents,
    setShowAllRecents,
    saveTemplateToHistory,
    setSaveTemplateToHistory,
    upsertRecentTemplate,

    curatedTemplateItems,
    templatePickerTotalPages,
    pagedCuratedTemplateItems,

    resolvedTemplateImageUrl,
    resolvedTemplateThumbnailUrlForUi,
    resolvedTemplateIdToApply,
    canSubmitTemplate,

    handleTemplateSelect,
    handleRecentClick,
    cacheTemplateThumbnail,

    // User templates
    userTemplates,
    userTemplatesLoading,
    saveUserUploadedTemplate: async (file: File, templateName?: string) => {
      const currentUser = firebaseService.auth?.currentUser;
      if (!currentUser?.uid) throw new Error('Not logged in');

      try {
        console.log('[saveUserUploadedTemplate] Uploading template:', file.name);
        
        // Upload the image to Firebase Storage
        const imageUrl = await firebaseService.uploadUserTemplate({
          userId: currentUser.uid,
          file,
          onProgress: (progress) => console.log('[saveUserUploadedTemplate] Upload progress:', progress),
        });

        console.log('[saveUserUploadedTemplate] Image uploaded:', imageUrl);

        // Save metadata to Firestore
        const docId = await firebaseService.saveUserTemplate({
          userId: currentUser.uid,
          name: templateName || file.name || 'My Template',
          imageUrl,
        });

        console.log('[saveUserUploadedTemplate] Metadata saved:', docId);

        // Reload user templates
        const updatedTemplates = await firebaseService.getUserTemplates(currentUser.uid);
        if (updatedTemplates) {
          setUserTemplates(
            updatedTemplates.map((t) => ({
              id: t.id,
              name: t.name,
              imageUrl: t.imageUrl,
              thumbnailUrl: (t.thumbnailUrl || t.imageUrl) as any,
              enabled: true,
              order: undefined,
              isPremium: false,
            }))
          );
        }

        return docId;
      } catch (error) {
        console.error('[saveUserUploadedTemplate] Error:', error);
        throw error;
      }
    },
  };
}
