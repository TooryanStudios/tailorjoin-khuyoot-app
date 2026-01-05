import React from 'react';
import type { TryOnOptions } from '../../types/tryon';
import type { GenerationItem } from '../../../pages/designerV2/components/GenerationsRail';
import { TryFabricPanelBase, type TryFabricPanelBaseHandle } from './TryFabricPanelBase';

type GarmentTemplate = {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  enabled?: boolean;
  order?: number;
  isPremium?: boolean;
};

export type TryFabricPanelHandle = {
  generate: () => void;
  openTemplatePicker: () => void;
  openFabricPicker: () => void;
};

export type TryFabricPanelProps = {
  initialTemplateId?: string;
  initialTemplateImageUrl?: string | null;
  initialTemplateWidth?: number | null;
  initialTemplateHeight?: number | null;
  initialOptions?: TryOnOptions;
  onApplyResult: (result: { jobId: string; resultImageUrl: string }) => void;
  onTemplateSubmit?: (payload: { templateId: string; templateImageUrl: string }) => void;
  onFabricSubmit?: (payload: { fabricImageUrl: string; fabricPreviewUrl?: string | null }) => void;
  templates?: GarmentTemplate[];
  useExternalCards?: boolean;
  externalTemplateImageUrl?: string | null;
  externalFabricImageUrl?: string | null;
  comparisonOverride?: {
    beforeImage?: string | null;
    afterImage?: string | null;
    beforeLabel?: string;
    afterLabel?: string;
  } | null;
  onResultHelp?: () => void;
  onResultToggleAdminAnchors?: () => void;
  showAdminAnchors?: boolean;
  onRequestPickTemplate?: () => void;
  onRequestPickFabric?: () => void;
  onMissingTemplate?: () => void;
  onMissingFabric?: () => void;
  onRequestHelp?: () => void;
  onGenerated?: (result: { jobId: string; resultImageUrl: string; resultThumbnailUrl?: string }) => void;
  modalGenerations?: GenerationItem[];
  modalGenerationsPlaceholderCount?: number;
  onModalGenerationOpen?: (url: string) => void;
  onModalGenerationSetBefore?: (url: string) => void;
  onModalGenerationSetAfter?: (url: string) => void;
};

