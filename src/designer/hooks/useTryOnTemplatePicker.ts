import React from 'react';
import { firebaseService } from '../../../services/firebase';
import { GARMENT_TEMPLATES } from '../templates/garmentTemplates';
import type { TemplatePickerItem } from '../components/TemplatePicker';

export type GarmentTemplate = {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  enabled?: boolean;
  order?: number;
  isPremium?: boolean;
};

const isLikelyStorableUrl = (url: string): boolean => {
  if (!url) return false;
  if (url.startsWith('blob:')) return false;
  if (url.startsWith('data:image/')) return true;
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  return false;
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
  const [templatePickerLeftScrollThumb, setTemplatePickerLeftScrollThumb] = React.useState<{
    hasOverflow: boolean;
    topPx: number;
    heightPx: number;
  }>({ hasOverflow: false, topPx: 0, heightPx: 0 });

  const templateUploadInputRef = React.useRef<HTMLInputElement | null>(null);

  const [showTemplateImageLibrary, setShowTemplateImageLibrary] = React.useState(false);
  const [templatePickerPage, setTemplatePickerPage] = React.useState(1);

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

  // When opening the template library, jump to the page containing the selected template.
  React.useEffect(() => {
    if (!showTemplateImageLibrary) return;
    const idx = selectedTemplateId ? templates.findIndex((t) => t.id === selectedTemplateId) : -1;
    if (idx >= 0) {
      setTemplatePickerPage(Math.floor(idx / templatePickerPageSize) + 1);
    } else {
      setTemplatePickerPage(1);
    }
  }, [showTemplateImageLibrary, selectedTemplateId, templates, templatePickerPageSize]);

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
  }, []);

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

  const updateTemplatePickerLeftScrollThumb = React.useCallback(() => {
    const el = templatePickerLeftScrollRef.current;
    if (!el) return;

    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;
    const maxScrollTop = Math.max(0, scrollHeight - clientHeight);

    if (maxScrollTop <= 1) {
      setTemplatePickerLeftScrollThumb({ hasOverflow: false, topPx: 0, heightPx: 0 });
      return;
    }

    const trackInset = 8;
    const trackHeight = Math.max(0, clientHeight - trackInset * 2);
    const minThumb = 18;
    const thumbHeight = Math.max(minThumb, Math.round((clientHeight / scrollHeight) * trackHeight));
    const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
    const thumbTopWithinTrack = maxScrollTop > 0 ? Math.round((el.scrollTop / maxScrollTop) * maxThumbTop) : 0;

    setTemplatePickerLeftScrollThumb({
      hasOverflow: true,
      topPx: trackInset + thumbTopWithinTrack,
      heightPx: thumbHeight,
    });
  }, []);

  React.useEffect(() => {
    if (!showTemplateImageLibrary) return;

    const t = window.setTimeout(updateTemplatePickerLeftScrollThumb, 0);
    window.addEventListener('resize', updateTemplatePickerLeftScrollThumb);

    const el = templatePickerLeftScrollRef.current;
    const ro = typeof ResizeObserver !== 'undefined' && el ? new ResizeObserver(() => updateTemplatePickerLeftScrollThumb()) : null;
    if (ro && el) ro.observe(el);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', updateTemplatePickerLeftScrollThumb);
      if (ro) ro.disconnect();
    };
  }, [showTemplateImageLibrary, updateTemplatePickerLeftScrollThumb]);

  const curatedTemplateItems = React.useMemo(() => {
    const userIsPremium = isSubscribed;
    const all: TemplatePickerItem[] = (templates || []).map((t) => ({
      id: t.id,
      name: t.name,
      imageUrl: t.imageUrl,
      thumbnailUrl: t.thumbnailUrl || t.imageUrl,
      isPremium: t.isPremium === true,
      isLocked: t.isPremium === true && !userIsPremium,
    }));

    const free = all.filter((x) => !x.isPremium);
    const premium = all.filter((x) => x.isPremium);
    return [...free, ...premium];
  }, [templates, isSubscribed]);

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

  const resolvedTemplateIdToApply = React.useMemo(() => {
    if (useExternalCards) return (initialTemplateId || null);
    return (selectedTemplateId || initialTemplateId || null);
  }, [useExternalCards, selectedTemplateId, initialTemplateId]);

  const canSubmitTemplate = Boolean(resolvedTemplateImageUrl && resolvedTemplateIdToApply);

  return {
    templates,
    templatesLoading,

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
    templatePickerLeftScrollThumb,
    updateTemplatePickerLeftScrollThumb,

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
    resolvedTemplateIdToApply,
    canSubmitTemplate,

    handleTemplateSelect,
    handleRecentClick,
  };
}
