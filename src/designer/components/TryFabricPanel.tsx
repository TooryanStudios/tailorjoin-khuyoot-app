import React from 'react';
import { TemplatePicker } from './TemplatePicker';
import { FabricUploader } from './FabricUploader';
import { GARMENT_TEMPLATES } from '../templates/garmentTemplates';
import type { TryOnOptions, TryOnResponse } from '../../types/tryon';
import { useApp } from '../../../context/AppContext';
import { FabricSelectCard } from './tryFabricPanel/FabricSelectCard';
import { TryOnResultSection } from './tryFabricPanel/TryOnResultSection';
import { TryOnTemplatePickerModal } from './tryFabricPanel/TryOnTemplatePickerModal';
import { TryOnFabricPickerModal } from './tryFabricPanel/TryOnFabricPickerModal';
import { FabricImageLibraryModal } from './tryFabricPanel/FabricImageLibraryModal';
import { FabricTilingModal } from './FabricTilingModal';
import type { TryOnResultFeatures } from './tryOnResult/TryOnResultFeatures';

import { CUSTOM_UPLOAD_TEMPLATE_ID, useTryOnTemplatePicker } from '../hooks/useTryOnTemplatePicker';
import { useTryOnGeneration } from '../hooks/useTryOnGeneration';
import { firebaseService } from '../../../services/firebase';
import {
  getFabricCategories,
  getFabricsByCategoryId,
  getFabricCoverUrl,
  getFabricCoverThumbnailUrl,
  type FabricCategory as KhuyootFabricCategory,
  type FabricItem as KhuyootFabricItem,
} from '../../../services/fabricLibraryService';
import type { GenerationItem } from '../../../pages/designerV2/components/GenerationsRail';

type GarmentTemplate = {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  enabled?: boolean;
  order?: number;
  isPremium?: boolean;
};

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const RECENT_TEMPLATES_KEY = 'khuyoot_tryon_recent_templates_v1';
const MAX_RECENT_TEMPLATES = 9;
const FREE_MAX_RECENTS = 3;
const TEMPLATE_PICKER_PAGE_SIZE = 24;
const RECENT_THUMB_WIDTH = 100;
const RECENT_THUMB_HEIGHT = 133; // matches the recent card aspect [3/4] at ~100px width

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || '');
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

function looksLikePersonalPhotoClientSide(file: File): boolean {
  // Minimal, conservative heuristic: reject portrait-ish photos by filename.
  const name = (file.name || '').toLowerCase();
  if (name.includes('selfie') || name.includes('portrait') || name.includes('camera')) return true;
  return false;
}

function isLikelyStorableUrl(url: string): boolean {
  if (!url) return false;
  // Never store blob URLs in localStorage (they break across reloads and waste space).
  if (url.startsWith('blob:')) return false;
  // Allow compact data URLs and normal URLs.
  if (url.startsWith('data:image/')) return true;
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  return false;
}

async function createCoverThumbnailDataUrl(params: {
  sourceDataUrl: string;
  targetWidth: number;
  targetHeight: number;
  mimeType?: 'image/webp' | 'image/jpeg' | 'image/png';
  quality?: number;
}): Promise<string | null> {
  const { sourceDataUrl, targetWidth, targetHeight } = params;
  const mimeType = params.mimeType ?? 'image/webp';
  const quality = params.quality ?? 0.82;
  if (!sourceDataUrl?.startsWith('data:image/')) return null;

  return await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        // cover-crop to target aspect
        const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const dx = (targetWidth - drawWidth) / 2;
        const dy = (targetHeight - drawHeight) / 2;
        ctx.clearRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

        try {
          resolve(canvas.toDataURL(mimeType, quality));
        } catch {
          // Some browsers may not support webp; fall back.
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = sourceDataUrl;
  });
}

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
  externalTemplateImageUrlForGeneration?: string | null;
  externalFabricImageUrl?: string | null;
  selectedFabricId?: string | null;
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
  onReloadGenerations?: () => void | Promise<void>;
  modalGenerations?: GenerationItem[];
  modalGenerationsPlaceholderCount?: number;
  onModalGenerationOpen?: (url: string) => void;
  onModalGenerationSetBefore?: (url: string) => void;
  onModalGenerationSetAfter?: (url: string) => void;
  onRefreshAfterImage?: () => void;
  onSaveAfterImage?: () => void;
  customPrompt?: string;
  onCustomPromptChange?: (prompt: string) => void;
  features?: Partial<TryOnResultFeatures>;
};