export const TryFabricPanel = React.forwardRef<TryFabricPanelHandle, TryFabricPanelProps>(function TryFabricPanel(props, ref) {
  const { user, appSettings } = useApp();
  const { getLocalUrl } = useImagePreloader();

  const isSubscribed = React.useMemo(() => {
    if (!user) return false;
    if ((user as any).isGoldMember === true) return true;
    const tier = (user as any)?.subscription?.tier;
    return typeof tier === 'string' && tier.toLowerCase() !== 'free';
  }, [user]);

  const maxRecentTemplates = React.useMemo(() => {
    const freeMax = Number((appSettings as any)?.aiTryOn?.limits?.free?.maxRecents ?? FREE_MAX_RECENTS);
    const subMax = Number((appSettings as any)?.aiTryOn?.limits?.subscribed?.maxRecents ?? MAX_RECENT_TEMPLATES);
    const safeFree = Number.isFinite(freeMax) ? Math.max(0, freeMax) : FREE_MAX_RECENTS;
    const safeSub = Number.isFinite(subMax) ? Math.max(0, subMax) : MAX_RECENT_TEMPLATES;
    return isSubscribed ? safeSub : safeFree;
  }, [appSettings, isSubscribed]);

  const {
    initialTemplateId,
    initialTemplateImageUrl,
    initialTemplateWidth,
    initialTemplateHeight,
    initialOptions,
    onApplyResult,
    onTemplateSubmit,
    onFabricSubmit,
    templates: templatesProp,
    useExternalCards = false,
    externalTemplateImageUrl,
    externalFabricImageUrl,
    comparisonOverride,
    onResultHelp,
    onResultToggleAdminAnchors,
    showAdminAnchors,
    onRequestPickTemplate,
    onRequestPickFabric,
    onMissingTemplate,
    onMissingFabric,
    onRequestHelp,
    onGenerated,
    modalGenerations,
    modalGenerationsPlaceholderCount,
    onModalGenerationOpen,
    onModalGenerationSetBefore,
    onModalGenerationSetAfter,
  } = props;

  const [fabricFile, setFabricFile] = React.useState<File | null>(null);
  const [fabricImageUrl, setFabricImageUrl] = React.useState<string | null>(null);
  const [fabricPreview, setFabricPreview] = React.useState<string | null>(null);
  const [fabricError, setFabricError] = React.useState<string | null>(null);
  const [options, setOptions] = React.useState<TryOnOptions>({
    neckStyle: initialOptions?.neckStyle || 'keep',
    embroideryStyle: initialOptions?.embroideryStyle || 'keep',
    sleeveStyle: initialOptions?.sleeveStyle || 'keep',
    fabricScale: initialOptions?.fabricScale ?? 1,
    colorPreservation: initialOptions?.colorPreservation || 'high',
  });

  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  const [showFabricPicker, setShowFabricPicker] = React.useState(false);
  const [showFabricImageLibrary, setShowFabricImageLibrary] = React.useState(false);
  const [khuyootFabricCategories, setKhuyootFabricCategories] = React.useState<KhuyootFabricCategory[]>([]);
  const [khuyootSelectedCategoryId, setKhuyootSelectedCategoryId] = React.useState<string | null>(null);
  const [khuyootFabrics, setKhuyootFabrics] = React.useState<KhuyootFabricItem[]>([]);
  const [khuyootFabricsLoading, setKhuyootFabricsLoading] = React.useState(false);
  const [khuyootFabricsError, setKhuyootFabricsError] = React.useState<string | null>(null);
  const [showDebugView, setShowDebugView] = React.useState(false);
  const overlayScrollPositionRef = React.useRef<number>(0);
  const topRef = React.useRef<HTMLDivElement>(null);
  const resultRef = React.useRef<HTMLDivElement>(null);
  const persistStateTimer = React.useRef<number | null>(null);

  type PersistedTryFabricStateV2 = {
    v: 2;
    ts: number;
    selectedTemplateId?: string | null;
    customTemplatePreview?: string | null;
    fabricImageUrl?: string | null;
    fabricPreview?: string | null;
    result?: {
      jobId?: string;
      status?: string;
      resultImageUrl?: string | null;
      resultThumbnailUrl?: string | null;
      error?: string | null;
    } | null;
  };

  const coerceSafeString = React.useCallback((value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed;
  }, []);

  const toPersistedResult = React.useCallback((value: unknown): PersistedTryFabricStateV2['result'] => {
    if (!value || typeof value !== 'object') return null;
    const anyValue: any = value;
    return {
      jobId: coerceSafeString(anyValue.jobId) || undefined,
      status: coerceSafeString(anyValue.status) || undefined,
      resultImageUrl: coerceSafeString(anyValue.resultImageUrl ?? anyValue.resultImageDataUrl) ?? null,
      resultThumbnailUrl: coerceSafeString(anyValue.resultThumbnailUrl) ?? null,
      error: coerceSafeString(anyValue.error) ?? null,
    };
  }, [coerceSafeString]);
  const validateFile = React.useCallback((file: File | null) => {
    if (!file) {
      setFabricError(null);
      return true;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFabricError('يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP');
      return false;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setFabricError('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
      return false;
    }

    if (looksLikePersonalPhotoClientSide(file)) {
      setFabricError('ممنوع رفع صور شخصية. ارفع صورة قماش/نقشة فقط.');
      return false;
    }

    setFabricError(null);
    return true;
  }, []);

  const templatePicker = useTryOnTemplatePicker({
    initialTemplateId,
    initialTemplateImageUrl,
    templatesProp: templatesProp as any,
    isSubscribed,
    useExternalCards,
    externalTemplateImageUrl: externalTemplateImageUrl ?? null,
    templatePickerPageSize: TEMPLATE_PICKER_PAGE_SIZE,
    maxRecentTemplates,
    recentTemplatesStorageKey: RECENT_TEMPLATES_KEY,
  });

  const {
    templates,
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
    onTemplateUpload: onTemplateUploadInner,
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
    pagedCuratedTemplateItems,
    templatePickerTotalPages,
    resolvedTemplateImageUrl,
    resolvedTemplateIdToApply,
    canSubmitTemplate,
    handleTemplateSelect: handleTemplateSelectInner,
    handleRecentClick: handleRecentClickInner,
  } = templatePicker;

  const generationTemplates = React.useMemo(() => {
    return (templates || []).map((t) => ({ id: t.id, imageUrl: t.imageUrl }));
  }, [templates]);

  const {
    loading,
    progress,
    result,
    animateReveal,
    setAnimateReveal,
    setResult,
    clearResult,
    generate,
    saveToProject,
    retry,
  } = useTryOnGeneration({
    useExternalCards,
    initialTemplateId,
    initialTemplateImageUrl,
    initialTemplateWidth,
    initialTemplateHeight,
    initialOptions,
    externalTemplateImageUrl: externalTemplateImageUrl ?? null,
    externalFabricImageUrl: externalFabricImageUrl ?? null,
    selectedTemplateId,
    templates: generationTemplates,
    customTemplateFile,
    customTemplatePreview,
    fabricFile,
    fabricImageUrl,
    options,
    validateFabricFile: validateFile,
    resultRef,
    topRef,
    onApplyResult,
    onGenerated,
    onMissingTemplate,
    onMissingFabric,
    createCoverThumbnailDataUrl,
    upsertRecentTemplate,
    saveTemplateToHistory,
    recentThumbWidth: RECENT_THUMB_WIDTH,
    recentThumbHeight: RECENT_THUMB_HEIGHT,
  });

  const onTemplateUpload = React.useCallback((file: File | null) => {
    setAnimateReveal(false);
    onTemplateUploadInner(file);
  }, [setAnimateReveal, onTemplateUploadInner]);

  const handleTemplateSelect = React.useCallback((item: { id: string; name?: string; imageUrl?: string; thumbnailUrl?: string; isPremium?: boolean; isLocked?: boolean }) => {
    setAnimateReveal(false);
    handleTemplateSelectInner(item);
  }, [setAnimateReveal, handleTemplateSelectInner]);

  const handleRecentClick = React.useCallback((item: { id: string; imageUrl: string; name?: string }) => {
    setAnimateReveal(false);
    handleRecentClickInner(item);
  }, [setAnimateReveal, handleRecentClickInner]);

  // Prevent mobile background scrolling when our custom overlays are open.
  React.useEffect(() => {
    const anyOverlayOpen = showTemplateImageLibrary || showFabricPicker;
    if (!anyOverlayOpen) return;

    overlayScrollPositionRef.current = window.scrollY;

    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;
    const prevOverflow = document.body.style.overflow;
    const prevOverflowY = document.body.style.overflowY;
    const prevPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${overlayScrollPositionRef.current}px`;
    document.body.style.width = '100%';
    // Keep scrollbar visible to avoid horizontal layout shift.
    document.body.style.overflow = '';
    document.body.style.overflowY = 'scroll';
    document.body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '';

    return () => {
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      document.body.style.overflow = prevOverflow;
      document.body.style.overflowY = prevOverflowY;
      document.body.style.paddingRight = prevPaddingRight;
      window.scrollTo(0, overlayScrollPositionRef.current);
    };
  }, [showTemplateImageLibrary, showFabricPicker]);

  // Load persisted state from localStorage before first paint to avoid flicker.
  React.useLayoutEffect(() => {
    try {
      const savedState = localStorage.getItem(TRYFABRIC_STATE_KEY);
      if (!savedState) return;
      const parsed = JSON.parse(savedState) as any;

      const selectedTemplateIdRaw = coerceSafeString(parsed?.selectedTemplateId);
      const customTemplatePreviewRaw = coerceSafeString(parsed?.customTemplatePreview);
      const fabricImageUrlRaw = coerceSafeString(parsed?.fabricImageUrl);
      const fabricPreviewRaw = coerceSafeString(parsed?.fabricPreview);

      const safeCustomTemplatePreview = isLikelyStorableUrl(customTemplatePreviewRaw || '') ? customTemplatePreviewRaw : null;
      const safeFabricImageUrl = isLikelyStorableUrl(fabricImageUrlRaw || '') ? fabricImageUrlRaw : null;
      const safeFabricPreview = isLikelyStorableUrl(fabricPreviewRaw || '') ? fabricPreviewRaw : null;

      const persistedResult = toPersistedResult(parsed?.result);

      if (persistedResult && (persistedResult.status || persistedResult.resultImageUrl || persistedResult.error)) {
        setResult(persistedResult as any);
      }
      if (safeCustomTemplatePreview) setCustomTemplatePreview(safeCustomTemplatePreview);
      if (safeFabricImageUrl) setFabricImageUrl(safeFabricImageUrl);
      if (safeFabricPreview) setFabricPreview(safeFabricPreview);
      if (selectedTemplateIdRaw) setSelectedTemplateId(selectedTemplateIdRaw);
    } catch {
      // ignore
    }
  }, [TRYFABRIC_STATE_KEY, coerceSafeString, toPersistedResult, setResult, setCustomTemplatePreview, setFabricImageUrl, setFabricPreview, setSelectedTemplateId]);

  // Save state to localStorage whenever it changes (sanitized to avoid blob URLs + oversized payloads)
  React.useEffect(() => {
    try {
      if (result || customTemplatePreview || fabricImageUrl || fabricPreview || selectedTemplateId) {
        if (persistStateTimer.current) window.clearTimeout(persistStateTimer.current);
        persistStateTimer.current = window.setTimeout(() => {
          const safeCustomTemplatePreview = isLikelyStorableUrl(customTemplatePreview || '') ? customTemplatePreview : null;
          const safeFabricImageUrl = isLikelyStorableUrl(fabricImageUrl || '') ? fabricImageUrl : null;
          const safeFabricPreview = isLikelyStorableUrl(fabricPreview || '') ? fabricPreview : null;

          const payload: PersistedTryFabricStateV2 = {
            v: 2,
            ts: Date.now(),
            result: toPersistedResult(result),
            customTemplatePreview: safeCustomTemplatePreview,
            fabricImageUrl: safeFabricImageUrl,
            fabricPreview: safeFabricPreview,
            selectedTemplateId,
          };

          const json = JSON.stringify(payload);
          // Avoid quota issues and long main-thread stalls when strings get huge.
          if (json.length > 900_000) {
            // Persist without embedded images if too large.
            const slim: PersistedTryFabricStateV2 = {
              v: 2,
              ts: payload.ts,
              result: payload.result,
              selectedTemplateId,
              customTemplatePreview: null,
              fabricImageUrl: safeFabricImageUrl,
              fabricPreview: safeFabricPreview,
            };
            localStorage.setItem(TRYFABRIC_STATE_KEY, JSON.stringify(slim));
            return;
          }

          localStorage.setItem(TRYFABRIC_STATE_KEY, json);
        }, 250);
      }
    } catch {
      // ignore
    }
    return () => {
      if (persistStateTimer.current) {
        window.clearTimeout(persistStateTimer.current);
        persistStateTimer.current = null;
      }
    };
  }, [result, customTemplatePreview, fabricImageUrl, fabricPreview, selectedTemplateId]);

  const onFabricChange = async (file: File | null) => {
    setAnimateReveal(false);
    setFabricImageUrl(null);
    if (!validateFile(file)) {
      setFabricFile(file);
      setFabricPreview(null);
      return;
    }
    setFabricFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setFabricPreview(url);
    } else {
      setFabricPreview(null);
    }
  };

  const onFabricUrlSelect = React.useCallback((url: string) => {
    setAnimateReveal(false);
    setFabricError(null);
    setFabricFile(null);
    setFabricImageUrl(url);
    setFabricPreview(url);
  }, [setAnimateReveal]);

  const onFabricUrlSelectWithPreview = React.useCallback((fullUrl: string, previewUrl?: string | null) => {
    setAnimateReveal(false);
    setFabricError(null);
    setFabricFile(null);
    setFabricImageUrl(fullUrl);
    setFabricPreview(previewUrl || fullUrl);
  }, [setAnimateReveal]);

  React.useEffect(() => {
    let cancelled = false;
    if (!showFabricPicker) return;
    setKhuyootFabricsError(null);
    setKhuyootFabricsLoading(true);
    (async () => {
      try {
        const cats = await getFabricCategories();
        if (cancelled) return;
        setKhuyootFabricCategories(cats);
        const nextCatId = khuyootSelectedCategoryId || cats[0]?.id || null;
        setKhuyootSelectedCategoryId(nextCatId);
        if (nextCatId) {
          const fabrics = await getFabricsByCategoryId(nextCatId);
          if (!cancelled) setKhuyootFabrics(fabrics);
        } else {
          setKhuyootFabrics([]);
        }
      } catch (e: any) {
        console.error('Failed to load khuyoot fabric library:', e);
        if (!cancelled) setKhuyootFabricsError('تعذر تحميل مكتبة الأقمشة');
      } finally {
        if (!cancelled) setKhuyootFabricsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFabricPicker]);

  React.useEffect(() => {
    let cancelled = false;
    if (!showFabricPicker) return;
    if (!khuyootSelectedCategoryId) return;
    setKhuyootFabricsError(null);
    setKhuyootFabricsLoading(true);
    (async () => {
      try {
        const fabrics = await getFabricsByCategoryId(khuyootSelectedCategoryId);
        if (!cancelled) setKhuyootFabrics(fabrics);
      } catch (e: any) {
        console.error('Failed to load fabrics by category:', e);
        if (!cancelled) setKhuyootFabricsError('تعذر تحميل الأقمشة');
      } finally {
        if (!cancelled) setKhuyootFabricsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showFabricPicker, khuyootSelectedCategoryId]);

  const generateRef = React.useRef(generate);
  React.useEffect(() => {
    generateRef.current = generate;
  }, [generate]);

  const openTemplatePickerRef = React.useRef<() => void>(() => undefined);
  const openFabricPickerRef = React.useRef<() => void>(() => undefined);

  React.useEffect(() => {
    openTemplatePickerRef.current = () => setShowTemplateImageLibrary(true);
  }, [setShowTemplateImageLibrary]);

  React.useEffect(() => {
    openFabricPickerRef.current = () => setShowFabricPicker(true);
  }, []);

  React.useImperativeHandle(ref, () => ({
    generate: () => {
      void generateRef.current();
    },
    openTemplatePicker: () => {
      openTemplatePickerRef.current();
    },
    openFabricPicker: () => {
      openFabricPickerRef.current();
    },
  }), []);

  const onDebugLoadTemplate = React.useCallback(() => {
    const templateUrl = customTemplatePreview || (selectedTemplateId ? templates.find(t => t.id === selectedTemplateId)?.imageUrl : undefined);
    if (templateUrl) {
      setResult({
        jobId: 'debug-test',
        status: 'completed',
        resultImageUrl: templateUrl,
      });
      setAnimateReveal(true);
      setTimeout(() => {
        resultRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' } as any);
      }, 100);
    }
  }, [customTemplatePreview, selectedTemplateId, templates, setResult, setAnimateReveal]);

  const closeTemplatePicker = React.useCallback(() => setShowTemplateImageLibrary(false), []);
  const closeFabricPicker = React.useCallback(() => setShowFabricPicker(false), []);
  const closeFabricImageLibrary = React.useCallback(() => setShowFabricImageLibrary(false), []);

  const confirmTemplateSelection = React.useCallback(() => {
    if (!resolvedTemplateImageUrl || !resolvedTemplateIdToApply) return;
    const cachedUrl = getLocalUrl(resolvedTemplateImageUrl) || resolvedTemplateImageUrl;
    onTemplateSubmit?.({
      templateId: resolvedTemplateIdToApply,
      templateImageUrl: cachedUrl,
    });
    closeTemplatePicker();
  }, [resolvedTemplateImageUrl, resolvedTemplateIdToApply, onTemplateSubmit, closeTemplatePicker, getLocalUrl]);

  const handleTemplateSelectAndSubmit = React.useCallback((item: { id: string; imageUrl: string; thumbnailUrl?: string | null }) => {
    // Directly submit the clicked template without needing to wait for state updates
    const preferredUrl = item.thumbnailUrl || item.imageUrl;
    const imageUrlToUse = preferredUrl ? (getLocalUrl(preferredUrl) || preferredUrl) : item.imageUrl;
    onTemplateSubmit?.({
      templateId: item.id,
      templateImageUrl: imageUrlToUse,
    });
    // Also update selection state for consistency
    handleTemplateSelect(item);
    closeTemplatePicker();
  }, [onTemplateSubmit, handleTemplateSelect, closeTemplatePicker, getLocalUrl]);

  const onSelectFabricFromImageLibrary = React.useCallback((url: string) => {
    onFabricUrlSelect(url);
    closeFabricImageLibrary();
  }, [onFabricUrlSelect, closeFabricImageLibrary]);

  const onGoToPortfolioFromFabricPicker = React.useCallback(() => {
    closeFabricPicker();
    window.location.hash = '#/portfolio-management';
  }, [closeFabricPicker]);

  const onFabricChangeAndClosePicker = React.useCallback((file: File | null) => {
    onFabricChange(file);
    closeFabricPicker();
  }, [onFabricChange, closeFabricPicker]);

  const refreshFabricCategories = React.useCallback(async () => {
    setKhuyootFabricsError(null);
    setKhuyootFabricsLoading(true);
    try {
      const cats = await getFabricCategories();
      setKhuyootFabricCategories(cats);
      const nextCatId = khuyootSelectedCategoryId || cats[0]?.id || null;
      setKhuyootSelectedCategoryId(nextCatId);
    } catch {
      setKhuyootFabricsError('تعذر تحديث الأقسام');
    } finally {
      setKhuyootFabricsLoading(false);
    }
  }, [khuyootSelectedCategoryId]);

  const onSelectFabricItemAndClose = React.useCallback((payload: { imageUrl: string; previewUrl?: string | null }) => {
    onFabricUrlSelectWithPreview(payload.imageUrl, payload.previewUrl || null);
    onFabricSubmit?.({
      fabricImageUrl: payload.imageUrl,
      fabricPreviewUrl: payload.previewUrl || null,
    });
    closeFabricPicker();
  }, [onFabricUrlSelectWithPreview, onFabricSubmit, closeFabricPicker]);

  const templatePickerContentProps = React.useMemo(() => ({
    templatePickerLeftScrollRef,
    updateTemplatePickerLeftScrollThumb,
    templatePickerLeftScrollThumb,
    templateUploadInputRef,
    handleTemplateDrop,
    handleTemplateDragOver,
    handleTemplateDragEnter,
    handleTemplateDragLeave,
    templateDragActive,
    customTemplatePreview,
    customTemplateFile,
    templatePreviewImgElRef,
    templatePreviewSrcRef,
    templatePreviewLoading,
    setTemplatePreviewLoading,
    setCustomTemplateFile,
    setCustomTemplatePreview,
    saveTemplateToHistory,
    setSaveTemplateToHistory,
    recentTemplates,
    setRecentTemplates,
    showAllRecents,
    setShowAllRecents,
    maxRecentTemplates,
    recentTemplatesStorageKey: RECENT_TEMPLATES_KEY,
    onRecentClick: handleRecentClick,
    validateTemplateFile,
    onTemplateUpload,
    pagedCuratedTemplateItems,
    selectedTemplateId,
    onSelectTemplateItem: handleTemplateSelect,
    onConfirmTemplateItem: handleTemplateSelectAndSubmit,
    templatePickerTotalPages,
    templatePickerPage,
    setTemplatePickerPage,
    resolvedTemplateImageUrl,
    templateSidePreviewImgElRef,
    templateSidePreviewSrcRef,
    templateSidePreviewLoading,
    setTemplateSidePreviewLoading,
    canSubmitTemplate,
    onConfirmTemplate: confirmTemplateSelection,
  }), [
    templatePickerLeftScrollRef,
    updateTemplatePickerLeftScrollThumb,
    templatePickerLeftScrollThumb,
    templateUploadInputRef,
    handleTemplateDrop,
    handleTemplateDragOver,
    handleTemplateDragEnter,
    handleTemplateDragLeave,
    templateDragActive,
    customTemplatePreview,
    customTemplateFile,
    templatePreviewImgElRef,
    templatePreviewSrcRef,
    templatePreviewLoading,
    saveTemplateToHistory,
    recentTemplates,
    showAllRecents,
    maxRecentTemplates,
    pagedCuratedTemplateItems,
    selectedTemplateId,
    handleTemplateSelect,
    handleTemplateSelectAndSubmit,
    templatePickerTotalPages,
    templatePickerPage,
    resolvedTemplateImageUrl,
    templateSidePreviewLoading,
    canSubmitTemplate,
    confirmTemplateSelection,
    handleRecentClick,
    validateTemplateFile,
    onTemplateUpload,
  ]);

  const templatePickerModal = (
    <TryOnTemplatePickerModal
      open={showTemplateImageLibrary}
      portalTarget={portalTarget}
      onClose={closeTemplatePicker}
      contentProps={templatePickerContentProps}
    />
  );

  const fabricImageLibraryModal = (
    <FabricImageLibraryModal
      open={showFabricImageLibrary}
      onSelect={onSelectFabricFromImageLibrary}
      onClose={closeFabricImageLibrary}
    />
  );

  const fabricPickerContentProps = React.useMemo(() => ({
    onGoToPortfolio: onGoToPortfolioFromFabricPicker,
    onFabricChangeAndClose: onFabricChangeAndClosePicker,
    khuyootFabricCategories,
    khuyootSelectedCategoryId,
    setKhuyootSelectedCategoryId,
    khuyootFabricsError,
    khuyootFabricsLoading,
    khuyootFabrics,
    onRefreshCategories: refreshFabricCategories,
    getFabricCoverUrl,
    getFabricCoverThumbnailUrl,
    onSelectFabricItem: onSelectFabricItemAndClose,
  }), [
    onGoToPortfolioFromFabricPicker,
    onFabricChangeAndClosePicker,
    khuyootFabricCategories,
    khuyootSelectedCategoryId,
    khuyootFabricsError,
    khuyootFabricsLoading,
    khuyootFabrics,
    refreshFabricCategories,
    onSelectFabricItemAndClose,
  ]);

  const fabricPickerModal = (
    <TryOnFabricPickerModal
      open={showFabricPicker}
      portalTarget={portalTarget}
      onClose={closeFabricPicker}
      contentProps={fabricPickerContentProps}
    />
  );

  const resultOriginalImageUrl = React.useMemo(() => {
    if (useExternalCards) return externalTemplateImageUrl || undefined;
    return customTemplatePreview || (selectedTemplateId ? templates.find(t => t.id === selectedTemplateId)?.imageUrl : undefined);
  }, [useExternalCards, externalTemplateImageUrl, customTemplatePreview, selectedTemplateId, templates]);

  const fabricSelectCard = !useExternalCards ? (
    <FabricSelectCard
      imageUrl={(fabricPreview || fabricImageUrl || externalFabricImageUrl) ?? null}
      onClick={() => {
        setShowFabricPicker(true);
      }}
    />
  ) : null;

  return (
    <div className="w-full flex flex-col gap-1">
      <div ref={topRef} className="contents" />

      {templatePickerModal}
      {fabricImageLibraryModal}
      {fabricPickerModal}

      <TryFabricMainCard fabricSelectCard={fabricSelectCard ?? undefined} onRequestHelp={onRequestHelp} />

      <TryOnResultSection
        ref={resultRef}
        result={result}
        loading={loading}
        progress={progress}
        originalImageUrl={resultOriginalImageUrl}
        fabricThumbnailUrl={(fabricPreview || fabricImageUrl || externalFabricImageUrl) ?? null}
        comparisonBeforeImage={comparisonOverride?.beforeImage || undefined}
        comparisonAfterImage={comparisonOverride?.afterImage}
        comparisonBeforeLabel={comparisonOverride?.beforeLabel}
        comparisonAfterLabel={comparisonOverride?.afterLabel}
        onHelp={onResultHelp}
        onToggleAdminAnchors={onResultToggleAdminAnchors}
        showAdminAnchors={!!showAdminAnchors}
        onSaveToProject={saveToProject}
        onRetry={retry}
        animateReveal={animateReveal}
        modalGenerations={modalGenerations}
        modalGenerationsPlaceholderCount={modalGenerationsPlaceholderCount}
        onModalGenerationOpen={onModalGenerationOpen}
        onModalGenerationSetBefore={onModalGenerationSetBefore}
        onModalGenerationSetAfter={onModalGenerationSetAfter}
        onOpenTemplatePicker={() => setShowTemplateImageLibrary(true)}
        onOpenFabricPicker={() => setShowFabricPicker(true)}
      />
    </div>
  );
});