// ✅ WRAPPED IN React.memo: Prevents unnecessary re-renders when props haven't changed
export const TryFabricPanel = React.memo(
  React.forwardRef<TryFabricPanelHandle, TryFabricPanelProps>(
    function TryFabricPanel(props, ref) {
      const { user, appSettings } = useApp();

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
    externalTemplateImageUrlForGeneration,
    externalFabricImageUrl,
    selectedFabricId,
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
    onReloadGenerations,
    modalGenerations,
    modalGenerationsPlaceholderCount,
    onModalGenerationOpen,
    onModalGenerationSetBefore,
    onModalGenerationSetAfter,
    onRefreshAfterImage,
    onSaveAfterImage,
    customPrompt,
    onCustomPromptChange,
    features,
  } = props;

  const adminDriverPrompt = React.useMemo(() => {
    const raw = (appSettings as any)?.aiTryOn?.driverPrompt;
    return typeof raw === 'string' ? raw : '';
  }, [appSettings]);

  const effectiveCustomPrompt = React.useMemo(() => {
    const local = typeof customPrompt === 'string' ? customPrompt.trim() : '';
    if (local) return local;
    return adminDriverPrompt;
  }, [customPrompt, adminDriverPrompt]);

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
    applyMask: initialOptions?.applyMask ?? false,
    watermarkEnabled: initialOptions?.watermarkEnabled ?? true,
    model: initialOptions?.model ?? 'gemini-2.5-flash-image',
  });

  const logEffectivePrompt = React.useCallback((reason: 'debug' | 'generate') => {
    const local = typeof customPrompt === 'string' ? customPrompt.trim() : '';
    const admin = typeof adminDriverPrompt === 'string' ? adminDriverPrompt.trim() : '';
    const effective = typeof effectiveCustomPrompt === 'string' ? effectiveCustomPrompt : '';
    const source = local ? 'customPrompt (UI override)' : admin ? 'adminDriverPrompt (saved settings)' : 'empty';

    try {
      // Always show a visible line (no collapsed group required)
      console.log(`[TryOn] effective prompt sent (${reason}):`, effective);

      console.group(`[TryOn] Driver prompt (${reason})`);
      console.log('source:', source);
      console.log('model:', options.model);
      console.log('saved admin driverPrompt:', admin);
      console.log('UI customPrompt:', local);
      console.log('effective prompt sent:', effective);
      console.groupEnd();
    } catch {
      // ignore
    }
  }, [adminDriverPrompt, customPrompt, effectiveCustomPrompt, options.model]);

  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  const [showFabricPicker, setShowFabricPicker] = React.useState(false);
  const [showFabricTilingModal, setShowFabricTilingModal] = React.useState(false);
  const [showFabricImageLibrary, setShowFabricImageLibrary] = React.useState(false);
  const [khuyootFabricCategories, setKhuyootFabricCategories] = React.useState<KhuyootFabricCategory[]>([]);
  const [khuyootSelectedCategoryId, setKhuyootSelectedCategoryId] = React.useState<string | null>(null);
  const [khuyootFabrics, setKhuyootFabrics] = React.useState<KhuyootFabricItem[]>([]);
  const [khuyootFabricsLoading, setKhuyootFabricsLoading] = React.useState(false);
  const [khuyootFabricsError, setKhuyootFabricsError] = React.useState<string | null>(null);
  const [showDebugView, setShowDebugView] = React.useState(false);
  const [debugPanelCollapsed, setDebugPanelCollapsed] = React.useState(true);
  const overlayScrollPositionRef = React.useRef<number>(0);
  const topRef = React.useRef<HTMLDivElement>(null);
  const resultRef = React.useRef<HTMLDivElement>(null);
  const persistStateTimer = React.useRef<number | null>(null);
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
    recentTemplates,
    setRecentTemplates,
    showAllRecents,
    setShowAllRecents,
    saveTemplateToHistory,
    setSaveTemplateToHistory,
    upsertRecentTemplate,
    cachedTemplateThumbnailById,
    pagedCuratedTemplateItems,
    templatePickerTotalPages,
    resolvedTemplateImageUrl,
    resolvedTemplateThumbnailUrlForUi,
    resolvedTemplateIdToApply,
    canSubmitTemplate,
    cacheTemplateThumbnail,
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
    externalTemplateImageUrlForGeneration: externalTemplateImageUrlForGeneration ?? null,
    externalFabricImageUrl: externalFabricImageUrl ?? null,
    selectedTemplateId,
    templates: generationTemplates,
    customTemplateFile,
    customTemplatePreview,
    fabricFile,
    fabricImageUrl,
    selectedFabricId,
    options,
    customPrompt: effectiveCustomPrompt,
    comparisonBeforeImageUrl: comparisonOverride?.beforeImage ?? null,
    validateFabricFile: validateFile,
    resultRef,
    topRef,
    onApplyResult,
    onGenerated,
    onReloadGenerations,
    onMissingTemplate,
    onMissingFabric,
    createCoverThumbnailDataUrl,
    upsertRecentTemplate,
    saveTemplateToHistory,
    recentThumbWidth: RECENT_THUMB_WIDTH,
    recentThumbHeight: RECENT_THUMB_HEIGHT,
  });

  const handleRetryWithPromptLog = React.useCallback(() => {
    logEffectivePrompt('generate');
    retry();
  }, [logEffectivePrompt, retry]);

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
    const anyOverlayOpen = showTemplateImageLibrary || showFabricPicker || showFabricTilingModal;
    if (!anyOverlayOpen) return;

    overlayScrollPositionRef.current = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${overlayScrollPositionRef.current}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, overlayScrollPositionRef.current);
    };
  }, [showTemplateImageLibrary, showFabricPicker, showFabricTilingModal]);

  // Load persisted state from localStorage on mount
  React.useEffect(() => {
    try {
      const savedState = localStorage.getItem('khuyoot_tryfabric_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // If the last saved result was a failure (e.g., missing template), drop it to avoid showing stale error on refresh.
        if (parsed.result && parsed.result.status !== 'failed') {
          setResult(parsed.result);
        } else if (parsed.result && parsed.result.status === 'failed') {
          // Clean up the bad persisted state so it doesn't reappear.
          const { result: _removed, ...rest } = parsed;
          localStorage.setItem('khuyoot_tryfabric_state', JSON.stringify(rest));
        }
        if (parsed.customTemplatePreview) setCustomTemplatePreview(parsed.customTemplatePreview);
        if (parsed.fabricImageUrl) setFabricImageUrl(parsed.fabricImageUrl);
        if (parsed.fabricPreview) setFabricPreview(parsed.fabricPreview);
        if (parsed.selectedTemplateId) setSelectedTemplateId(parsed.selectedTemplateId);
      }
    } catch {
      // ignore
    }
  }, [setResult, setCustomTemplatePreview, setFabricImageUrl, setFabricPreview, setSelectedTemplateId]);

  // Save state to localStorage whenever it changes
  React.useEffect(() => {
    try {
      if (result || customTemplatePreview || fabricImageUrl) {
        if (persistStateTimer.current) window.clearTimeout(persistStateTimer.current);
        persistStateTimer.current = window.setTimeout(() => {
          localStorage.setItem('khuyoot_tryfabric_state', JSON.stringify({
            result,
            customTemplatePreview,
            fabricImageUrl,
            fabricPreview,
            selectedTemplateId
          }));
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
  const closeFabricTilingModal = React.useCallback(() => setShowFabricTilingModal(false), []);

  const onApplyTiledFabric = React.useCallback((tiledDataUrl: string) => {
    setAnimateReveal(false);
    setFabricError(null);
    setFabricFile(null);
    setFabricImageUrl(tiledDataUrl);
    setFabricPreview(tiledDataUrl);
    setShowFabricTilingModal(false);
  }, [setAnimateReveal]);

  const confirmTemplateSelection = React.useCallback((override?: { templateId: string; templateImageUrl: string; originalImageUrl?: string }) => {
    const templateId = override?.templateId || resolvedTemplateIdToApply;
    const templateImageUrl = override?.templateImageUrl || resolvedTemplateImageUrl;
    if (!templateId || !templateImageUrl) return;
    onTemplateSubmit?.({
      templateId,
      templateImageUrl,
      originalImageUrl: override?.originalImageUrl,
    });
    closeTemplatePicker();
  }, [resolvedTemplateImageUrl, resolvedTemplateIdToApply, onTemplateSubmit, closeTemplatePicker]);

  const lastAutoSubmittedUploadRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!customTemplatePreview || !customTemplateFile) {
      lastAutoSubmittedUploadRef.current = null;
      return;
    }

    // Prevent duplicate submits for the same upload.
    if (lastAutoSubmittedUploadRef.current === customTemplatePreview) return;
    lastAutoSubmittedUploadRef.current = customTemplatePreview;

    // Save user template to Firebase
    (async () => {
      try {
        if (templatePicker.saveUserUploadedTemplate) {
          console.log('[TryFabricPanel] Saving uploaded template to Firebase');
          await templatePicker.saveUserUploadedTemplate(customTemplateFile, customTemplateFile.name);
          console.log('[TryFabricPanel] Template saved successfully');
        }
      } catch (error) {
        console.error('[TryFabricPanel] Error saving template to Firebase:', error);
        // Continue even if Firebase save fails - still use local template
      }
    })();

    confirmTemplateSelection({
      templateId: CUSTOM_UPLOAD_TEMPLATE_ID,
      templateImageUrl: customTemplatePreview,
      originalImageUrl: customTemplatePreview,
    });
  }, [confirmTemplateSelection, customTemplateFile, customTemplatePreview, templatePicker]);

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
    cachedTemplateThumbnailById,
    pagedCuratedTemplateItems,
    selectedTemplateId,
    onSelectTemplateItem: handleTemplateSelect,
    onConfirmTemplateItem: (item: any) => {
      if (item?.isLocked) {
        handleTemplateSelect(item);
        return;
      }
      handleTemplateSelect(item);
      // Use thumbnailUrl for optimized display, but pass full imageUrl for large version download
      const templateImageUrl = item.thumbnailUrl || item.imageUrl;
      const originalImageUrl = item.imageUrl; // Full URL for getting large version
      confirmTemplateSelection({ templateId: item.id, templateImageUrl, originalImageUrl });
    },
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
    // User templates
    userTemplates: templatePicker.userTemplates,
    userTemplatesLoading: templatePicker.userTemplatesLoading,
    onSelectUserTemplate: (item: any) => {
      handleTemplateSelect(item);
      const templateImageUrl = item.thumbnailUrl || item.imageUrl;
      confirmTemplateSelection({ templateId: item.id, templateImageUrl, originalImageUrl: item.imageUrl });
    },
    onDeleteUserTemplate: async (templateId: string) => {
      try {
        await firebaseService.deleteUserTemplate(templateId);
        // Reload user templates
        const currentUser = firebaseService.auth?.currentUser;
        if (currentUser?.uid) {
          const updatedTemplates = await firebaseService.getUserTemplates(currentUser.uid);
          // The hook will auto-update this through its fetch
        }
      } catch (error) {
        console.error('Error deleting user template:', error);
        alert('خطأ في حذف القالب');
      }
    },
  }), [
    templatePickerLeftScrollRef,
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
    cachedTemplateThumbnailById,
    pagedCuratedTemplateItems,
    selectedTemplateId,
    handleTemplateSelect,
    templatePickerTotalPages,
    templatePickerPage,
    resolvedTemplateImageUrl,
    templateSidePreviewLoading,
    canSubmitTemplate,
    confirmTemplateSelection,
    handleRecentClick,
    validateTemplateFile,
    onTemplateUpload,
    templatePicker,
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

  const fabricTilingModal = (
    <FabricTilingModal
      isOpen={showFabricTilingModal}
      onClose={closeFabricTilingModal}
      imageUrl={(fabricPreview || fabricImageUrl || externalFabricImageUrl) ?? null}
      onApply={onApplyTiledFabric}
    />
  );

  const resultOriginalImageUrl = React.useMemo(() => {
    // Prefer the currently selected/preview image (full or data URL) for the before panel; fall back to cached thumb.
    return (resolvedTemplateImageUrl || resolvedTemplateThumbnailUrlForUi || null) || undefined;
  }, [resolvedTemplateImageUrl, resolvedTemplateThumbnailUrlForUi]);

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
      {fabricTilingModal}

      {/* DEBUG PANEL: Show full URLs being sent to API - collapsible - HIDDEN ON MOBILE */}
      {(resolvedTemplateImageUrl || fabricImageUrl || externalFabricImageUrl) && (
        <div className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-blue-900 text-white text-xs font-mono border-b-2 border-blue-700">
          {/* Header with toggle */}
          <button
            onClick={() => setDebugPanelCollapsed(!debugPanelCollapsed)}
            className="w-full flex items-center gap-2 p-2 hover:bg-blue-800 transition-colors"
          >
            <span className={`inline-block transition-transform ${debugPanelCollapsed ? '' : 'rotate-90'}`}>▶</span>
            <span className="font-bold">🔍 DEBUG: API URLs</span>
          </button>

          {/* Collapsible content */}
          {!debugPanelCollapsed && (
            <div className="p-3 max-h-80 overflow-y-auto space-y-2 border-t border-blue-700 bg-blue-950">
              <div className="bg-blue-800 p-2 rounded">
                <div className="font-bold text-blue-200 mb-1">Template ID:</div>
                <div className="break-all text-blue-100 text-[10px]">{selectedTemplateId || 'N/A'}</div>
              </div>

              <div className="bg-blue-800 p-2 rounded">
                <div className="font-bold text-blue-200 mb-1">Template URL:</div>
                <div className="break-all text-blue-100 whitespace-pre-wrap text-[10px]">{resolvedTemplateImageUrl || 'No URL'}</div>
              </div>

              <div className="bg-blue-800 p-2 rounded">
                <div className="font-bold text-blue-200 mb-1">Fabric URL:</div>
                <div className="break-all text-blue-100 whitespace-pre-wrap text-[10px]">{fabricImageUrl || externalFabricImageUrl || 'No URL'}</div>
              </div>

              <div className="bg-blue-800 p-2 rounded">
                <div className="font-bold text-blue-200 mb-1">Template Dimensions:</div>
                <div className="text-blue-100 text-[10px]">{initialTemplateWidth}x{initialTemplateHeight}</div>
              </div>
            </div>
          )}
        </div>
      )}

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
        onRetry={handleRetryWithPromptLog}
        onDebugPrompt={() => logEffectivePrompt('debug')}
        applyMask={options.applyMask === true}
        onApplyMaskChange={(v) => setOptions((prev) => ({ ...prev, applyMask: v }))}
        watermarkEnabled={options.watermarkEnabled !== false}
        onWatermarkChange={(v) => setOptions((prev) => ({ ...prev, watermarkEnabled: v }))}
        selectedModel={options.model}
        onModelChange={(v) => setOptions((prev) => ({ ...prev, model: v }))}
        customPrompt={effectiveCustomPrompt || ''}
        onCustomPromptChange={onCustomPromptChange}
        animateReveal={animateReveal}
        modalGenerations={modalGenerations}
        modalGenerationsPlaceholderCount={modalGenerationsPlaceholderCount}
        onModalGenerationOpen={onModalGenerationOpen}
        onModalGenerationSetBefore={onModalGenerationSetBefore}
        onModalGenerationSetAfter={onModalGenerationSetAfter}
        onRefreshAfterImage={onRefreshAfterImage}
        onSaveAfterImage={onSaveAfterImage}
        onOpenTemplatePicker={() => setShowTemplateImageLibrary(true)}
        onOpenFabricPicker={() => setShowFabricPicker(true)}
        onOpenFabricTiling={() => setShowFabricTilingModal(true)}
        features={features}
      />
    </div>
  );
  }
)
);
TryFabricPanel.displayName = 'TryFabricPanel';
