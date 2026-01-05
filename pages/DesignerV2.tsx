
// Designer V2


import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Wand2, Check, Shirt, Layers, User, ShoppingCart, RotateCcw, Anchor, HelpCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { FabricPatternSettings, DesignOption, MeasurementTemplate } from '../types';
import { trackDesignEvent } from '../services/recommendationService';
import { designService, PersistedDesign } from '../services/designService';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/Modal';
import { ImageLibraryPicker } from '../components/ImageLibraryPicker';
import { getImageCategories } from '../services/imageLibraryService';
import { firebaseService } from '../services/firebase';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import { TryFabricPanel, type TryFabricPanelHandle } from '../src/designer/components/TryFabricPanel';
import { getOptimizedImageUrl, preloadImage } from '../src/utils/imageOptimization';
import { CanvasPanel } from './designerV2/components/CanvasPanel';
import { GenerationsRail, GenerationItem } from './designerV2/components/GenerationsRail';
import { TemplateSection } from './designerV2/components/sections/TemplateSection';
import { FabricSection } from './designerV2/components/sections/FabricSection';
import { FabricScaleControl, FabricScaleApplyPayload } from '../components/FabricScaleControl';
import { AdminAnchor } from './designerV2/components/AdminAnchor';
import { ModalsSection } from './designerV2/sections/ModalsSection';
import { TryOnSection } from './designerV2/sections/TryOnSection';
import { FeatureToggleBar } from './designerV2/components/FeatureToggleBar';
import type { TryOnResultFeatures } from '../src/designer/components/tryOnResult/TryOnResultFeatures';
import { DEFAULT_FEATURES } from '../src/designer/components/tryOnResult/TryOnResultFeatures';
import { useTabState } from '../src/hooks/useTabState';
import { useAppStore } from '../src/store/useAppStore';

// ... (KEEP ALL INTERFACES, TYPES, AND MOCK DATA EXACTLY THE SAME)
// Types for design data persistence
interface DesignDraft {
  id: string;
  selectedTemplate: string;
  fabricSource: 'khuyoot' | 'shops' | 'upload' | null;
  khuyoot?: { fabricId: string; name?: string; imageUrl: string; settings: FabricPatternSettings } | null;
  shops?: { shopId: string; shopName?: string; fabricId: string; imageUrl: string; settings: FabricPatternSettings } | null;
  upload?: { fileName: string; imageUrl: string; settings: FabricPatternSettings } | null;
  fabricId: string | null;
  fabricImage: string | null;
  fabricSettings: FabricPatternSettings;
  selections: Record<string, DesignOption | null>;
  generatedImage: string | null;
  tryOnJobId?: string | null;
  tryOnResultUrl?: string | null;
  createdAt: number;
  updatedAt: number;
}

type FabricSource = 'khuyoot' | 'shops' | 'upload' | null;

type FabricPreviewCacheEntry = {
  settings: FabricPatternSettings;
  previewDataUrl: string | null;
  updatedAt: number;
};

const FABRIC_PREVIEW_CACHE_KEY = 'fabric_preview_cache_v1';

const arePatternSettingsEqual = (a?: FabricPatternSettings | null, b?: FabricPatternSettings | null) => {
  if (!a || !b) return false;
  return (
    a.patternScale === b.patternScale &&
    (a.patternOffsetX ?? 0) === (b.patternOffsetX ?? 0) &&
    (a.patternOffsetY ?? 0) === (b.patternOffsetY ?? 0) &&
    (a.patternRotation ?? 0) === (b.patternRotation ?? 0) &&
    (a.patternRepeatMode ?? 'repeat') === (b.patternRepeatMode ?? 'repeat')
  );
};

const MOCK_DESIGN_OPTIONS: DesignOption[] = [
  // Neck options
  { id: 'neck-round', category: 'neck', name: 'ياقة دائرية', thumbnailUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80', price: 0 },
  { id: 'neck-v', category: 'neck', name: 'ياقة V', thumbnailUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=300&q=80', price: 2 },
  { id: 'neck-collar', category: 'neck', name: 'ياقة مقلوبة', thumbnailUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=300&q=80', price: 3 },
  // Sleeve options
  { id: 'sleeve-long', category: 'sleeve', name: 'كم طويل', thumbnailUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=300&q=80', price: 0 },
  { id: 'sleeve-short', category: 'sleeve', name: 'كم قصير', thumbnailUrl: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=300&q=80', price: 0 },
  { id: 'sleeve-none', category: 'sleeve', name: 'بدون أكمام', thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80', price: -2 },
  // Embroidery options
  { id: 'emb-chest', category: 'embroidery', name: 'تطريز صدر', thumbnailUrl: 'https://images.unsplash.com/photo-1623606819913-521217902f1e?auto=format&fit=crop&w=300&q=80', price: 10 },
  { id: 'emb-collar', category: 'embroidery', name: 'تطريز ياقة', thumbnailUrl: 'https://images.unsplash.com/photo-1614597396930-a69e078882d8?auto=format&fit=crop&w=300&q=80', price: 8 },
  { id: 'emb-full', category: 'embroidery', name: 'تطريز كامل', thumbnailUrl: 'https://images.unsplash.com/photo-1586078130702-d208852b4c65?auto=format&fit=crop&w=300&q=80', price: 25 },
];

const DESIGN_CATEGORIES = [
  { id: 'neck', name: 'منطقة الرقبة', icon: '👔', description: 'اختر شكل منطقة الرقبة' },
  { id: 'sleeve', name: 'الأكمام', icon: '💪', description: 'اختر نوع الأكمام' },
  { id: 'embroidery', name: 'التطريز', icon: '✨', description: 'أضف لمسة جمالية' },
];

const TEMPLATES = [
  { id: 'dishdasha', name: 'دشداشة', icon: Shirt, color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
  { id: 'abaya', name: 'عباية', icon: Layers, color: 'from-slate-600 to-slate-800', bgColor: 'bg-slate-50 dark:bg-slate-900/20' },
  { id: 'dress', name: 'فستان', icon: Sparkles, color: 'from-pink-500 to-rose-500', bgColor: 'bg-pink-50 dark:bg-pink-900/20' },
  { id: 'suit', name: 'بدلة', icon: User, color: 'from-blue-600 to-indigo-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
];

const KHUYOOT_FABRICS = [
  { id: 'kh-1', name: 'قطن مصري فاخر', imageUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=300&q=80', price: 15 },
  { id: 'kh-2', name: 'حرير طبيعي', imageUrl: 'https://images.unsplash.com/photo-1595341595379-cf1cd0c839ca?auto=format&fit=crop&w=300&q=80', price: 35 },
  { id: 'kh-3', name: 'كتان إيطالي', imageUrl: 'https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?auto=format&fit=crop&w=300&q=80', price: 25 },
  { id: 'kh-4', name: 'قماش صوف', imageUrl: 'https://images.unsplash.com/photo-1558171014-df089ab41094?auto=format&fit=crop&w=300&q=80', price: 30 },
];

const SHOPS_FABRICS = [
  { shopId: 's-1', shopName: 'محل الياقوت', fabricId: 's1-f1', name: 'قطن عماني', imageUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=300&q=80', price: 12 },
  { shopId: 's-2', shopName: 'محل اللؤلؤ', fabricId: 's2-f2', name: 'حرير لامع', imageUrl: 'https://images.unsplash.com/photo-1595341595379-cf1cd0c839ca?auto=format&fit=crop&w=300&q=80', price: 28 },
  { shopId: 's-3', shopName: 'محل المرجان', fabricId: 's3-f3', name: 'كتان ناعم', imageUrl: 'https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?auto=format&fit=crop&w=300&q=80', price: 18 },
];

const DESIGN_DRAFT_KEY = 'khuyoot_design_draft';

const MAX_STORABLE_DATA_URL_CHARS = 200_000;

const isLikelyStorableUrl = (url: string | null | undefined): url is string => {
  if (!url) return false;
  if (url.startsWith('blob:')) return false;
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  if (url.startsWith('data:image/')) return url.length <= MAX_STORABLE_DATA_URL_CHARS;
  return false;
};

const sanitizePersistedImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  return isLikelyStorableUrl(url) ? url : null;
};

export const DesignerV2 = () => {
  // **HIBERNATION CHECK: Exit early if not active**
  const routeLocation = useLocation();
  const isActive = routeLocation.pathname === '/designer' || routeLocation.pathname.startsWith('/designer/');

  // **ZUSTAND SELECTOR FIX: Use specific selectors instead of destructuring entire state**
  const designerSession = useAppStore((state) => state.designerSession);
  const setDesignerSession = useAppStore((state) => state.setDesignerSession);
  const clearDesignerSession = useAppStore((state) => state.clearDesignerSession);

  // ... (KEEP ALL STATE AND LOGIC EXACTLY THE SAME - NO CHANGES HERE)
  const { user, appSettings } = useApp();

  const isAdminUser = user?.role === 'admin';
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const { id: routeId } = useParams();

  // Only mirror state to CreationContext for the default creation flow (/designer).
  // Editing a saved design (/designer/:id) should not overwrite the global creation resume state.
  const isCreationFlow = !routeId;
  const [fabricSettingsLocal, setFabricSettingsLocal] = useState<FabricPatternSettings>({
    patternScale: 1.0,
    patternOffsetX: 0,
    patternOffsetY: 0,
    patternRotation: 0,
    patternRepeatMode: 'repeat'
  });
  const [selectedTemplateLocal, setSelectedTemplateLocal] = useState('dishdasha');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageLocal, setGeneratedImageLocal] = useState<string | null>(null);
  const [generationsLocal, setGenerationsLocal] = useState<GenerationItem[]>([]);
  const [generationsBeforeUrl, setGenerationsBeforeUrl] = useState<string | null>(null);
  const [generationsAfterUrl, setGenerationsAfterUrl] = useState<string | null>(null);
  const [currentStepLocal, setCurrentStepLocal] = useState(1);
  
  const [fabricSourceLocal, setFabricSourceLocal] = useState<FabricSource>('khuyoot');
  const [selectedFabricIdLocal, setSelectedFabricIdLocal] = useState<string | null>(null);
  const [fabricImageLocal, setFabricImageLocal] = useState<string | null>(null);
  const [showFabricScale, setShowFabricScale] = useState(false);
  
  const selectedTemplate = isCreationFlow ? designerSession.selectedTemplate || 'dishdasha' : selectedTemplateLocal;
  const selectedFabricId = isCreationFlow ? designerSession.selectedFabricId : selectedFabricIdLocal;
  const generatedImage = isCreationFlow ? designerSession.generatedImage : generatedImageLocal;
  const fabricImage = isCreationFlow ? designerSession.fabricImage : fabricImageLocal;
  const fabricSource = isCreationFlow ? designerSession.fabricSource : fabricSourceLocal;
  const fabricSettings = isCreationFlow ? designerSession.fabricSettings : fabricSettingsLocal;
  const generations = isCreationFlow ? designerSession.generations : generationsLocal;
  const currentStep = isCreationFlow ? designerSession.currentStep : currentStepLocal;

  const setSelectedTemplate = useCallback(
    (action: React.SetStateAction<string>) => {
      const resolved = typeof action === 'function' ? action(selectedTemplate) : action;
      if (isCreationFlow) {
        setDesignerSession({ selectedTemplate: resolved });
      } else {
        setSelectedTemplateLocal(resolved);
      }
    },
    [isCreationFlow, selectedTemplate, setDesignerSession]
  );

  const setSelectedFabricId = useCallback(
    (action: React.SetStateAction<string | null>) => {
      const resolved = typeof action === 'function' ? action(selectedFabricId) : action;
      if (isCreationFlow) {
        setDesignerSession({ selectedFabricId: resolved });
      } else {
        setSelectedFabricIdLocal(resolved);
      }
    },
    [isCreationFlow, selectedFabricId, setDesignerSession]
  );

  const setGeneratedImage = useCallback(
    (action: React.SetStateAction<string | null>) => {
      const resolved = typeof action === 'function' ? action(generatedImage) : action;
      if (isCreationFlow) {
        setDesignerSession({ generatedImage: resolved });
      } else {
        setGeneratedImageLocal(resolved);
      }
    },
    [isCreationFlow, generatedImage, setDesignerSession]
  );

  const setFabricImage = useCallback(
    (action: React.SetStateAction<string | null>) => {
      const resolved = typeof action === 'function' ? action(fabricImage) : action;
      if (isCreationFlow) {
        setDesignerSession({ fabricImage: resolved });
      } else {
        setFabricImageLocal(resolved);
      }
    },
    [isCreationFlow, fabricImage, setDesignerSession]
  );

  const setFabricSource = useCallback(
    (action: React.SetStateAction<FabricSource>) => {
      const resolved = typeof action === 'function' ? action(fabricSource) : action;
      if (isCreationFlow) {
        setDesignerSession({ fabricSource: resolved });
      } else {
        setFabricSourceLocal(resolved);
      }
    },
    [isCreationFlow, fabricSource, setDesignerSession]
  );

  const setFabricSettings = useCallback(
    (action: React.SetStateAction<FabricPatternSettings>) => {
      const resolved = typeof action === 'function' ? action(fabricSettings) : action;
      if (isCreationFlow) {
        setDesignerSession({ fabricSettings: resolved });
      } else {
        setFabricSettingsLocal(resolved);
      }
    },
    [isCreationFlow, fabricSettings, setDesignerSession]
  );

  const setGenerations = useCallback(
    (action: React.SetStateAction<GenerationItem[]>) => {
      const resolved = typeof action === 'function' ? action(generations) : action;
      if (isCreationFlow) {
        setDesignerSession({ generations: resolved });
      } else {
        setGenerationsLocal(resolved);
      }
    },
    [isCreationFlow, generations, setDesignerSession]
  );

  const setCurrentStep = useCallback(
    (action: React.SetStateAction<number>) => {
      const resolved = typeof action === 'function' ? action(currentStep) : action;
      if (isCreationFlow) {
        setDesignerSession({ currentStep: resolved });
      } else {
        setCurrentStepLocal(resolved);
      }
    },
    [isCreationFlow, currentStep, setDesignerSession]
  );

  const resetCreation = useCallback(() => {
    clearDesignerSession();
  }, [clearDesignerSession]);

  const [fabricSettingsDraft, setFabricSettingsDraft] = useState<FabricPatternSettings | null>(null);
  const [fabricPreviewCache, setFabricPreviewCache] = useState<Record<string, FabricPreviewCacheEntry>>({});
  // Live preview blend options (kept local to avoid type changes)
  const [khuyootSel, setKhuyootSel] = useState<DesignDraft['khuyoot']>(null);
  const [shopsSel, setShopsSel] = useState<DesignDraft['shops']>(null);
  const [uploadSel, setUploadSel] = useState<DesignDraft['upload']>(null);
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<DesignOption | null>(null);
  const [fabricModalOpen, setFabricModalOpen] = useState(false);
  const [shopsModalOpen, setShopsModalOpen] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState<{ open: boolean; rootParentId?: string | null; preselectParentId?: string | null; preselectChildId?: string | null }>(
    { open: false }
  );
  const [imageLibraryCategories, setImageLibraryCategories] = useState<any[]>([]);
  const [showAdminLabels, setShowAdminLabels] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(location.search);
      return params.get('anchors') === '1';
    } catch {
      return false;
    }
  });

  // Feature toggles state
  const [features, setFeatures] = useState<TryOnResultFeatures>(DEFAULT_FEATURES);

  const imageCategoriesQuery = useQuery({
    queryKey: ['image-categories'],
    queryFn: () => getImageCategories(),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30, // Keep in cache 30min instead of default 5min
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(FABRIC_PREVIEW_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        setFabricPreviewCache(parsed as Record<string, FabricPreviewCacheEntry>);
      }
    } catch (error) {
      console.warn('Failed to load fabric preview cache', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(FABRIC_PREVIEW_CACHE_KEY, JSON.stringify(fabricPreviewCache));
    } catch (error) {
      console.warn('Failed to persist fabric preview cache', error);
    }
  }, [fabricPreviewCache]);

  useEffect(() => {
    if (!isAdminUser && showAdminLabels) {
      setShowAdminLabels(false);
      try {
        const params = new URLSearchParams(routeLocation.search);
        params.delete('anchors');
        const qs = params.toString();
        navigate(`${routeLocation.pathname}${qs ? `?${qs}` : ''}${routeLocation.hash || ''}`, { replace: true });
      } catch {
        // ignore
      }
    }
  }, [isAdminUser, showAdminLabels, navigate, routeLocation.pathname, routeLocation.search, routeLocation.hash]);

  useEffect(() => {
    if (!selectedFabricId) return;
    const cached = fabricPreviewCache[selectedFabricId];
    if (!cached) return;

    setFabricSettings((prev) => (arePatternSettingsEqual(prev, cached.settings) ? prev : { ...cached.settings }));

    if (cached.previewDataUrl) {
      setFabricImage((prev) => (prev === cached.previewDataUrl ? prev : cached.previewDataUrl));
    }

    const syncSelection = <T extends { fabricId: string; imageUrl: string; settings: FabricPatternSettings }>(
      setter: React.Dispatch<React.SetStateAction<T | null>>
    ) => {
      setter((prev) => {
        if (!prev || prev.fabricId !== selectedFabricId) return prev;
        const sameSettings = arePatternSettingsEqual(prev.settings, cached.settings);
        const sameImage = !cached.previewDataUrl || prev.imageUrl === cached.previewDataUrl;
        if (sameSettings && sameImage) return prev;
        return {
          ...prev,
          settings: cached.settings,
          ...(cached.previewDataUrl ? { imageUrl: cached.previewDataUrl } : {}),
        };
      });
    };

    syncSelection(setKhuyootSel);
    syncSelection(setShopsSel);
    syncSelection(setUploadSel);
  }, [selectedFabricId, fabricPreviewCache]);

  // Constants for generations management
  const generationsStorageKey = React.useMemo(() => `khuyoot_generations_${user?.id || 'guest'}`, [user?.id]);
  const maxStoredGenerations = 20;

  // Load generations from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(generationsStorageKey);
      if (!raw) {
        setGenerations([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setGenerations([]);
        return;
      }
      setGenerations(
        parsed
          .filter((x: any) => x && typeof x.jobId === 'string' && typeof x.url === 'string' && typeof x.createdAt === 'number')
          .map((x: any) => ({
            jobId: x.jobId as string,
            url: x.url as string,
            thumbnailUrl: (typeof x.thumbnailUrl === 'string' ? x.thumbnailUrl : null) as string | null,
            createdAt: x.createdAt as number,
            fabricId: (typeof x.fabricId === 'string' ? x.fabricId : null) as string | null,
            width: (typeof x.width === 'number' && Number.isFinite(x.width) ? x.width : null) as number | null,
            height: (typeof x.height === 'number' && Number.isFinite(x.height) ? x.height : null) as number | null,
          }))
          .slice(0, maxStoredGenerations)
      );
    } catch {
      setGenerations([]);
    }
  }, [generationsStorageKey, maxStoredGenerations]);

  // Load generations from Firestore
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!user?.id) return;
        if (!firebaseService.isInitialized()) return;
        const list = await firebaseService.getUserTryOnGenerations({ userId: user.id, limit: maxStoredGenerations });
        console.log('[DesignerV2] Loaded generations from Firestore:', list);
        if (cancelled) return;
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list
            .filter((x) => x && typeof x.jobId === 'string' && typeof x.url === 'string' && typeof x.createdAt === 'number')
            .map((x) => ({
              jobId: x.jobId,
              url: x.url,
              thumbnailUrl: (typeof (x as any).thumbnailUrl === 'string' ? (x as any).thumbnailUrl : null) as string | null,
              createdAt: x.createdAt,
              fabricId: (typeof (x as any).fabricId === 'string' ? (x as any).fabricId : null) as string | null,
              width: (typeof (x as any).width === 'number' && Number.isFinite((x as any).width) ? (x as any).width : null) as number | null,
              height: (typeof (x as any).height === 'number' && Number.isFinite((x as any).height) ? (x as any).height : null) as number | null,
            }))
            .slice(0, maxStoredGenerations);

          console.log('[DesignerV2] Mapped generations:', mapped);
          setGenerations(mapped);
          try {
            localStorage.setItem(generationsStorageKey, JSON.stringify(mapped));
          } catch {}
        }
      } catch (e) {
        console.warn('[DesignerV2] Failed to load generations from Firestore:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, generationsStorageKey, maxStoredGenerations]);

  // Persist generations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(generationsStorageKey, JSON.stringify(generations.slice(0, maxStoredGenerations)));
    } catch {}
  }, [generations, generationsStorageKey, maxStoredGenerations]);

  const [selections, setSelections] = useState<Record<string, DesignOption | null>>({});
  const [myDesigns, setMyDesigns] = useState<PersistedDesign[]>([]);
  const [startModalOpen, setStartModalOpen] = useState<boolean>(false);
  const [startMode, setStartMode] = useState<'choose' | 'edit'>('choose');
  const [dontShowStart, setDontShowStart] = useState<boolean>(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info' }>({ open: false, message: '', type: 'info' });
    useEffect(() => {
      const stored = localStorage.getItem('hide_designer_intro');
      setDontShowStart(stored === '1');
    }, []);

    // Sync intro preference with profile/local storage but keep modal hidden by default
    useEffect(() => {
      const stored = localStorage.getItem('hide_designer_intro') === '1';
      const profilePref = !!user && (user as any).hideDesignerIntro === true;
      const shouldHide = stored || profilePref;
      setDontShowStart(shouldHide);
      setStartModalOpen(false);
    }, [user]);

    // Load image library categories for mapping designer options
    useEffect(() => {
      (async () => {
        try {
          const cats = await getImageCategories();
          setImageLibraryCategories(cats);
        } catch (e) {
          console.warn('Failed to load image library categories');
        }
      })();
    }, []);

    const findCategoryByNames = (names: string[]) => {
      const norm = (s: string) => s.toLowerCase().trim();
      return imageLibraryCategories.find((c: any) => {
        const candidates = [c.nameAr, c.nameEn, c.name].filter(Boolean).map((x: string) => norm(x));
        return names.map(norm).some(n => candidates.includes(n));
      });
    };

    const openLibraryForOption = (optionId: string) => {
      // Map specific options to image library categories
      if (optionId === 'emb-chest') {
        const cat = findCategoryByNames(['تطريز الصدر', 'Chest Embroidery']);
        if (cat) {
          setImagePickerOpen({ open: true, preselectParentId: cat.parentId || null });
        } else {
          setImagePickerOpen({ open: true });
        }
      } else if (optionId === 'emb-collar') {
        const cat = findCategoryByNames(['تطريز الرقبة', 'Neck Embroidery']);
        if (cat) {
          setImagePickerOpen({ open: true, preselectParentId: cat.parentId || null });
        } else {
          setImagePickerOpen({ open: true });
        }
      } else if (optionId === 'emb-full') {
        const cat = findCategoryByNames(['تطريز كامل', 'Full Embroidery']);
        setImagePickerOpen({ open: true, preselectParentId: cat?.parentId || null });
      } else if (optionId.startsWith('neck-')) {
        const cat = findCategoryByNames(['تطريز الرقبة', 'Neck Embroidery']);
        setImagePickerOpen({ open: true, preselectParentId: cat?.parentId || null });
      } else if (optionId.startsWith('sleeve-')) {
        const cat = findCategoryByNames(['تطريز الأكمام', 'Sleeve Embroidery']);
        setImagePickerOpen({ open: true, preselectParentId: cat?.parentId || null });
      } else {
        setImagePickerOpen({ open: true });
      }
    };

    const toggleDontShowStart = (checked: boolean) => {
      // Only update local state; persist on modal confirm
      setDontShowStart(checked);
    };

    const persistDontShowStart = async () => {
      try {
        localStorage.setItem('hide_designer_intro', dontShowStart ? '1' : '0');
        if (user && firebaseService.isInitialized()) {
          await firebaseService.updateUserProfile(user.id, { hideDesignerIntro: dontShowStart } as any);
        }
      } catch {}
    };
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      if (!params.has('anchors')) return;
      setShowAdminLabels(params.get('anchors') === '1');
    } catch {}
  }, [location.search]);
  const toastTimer = React.useRef<number | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [savedFlash, setSavedFlash] = useState<boolean>(false);
  const savedFlashTimer = React.useRef<number | null>(null);
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const [measurementTemplates, setMeasurementTemplates] = useState<MeasurementTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState<boolean>(false);
  const [templatesFallback, setTemplatesFallback] = useState<boolean>(false);
  const [templateModalOpen, setTemplateModalOpen] = useState<boolean>(false);



  const [templateSearch, setTemplateSearch] = useState<string>('');
  const [showTemplateImageLibrary, setShowTemplateImageLibrary] = useState<boolean>(false);
  const tryFabricPanelRef = React.useRef<TryFabricPanelHandle | null>(null);
  const [pendingTryOnFabricPickerOpen, setPendingTryOnFabricPickerOpen] = useState(false);
  const [pendingTryOnTemplatePickerOpen, setPendingTryOnTemplatePickerOpen] = useState(false);
  const [templateImageOverrides, setTemplateImageOverrides] = useState<Record<string, string>>({});
  const [templateFullSizeCache, setTemplateFullSizeCache] = useState<Record<string, string>>({});
  const [imageCategories, setImageCategories] = useState<any[]>([]);
  const [womenRootId, setWomenRootId] = useState<string | null>(null);
  const [womenLevel1, setWomenLevel1] = useState<any[]>([]);
  const [showMyDesigns, setShowMyDesigns] = useState<boolean>(false);
  const [lastTryOnJobId, setLastTryOnJobId] = useState<string | null>(null);
  const [lastTryOnResultUrl, setLastTryOnResultUrl] = useState<string | null>(null);
  const [tryOnThumbnailsByJobId, setTryOnThumbnailsByJobId] = useState<Record<string, string>>({});
  const tryOnThumbFetchInFlightRef = React.useRef<Set<string>>(new Set());
  const [templateSectionCollapsed, setTemplateSectionCollapsed] = useState(false);
  const [fabricSectionCollapsed, setFabricSectionCollapsed] = useState(false);
  const [fabricMeters, setFabricMeters] = useState<number>(3);
  const [templateDimensions, setTemplateDimensions] = useState<{ width: number; height: number } | null>(null);
  const templateSectionRef = React.useRef<HTMLDivElement | null>(null);
  const fabricSectionRef = React.useRef<HTMLDivElement | null>(null);
  const fabricUploadInputRef = React.useRef<HTMLInputElement | null>(null);
  const tryFabricSectionRef = React.useRef<HTMLDivElement | null>(null);
  
  // Logic hooks (same as before)
  const garmentTypes = React.useMemo(() => {
    const map = new Map<string, { type: string; imageUrl?: string; count: number }>();
    measurementTemplates.forEach(t => {
      const key = t.productType;
      const current = map.get(key);
      const img = t.categoryImageUrl || t.baseImageUrl;
      if (!current) map.set(key, { type: key, imageUrl: img, count: 1 });
      else map.set(key, { type: key, imageUrl: current.imageUrl || img, count: current.count + 1 });
    });
    return Array.from(map.values());
  }, [measurementTemplates]);

  const filteredGarmentTypes = React.useMemo(() => {
    const q = templateSearch.trim().toLowerCase();
    if (!q) return garmentTypes;
    return garmentTypes.filter(gt => {
      const tplDefName = TEMPLATES.find(t => t.id === gt.type)?.name?.toLowerCase() || gt.type.toLowerCase();
      const matchName = tplDefName.includes(q);
      const matchTemplates = measurementTemplates.some(t => t.productType === gt.type && (t.name?.toLowerCase().includes(q)));
      return matchName || matchTemplates;
    });
  }, [templateSearch, garmentTypes, measurementTemplates]);
  const currentTemplate = React.useMemo(() => TEMPLATES.find(t => t.id === selectedTemplate), [selectedTemplate]);
  const templatePreviewUrl = React.useMemo(() => {
    const templateMatch = measurementTemplates.find(t => t.productType === selectedTemplate);
    const overrideImg = templateImageOverrides[selectedTemplate];
    return overrideImg || templateMatch?.categoryImageUrl || templateMatch?.baseImageUrl || null;
  }, [measurementTemplates, selectedTemplate, templateImageOverrides]);
  const selectedTemplateName = React.useMemo(() => {
    if (currentTemplate?.name) return currentTemplate.name;
    const tpl = measurementTemplates.find(t => t.productType === selectedTemplate);
    return tpl?.name || 'الموديل';
  }, [currentTemplate, measurementTemplates, selectedTemplate]);

  // Load template dimensions when template image changes
  // IMPORTANT: Use getOptimizedImageUrl with 'original' to load the full-resolution image
  // (not a resized thumbnail) to get accurate dimensions
  useEffect(() => {
    if (!templatePreviewUrl) {
      setTemplateDimensions(null);
      return;
    }

    // Force loading the original full-size image (not a resized thumbnail)
    const originalUrl = getOptimizedImageUrl(templatePreviewUrl, 'original');
    const urlToLoad = originalUrl || templatePreviewUrl;

    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      console.log('[DesignerV2] Template image loaded:', { 
        url: urlToLoad,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: img.width,
        displayHeight: img.height,
        completeImage: img.complete
      });
      setTemplateDimensions(dims);
    };
    img.onerror = () => {
      console.error('[DesignerV2] Template image failed to load:', urlToLoad);
      setTemplateDimensions(null);
    };
    img.src = urlToLoad;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [templatePreviewUrl]);
  const fabricLabel = React.useMemo(() => {
    if (fabricSource === 'khuyoot' && selectedFabricId) {
      return khuyootSel?.name || KHUYOOT_FABRICS.find(f => f.id === selectedFabricId)?.name || null;
    }
    if (fabricSource === 'shops' && selectedFabricId) {
      const fromShop = SHOPS_FABRICS.find(f => f.fabricId === selectedFabricId);
      if (fromShop) return `${fromShop.name} • ${fromShop.shopName}`;
      return shopsSel?.shopName || null;
    }
    if (fabricSource === 'upload') {
      return uploadSel?.fileName || 'صورة مرفوعة';
    }
    return null;
  }, [fabricSource, khuyootSel, selectedFabricId, shopsSel, uploadSel]);
  const fabricUnitPrice = React.useMemo(() => {
    if (fabricSource === 'khuyoot' && selectedFabricId) {
      return KHUYOOT_FABRICS.find(f => f.id === selectedFabricId)?.price ?? 0;
    }
    if (fabricSource === 'shops' && selectedFabricId) {
      return SHOPS_FABRICS.find(f => f.fabricId === selectedFabricId)?.price ?? 0;
    }
    return 0;
  }, [fabricSource, selectedFabricId]);
  const fabricCostEstimate = React.useMemo(() => {
    return Number((fabricUnitPrice || 0) * fabricMeters);
  }, [fabricMeters, fabricUnitPrice]);

  useEffect(() => {
    if (!lastSavedAt) return;
    const interval = window.setInterval(() => setNowTs(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, [lastSavedAt]);

  const formatRelativeTime = (ts: number) => {
    try {
      const diffMs = nowTs - ts;
      const diffSec = Math.round(diffMs / 1000);
      const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' });
      if (diffSec < 60) return rtf.format(-diffSec, 'second');
      const diffMin = Math.round(diffSec / 60);
      if (diffMin < 60) return rtf.format(-diffMin, 'minute');
      const diffHr = Math.round(diffMin / 60);
      if (diffHr < 24) return rtf.format(-diffHr, 'hour');
      const diffDay = Math.round(diffHr / 24);
      return rtf.format(-diffDay, 'day');
    } catch {
      return new Date(ts).toLocaleTimeString('ar-OM');
    }
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (selectedTemplate) params.set('template', selectedTemplate);
    if (fabricSource) params.set('source', fabricSource);
    if (fabricSource && selectedFabricId && (fabricSource === 'khuyoot' || fabricSource === 'shops')) params.set('fid', selectedFabricId);
    for (const [catId, opt] of Object.entries(selections) as [string, DesignOption | null][]) {
      if (opt) params.set(catId, opt.id);
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };
  const toggleAdminAnchors = () => {
    const next = !showAdminLabels;
    setShowAdminLabels(next);
    try {
      const params = new URLSearchParams(location.search);
      if (next) params.set('anchors', '1');
      else params.delete('anchors');
      const qs = params.toString();
      navigate(`${routeLocation.pathname}${qs ? `?${qs}` : ''}${routeLocation.hash || ''}`, { replace: true });
    } catch {}
  };

  const ensureDesignId = (): string => {
    let id = currentDesignId;
    if (!id) {
      id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `design-${Date.now()}-${Math.floor(Math.random()*10000)}`;
      setCurrentDesignId(id);
      navigate(`/designer/${id}${buildQuery()}`);
    }
    return id;
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
    if (toastTimer.current) { window.clearTimeout(toastTimer.current); toastTimer.current = null; }
    setToast({ open: true, message, type });
    toastTimer.current = window.setTimeout(() => { setToast(prev => ({ ...prev, open: false })); toastTimer.current = null; }, duration);
  };

  const generateThumbnailFromDataUrl = (dataUrl: string, width: number, height: number): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);

          const scale = Math.max(width / img.width, height / img.height);
          const sw = width / scale;
          const sh = height / scale;
          const sx = (img.width - sw) / 2;
          const sy = (img.height - sh) / 2;

          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch (e) {
          console.error('Thumbnail generation error:', e);
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  };
  const loadImageDims = React.useCallback((url: string): Promise<{ width: number; height: number } | null> => {
    return new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image();
      img.onload = () => {
        const w = Number((img as any).naturalWidth || img.width || 0);
        const h = Number((img as any).naturalHeight || img.height || 0);
        if (!w || !h) return resolve(null);
        resolve({ width: w, height: h });
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }, []);

  const upsertGeneration = React.useCallback((
    jobId: string,
    url: string,
    thumbnailUrl?: string | null,
    meta?: { fabricId?: string | null }
  ) => {
    const finalThumb = thumbnailUrl ?? url;
    console.log('[DesignerV2] upsertGeneration:', { jobId, url: url?.substring(0, 50), thumbnailUrl: finalThumb?.substring(0, 50) });

    const createdAt = Date.now();
    const key = `${jobId}:${url}`;
    
    setGenerations(prev => {
      const filtered = prev.filter(g => `${g.jobId}:${g.url}` !== key);
      return [
        { jobId, url, thumbnailUrl: finalThumb, createdAt, fabricId: meta?.fabricId ?? null, width: null, height: null },
        ...filtered,
      ].slice(0, 20);
    });

    // Hydrate image dimensions async (best effort) for hover details.
    // Prefer thumbnail for speed; fallback to full URL.
    (async () => {
      const dims = await loadImageDims(finalThumb || url);
      if (!dims) return;
      setGenerations((prev) => {
        const next = prev.map((g) => {
          const k = `${g.jobId}:${g.url}`;
          if (k !== key) return g;
          if (g.width && g.height) return g;
          return { ...g, width: dims.width, height: dims.height };
        });
        return next;
      });
    })();
  }, [loadImageDims]);

  // Callback to reload generations from Firestore
  const reloadGenerations = useCallback(async () => {
    if (!user?.id || !firebaseService.isInitialized()) return;
    
    try {
      const jobs = await firebaseService.getUserTryOnJobs(user.id, 100);
      console.log('[DesignerV2] Reloaded try-on jobs from Firestore:', jobs.length);
      
      jobs.forEach((job) => {
        upsertGeneration(job.jobId, job.resultUrl, job.thumbnailUrl, { fabricId: job.fabricId || null });
      });
    } catch (e) {
      console.error('[DesignerV2] Failed to reload try-on jobs:', e);
    }
  }, [user?.id, upsertGeneration]);

  // Load user's try-on jobs from Firestore on mount
  useEffect(() => {
    reloadGenerations();
  }, [reloadGenerations]);

  // If thumbnails are already stored in Firestore (tryon_jobs.thumbnailUrl), hydrate them for the rail.
  useEffect(() => {
    if (!firebaseService.isInitialized()) return;
    if (!generations || generations.length === 0) return;

    const candidateJobIds = generations
      .map((g) => g.jobId)
      .filter((jobId): jobId is string => {
        if (typeof jobId !== 'string' || !jobId) return false;
        // Avoid refetching if we already have it.
        if (tryOnThumbnailsByJobId[jobId]) return false;
        // Avoid parallel duplicate fetches.
        if (tryOnThumbFetchInFlightRef.current.has(jobId)) return false;
        // Only attempt for UUID-like ids (try-on jobs). Skip local preview ids.
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId)) return false;
        return true;
      });

    const unique = (Array.from(new Set(candidateJobIds)) as string[]).slice(0, 10);
    if (unique.length === 0) return;

    unique.forEach((id) => tryOnThumbFetchInFlightRef.current.add(id));

    (async () => {
      console.log('[DesignerV2] Fetching Firestore thumbnails for jobIds:', unique);
      try {
        const results = await Promise.allSettled(unique.map((id) => firebaseService.getTryOnJobById(id)));
        const found: Record<string, string> = {};
        results.forEach((res, idx) => {
          if (res.status !== 'fulfilled') {
            console.warn('[DesignerV2] Firestore fetch failed for:', unique[idx], res.reason);
            return;
          }
          const job = res.value;
          if (!job?.id) return;
          if (job.thumbnailUrl) {
            console.log('[DesignerV2] Found thumbnail in Firestore:', job.id, job.thumbnailUrl.substring(0, 50));
            found[job.id] = job.thumbnailUrl;
          }
        });

        const foundIds = Object.keys(found);
        console.log('[DesignerV2] Firestore thumbnails found:', foundIds.length, 'of', unique.length);
        
        if (foundIds.length > 0) {
          setTryOnThumbnailsByJobId((prev) => ({ ...prev, ...found }));
          setGenerations((prev) => {
            let changed = false;
            const next = prev.map((g) => {
              const thumb = found[g.jobId];
              if (!thumb) return g;
              if (g.thumbnailUrl === thumb) return g;
              changed = true;
              return { ...g, thumbnailUrl: thumb };
            });
            console.log('[DesignerV2] Updated', changed ? 'some' : 'no', 'generation items with Firestore thumbnails');
            return changed ? next : prev;
          });
        }
      } finally {
        unique.forEach((id) => tryOnThumbFetchInFlightRef.current.delete(id));
      }
    })();
  }, [generations, tryOnThumbnailsByJobId]);
  const handleOpenImage = (url: string | null) => {
    if (!url) return;
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {}
  };
  const handleSetGenerationBefore = (url: string) => {
    if (!url) return;
    setGenerationsBeforeUrl(url);
    showToast('تم تعيين كـ قبل', 'success');
  };
  const handleSetGenerationAfter = (url: string) => {
    if (!url) return;
    setGenerationsAfterUrl(url);
    showToast('تم تعيين كـ بعد', 'success');
  };
  
  // Refresh the after image with the latest generation
  const handleRefreshAfterImage = React.useCallback(() => {
    if (lastTryOnResultUrl) {
      setGenerationsAfterUrl(lastTryOnResultUrl);
      showToast('تم تحديث صورة النتيجة', 'success');
    } else if (generations.length > 0) {
      setGenerationsAfterUrl(generations[0].url);
      showToast('تم تحديث صورة النتيجة', 'success');
    }
  }, [lastTryOnResultUrl, generations, showToast]);

  // Save the current after image to the generations rail
  const handleSaveAfterImage = React.useCallback(() => {
    if (!generationsAfterUrl) {
      showToast('لا توجد صورة لحفظها', 'error');
      return;
    }
    
    // Create a new generation entry with current timestamp
    const jobId = `saved-${Date.now()}`;
    upsertGeneration(jobId, generationsAfterUrl, generationsAfterUrl, { fabricId: selectedFabricId || null });
    showToast('✅ تم حفظ الصورة في التوليدات', 'success');
  }, [generationsAfterUrl, selectedFabricId, upsertGeneration, showToast]);
  
  // ... (Keep existing useEffects for loading/saving logic)
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setTemplatesLoading(true);
        const data = await firebaseService.getMeasurementTemplates();
        setMeasurementTemplates(data || []);
        setTemplatesFallback(false);
      } catch (e) {
        showToast('يتم استخدام قوالب محلية مؤقتاً', 'info', 2500);
        setTemplatesFallback(true);
      } finally {
        setTemplatesLoading(false);
      }
    };
    loadTemplates();
    if (imageCategoriesQuery.data) {
      try {
        const cats = imageCategoriesQuery.data;
        setImageCategories(cats);
        const womenRoot = cats.find((c: any) => (c.level === 0 || !c.parentId) && ((c.nameAr || c.name || '').includes('الأزياء')));
        setWomenRootId(womenRoot?.id || null);
        const level1 = womenRoot ? cats.filter((c: any) => c.parentId === womenRoot.id && (c.hasChildren || c.level === 1)) : [];
        setWomenLevel1(level1);
      } catch (e) {}
    }
    const savedDraft = localStorage.getItem(DESIGN_DRAFT_KEY);

    // If there's no local draft, hydrate the rest of the UI from the persisted context values
    // (selectedFabric/selectedTemplate/generatedResult survive refresh/navigation).
    if (!savedDraft && isCreationFlow) {
      try {
        if (selectedFabricId) {
          const kh = KHUYOOT_FABRICS.find((f) => f.id === selectedFabricId);
          const sh = SHOPS_FABRICS.find((f) => f.fabricId === selectedFabricId);
          if (kh) {
            setFabricSource('khuyoot');
            setFabricImage(kh.imageUrl);
            setKhuyootSel({ fabricId: kh.id, name: kh.name, imageUrl: kh.imageUrl, settings: fabricSettings });
            setCurrentStep((prev) => Math.max(prev, 2));
          } else if (sh) {
            setFabricSource('shops');
            setFabricImage(sh.imageUrl);
            setShopsSel({ shopId: sh.shopId, shopName: sh.shopName, fabricId: sh.fabricId, imageUrl: sh.imageUrl, settings: fabricSettings });
            setCurrentStep((prev) => Math.max(prev, 2));
          }
        }

        if (generatedImage) {
          setCurrentStep(3);
        } else if (selectedFabricId) {
          setCurrentStep((prev) => Math.max(prev, 2));
        }
      } catch {
        // Ignore hydration errors; local draft may still load.
      }
    }
    if (savedDraft) {
      try {
        const draft: DesignDraft = JSON.parse(savedDraft);
        setSelectedTemplate(draft.selectedTemplate);
        setFabricSource(draft.fabricSource ?? 'khuyoot');
        setSelectedFabricId(draft.fabricId);
        // If we couldn't persist the full image (e.g. big data URL), recover from stored selection.
        const recoveredFabricImage =
          draft.fabricImage ||
          (draft.fabricSource === 'khuyoot' ? draft.khuyoot?.imageUrl : null) ||
          (draft.fabricSource === 'shops' ? draft.shops?.imageUrl : null) ||
          (draft.fabricSource === 'upload' ? draft.upload?.imageUrl : null) ||
          null;
        setFabricImage(recoveredFabricImage);
        setFabricSettings(draft.fabricSettings);
        setKhuyootSel(draft.khuyoot || null);
        setShopsSel(draft.shops || null);
        setUploadSel(draft.upload || null);
        setSelections(draft.selections);
        setGeneratedImage(draft.generatedImage);
        setLastTryOnJobId(draft.tryOnJobId || null);
        setLastTryOnResultUrl(draft.tryOnResultUrl || null);
        if (draft.generatedImage) upsertGeneration(draft.id, draft.generatedImage, draft.generatedImage);
        if (draft.tryOnResultUrl) upsertGeneration(draft.tryOnJobId || `${draft.id}-tryon`, draft.tryOnResultUrl, draft.tryOnResultUrl);
        setCurrentDesignId(draft.id);
        if (draft.generatedImage) setCurrentStep(3);
        else if (Object.values(draft.selections).some(Boolean) || draft.fabricImage) setCurrentStep(2);
      } catch (e) {}
    }
  }, [isOnline, upsertGeneration, isCreationFlow, selectedFabricId, generatedImage, imageCategoriesQuery.data]);

  useEffect(() => {
    const loadByRouteId = async () => {
      if (!routeId) return;
      if (currentDesignId === routeId) return;
      setCurrentDesignId(routeId);
      if (user) {
        const existing = await designService.getDesign(user.id, routeId);
        if (existing) {
          setSelectedTemplate(existing.selectedTemplate);
          setFabricSource(existing.fabricSource);
          setKhuyootSel(existing.khuyoot || null);
          setShopsSel(existing.shops || null);
          setUploadSel(existing.upload || null);
          setSelectedFabricId(existing.fabricId);
          setFabricImage(existing.fabricImage);
          setFabricSettings(existing.fabricSettings as FabricPatternSettings);
          const mapped: Record<string, DesignOption | null> = {};
          Object.entries(existing.selections || {}).forEach(([k, v]) => {
            mapped[k] = v ? { id: v.id, name: v.name, category: k as DesignOption['category'], thumbnailUrl: v.thumbnailUrl, price: v.price } : null;
          });
          setSelections(mapped);
          setGeneratedImage(existing.generatedImage);
          setLastTryOnJobId(existing.tryOnJobId || null);
          setLastTryOnResultUrl(existing.tryOnResultUrl || null);
          if (existing.generatedImage) upsertGeneration(existing.id, existing.generatedImage, existing.generatedImage);
          if (existing.tryOnResultUrl) upsertGeneration(existing.tryOnJobId || `${existing.id}-tryon`, existing.tryOnResultUrl, existing.tryOnResultUrl);
          setCurrentStep(existing.generatedImage ? 3 : (existing.fabricImage || Object.values(mapped).some(Boolean)) ? 2 : 1);
        }
      }
      const params = new URLSearchParams(location.search);
      const tpl = params.get('template');
      const src = params.get('source') as FabricSource | null;
      const fid = params.get('fid');
      if (tpl && TEMPLATES.some(t => t.id === tpl)) setSelectedTemplate(tpl);
      if (src === 'khuyoot' || src === 'shops' || src === 'upload' || src === null) {
        if (src) setFabricSource(src);
        if (fid && src === 'khuyoot') {
          const f = KHUYOOT_FABRICS.find(k => k.id === fid);
          if (f) { setSelectedFabricId(f.id); setFabricImage(f.imageUrl); setKhuyootSel({ fabricId: f.id, name: f.name, imageUrl: f.imageUrl, settings: fabricSettings }); setCurrentStep(Math.max(currentStep, 2)); }
        } else if (fid && src === 'shops') {
          const s = SHOPS_FABRICS.find(k => k.fabricId === fid);
          if (s) { setSelectedFabricId(s.fabricId); setFabricImage(s.imageUrl); setShopsSel({ shopId: s.shopId, shopName: s.shopName, fabricId: s.fabricId, imageUrl: s.imageUrl, settings: fabricSettings }); setCurrentStep(Math.max(currentStep, 2)); }
        }
      }
      const nextSelections: Record<string, DesignOption | null> = { ...selections };
      DESIGN_CATEGORIES.forEach(cat => {
        const optId = params.get(cat.id);
        if (optId) {
          const found = MOCK_DESIGN_OPTIONS.find(o => o.id === optId && o.category === cat.id);
          if (found) nextSelections[cat.id] = found;
        }
      });
      setSelections(nextSelections);
      if (Object.values(nextSelections).some(Boolean)) setCurrentStep(Math.max(currentStep, 2));
    };
    loadByRouteId();
  }, [routeId, user, location.search, upsertGeneration]);

  const designsQuery = useQuery({
    queryKey: ['designer-designs', user?.id],
    queryFn: async () => {
      if (!user) return [] as PersistedDesign[];
      const list = await designService.listDesigns(user.id);
      return list.sort((a, b) => b.updatedAt - a.updatedAt);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15, // Keep in cache 15min instead of default 5min
  });

  useEffect(() => {
    if (designsQuery.data) {
      setMyDesigns(designsQuery.data);
    }
  }, [designsQuery.data]);

  useEffect(() => {
    const sanitizedFabricImage = sanitizePersistedImageUrl(fabricImage);
    const sanitizedUpload = uploadSel && sanitizePersistedImageUrl(uploadSel.imageUrl)
      ? { ...uploadSel, imageUrl: sanitizePersistedImageUrl(uploadSel.imageUrl)! }
      : null;

    // If upload image can't be stored (usually too large), don't keep an unusable upload selection.
    const sanitizedFabricSource: FabricSource = (fabricSource === 'upload' && !sanitizedUpload) ? null : fabricSource;
    const sanitizedFabricId: string | null = (fabricSource === 'upload' && !sanitizedUpload) ? null : selectedFabricId;

    const draft: DesignDraft = {
      id: currentDesignId || `draft-${Date.now()}`,
      selectedTemplate,
      fabricSource: sanitizedFabricSource,
      khuyoot: khuyootSel || null,
      shops: shopsSel || null,
      upload: sanitizedUpload,
      fabricId: sanitizedFabricId,
      fabricImage: sanitizedFabricImage,
      fabricSettings,
      selections,
      generatedImage: sanitizePersistedImageUrl(generatedImage),
      tryOnJobId: lastTryOnJobId || null,
      tryOnResultUrl: sanitizePersistedImageUrl(lastTryOnResultUrl),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      localStorage.setItem(DESIGN_DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      // If we still exceed quota, fall back to a minimal draft that preserves IDs.
      try {
        const minimal: DesignDraft = {
          ...draft,
          khuyoot: draft.khuyoot ? { ...draft.khuyoot, imageUrl: sanitizePersistedImageUrl(draft.khuyoot.imageUrl) || draft.khuyoot.imageUrl } : null,
          shops: draft.shops ? { ...draft.shops, imageUrl: sanitizePersistedImageUrl(draft.shops.imageUrl) || draft.shops.imageUrl } : null,
          upload: null,
          fabricImage: null,
          generatedImage: null,
          tryOnResultUrl: null,
        };
        localStorage.setItem(DESIGN_DRAFT_KEY, JSON.stringify(minimal));
      } catch (e2) {
        console.warn('Failed to persist design draft', error, e2);
      }
    }
  }, [selectedTemplate, fabricSource, selectedFabricId, fabricImage, fabricSettings, selections, generatedImage, currentDesignId, khuyootSel, shopsSel, uploadSel, lastTryOnJobId, lastTryOnResultUrl]);

  const handleFabricUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setFabricImage(url);
        const customId = `custom-${Date.now()}`;
        setSelectedFabricId(customId);
        setUploadSel({ fileName: file.name, imageUrl: url, settings: fabricSettings });
        setCurrentStep(Math.max(currentStep, 2));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryClick = (categoryId: string) => { 
    setActiveCategory(categoryId); 
    setPendingSelection(selections[categoryId] || null);
    setModalOpen(true); 
  };
  const handleOptionSelect = (option: DesignOption) => { 
    setPendingSelection(option);
  };
  const handleRemoveSelection = (categoryId: string) => { setSelections(prev => ({ ...prev, [categoryId]: null })); };
  const confirmSelection = () => {
    if (activeCategory) {
      setSelections(prev => ({ ...prev, [activeCategory]: pendingSelection }));
      if (pendingSelection) setCurrentStep(Math.max(currentStep, 2));
    }
    setModalOpen(false);
  };
  
  const handleGenerate = React.useCallback(async () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generatedUrl = `https://picsum.photos/seed/${Date.now()}/500/700`;
      setGeneratedImage(generatedUrl);
      upsertGeneration(`preview-${Date.now()}`, generatedUrl, generatedUrl);
      setIsGenerating(false);
      setCurrentStep(3);
      if (user) {
        const designId = `design-${Date.now()}`;
        setCurrentDesignId(designId);
        trackDesignEvent(user.id, 'design_created', designId, selectedFabricId || undefined, Object.values(selections).filter((o): o is DesignOption => o !== null).map(o => o.id));
      }
    }, 2500);
  }, [upsertGeneration, user, selectedFabricId, selections]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onFooterGenerate = () => {
      // Trigger the same "توليد (Try Fabric)" flow inside TryFabricPanel.
      tryFabricPanelRef.current?.generate();
    };
    window.addEventListener('khuyoot:designer-generate', onFooterGenerate as EventListener);
    return () => {
      window.removeEventListener('khuyoot:designer-generate', onFooterGenerate as EventListener);
    };
  }, []);

  const handleSaveDesign = React.useCallback(async () => {
    if (!user) { showToast('يرجى تسجيل الدخول لحفظ التصميم', 'error'); return; }
    let id = currentDesignId;
    if (!id) {
      id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `design-${Date.now()}-${Math.floor(Math.random()*10000)}`;
      setCurrentDesignId(id);
      navigate(`/designer/${id}${buildQuery()}`);
    }
    const payload: PersistedDesign = { id: id, userId: user.id, selectedTemplate, fabricSource, khuyoot: khuyootSel || null, shops: shopsSel || null, upload: uploadSel || null, fabricId: selectedFabricId, fabricImage, fabricSettings, selections: selections as any, generatedImage, tryOnJobId: lastTryOnJobId || null, tryOnResultUrl: lastTryOnResultUrl || null, createdAt: Date.now(), updatedAt: Date.now() };
    await designService.saveDesign(payload);
    await trackDesignEvent(user.id, 'design_saved', id, selectedFabricId || undefined, Object.values(selections).filter((o): o is DesignOption => o !== null).map(o => o.id));
    showToast('✅ تم حفظ التصميم بنجاح!', 'success');
    setLastSavedAt(Date.now());
    setSavedFlash(true);
    if (savedFlashTimer.current) { window.clearTimeout(savedFlashTimer.current); savedFlashTimer.current = null; }
    savedFlashTimer.current = window.setTimeout(() => { setSavedFlash(false); savedFlashTimer.current = null; }, 4000);
  }, [user, currentDesignId, selectedTemplate, fabricSource, khuyootSel, shopsSel, uploadSel, selectedFabricId, fabricImage, fabricSettings, selections, generatedImage, lastTryOnJobId, lastTryOnResultUrl, navigate, buildQuery, showToast]);

  const handleAddToCart = React.useCallback(async () => {
    if (!user || !currentDesignId) { showToast('يرجى تسجيل الدخول أولاً', 'error'); return; }
    await trackDesignEvent(user.id, 'added_to_cart', currentDesignId, selectedFabricId || undefined, Object.values(selections).filter((o): o is DesignOption => o !== null).map(o => o.id));
    showToast('🛒 تمت الإضافة إلى السلة!', 'success');
  }, [user, currentDesignId, selectedFabricId, selections, showToast]);

  const handleReset = React.useCallback(() => {
    setGeneratedImage(null);
    setSelections({});
    setFabricImage(null);
    setSelectedFabricId(null);
    setFabricSource(null);
    setCurrentStep(1);
    setShowFabricScale(false);
    setFabricSettingsDraft(null);
    setGenerations([]);
    setLastTryOnJobId(null);
    setLastTryOnResultUrl(null);
    setFabricMeters(3);
    localStorage.removeItem(DESIGN_DRAFT_KEY);
    if (isCreationFlow) {
      resetCreation();
    }
  }, [isCreationFlow, resetCreation]);
  const startNewDesign = () => { handleReset(); ensureDesignId(); setStartModalOpen(false); };
  const openExistingDesign = (d: PersistedDesign) => { navigate(`/designer/${d.id}`); handleLoadDesign(d); setStartModalOpen(false); };
  const handleLoadDesign = async (d: PersistedDesign) => {
    setCurrentDesignId(d.id);
    setSelectedTemplate(d.selectedTemplate);
    setFabricSource(d.fabricSource);
    setKhuyootSel(d.khuyoot || null);
    setShopsSel(d.shops || null);
    setUploadSel(d.upload || null);
    setSelectedFabricId(d.fabricId);
    setFabricImage(d.fabricImage);
    setFabricSettings(d.fabricSettings as FabricPatternSettings);
    const mapped: Record<string, DesignOption | null> = {};
    Object.entries(d.selections || {}).forEach(([k, v]) => {
      mapped[k] = v ? { id: v.id, name: v.name, category: k as DesignOption['category'], thumbnailUrl: v.thumbnailUrl, price: v.price } : null;
    });
    setSelections(mapped);
    setGeneratedImage(d.generatedImage);
    setLastTryOnJobId(d.tryOnJobId || null);
    setLastTryOnResultUrl(d.tryOnResultUrl || null);
    if (d.generatedImage) upsertGeneration(d.id, d.generatedImage, d.generatedImage);
    if (d.tryOnResultUrl) upsertGeneration(d.tryOnJobId || `${d.id}-tryon`, d.tryOnResultUrl, d.tryOnResultUrl);
    setCurrentStep(d.generatedImage ? 3 : (d.fabricImage || Object.values(mapped).some(Boolean)) ? 2 : 1);
  };

  const handleFabricSourceSelect = (source: FabricSource) => {
    setFabricSource(source);
    if (source === 'khuyoot' && khuyootSel) {
      setSelectedFabricId(khuyootSel.fabricId);
      setFabricImage(khuyootSel.imageUrl);
      setFabricSettings(khuyootSel.settings);
    } else if (source === 'shops' && shopsSel) {
      setSelectedFabricId(shopsSel.fabricId);
      setFabricImage(shopsSel.imageUrl);
      setFabricSettings(shopsSel.settings);
    } else if (source === 'upload' && uploadSel) {
      setSelectedFabricId(`custom-${Date.now()}`);
      setFabricImage(uploadSel.imageUrl);
      setFabricSettings(uploadSel.settings);
    } else {
      setSelectedFabricId(null);
      setFabricImage(null);
    }
    if (source === 'upload' && !uploadSel) {
      fabricUploadInputRef.current?.click();
    }
  };
  const handleKhuyootFabricSelect = (fabric: typeof KHUYOOT_FABRICS[0]) => { setSelectedFabricId(fabric.id); setFabricImage(fabric.imageUrl); setKhuyootSel({ fabricId: fabric.id, name: fabric.name, imageUrl: fabric.imageUrl, settings: fabricSettings }); setFabricModalOpen(false); setCurrentStep(Math.max(currentStep, 2)); };
  const clearFabricSelection = () => {
    if (fabricSource === 'khuyoot') setKhuyootSel(null);
    if (fabricSource === 'shops') setShopsSel(null);
    if (fabricSource === 'upload') setUploadSel(null);
    setFabricImage(null);
    setSelectedFabricId(null);
    setShowFabricScale(false);
    setFabricSettingsDraft(null);
    setFabricMeters(3);
  };
  const handleFabricMetersChange = (meters: number) => {
    if (!Number.isFinite(meters) || meters <= 0) {
      setFabricMeters(1);
      return;
    }
    setFabricMeters(Math.min(50, meters));
  };
  const openFabricPicker = () => {
    if (tryFabricPanelRef.current) {
      tryFabricPanelRef.current.openFabricPicker();
    } else {
      setPendingTryOnFabricPickerOpen(true);
    }
    tryFabricSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openTryOnTemplatePicker = () => {
    if (tryFabricPanelRef.current) {
      tryFabricPanelRef.current.openTemplatePicker();
    } else {
      setPendingTryOnTemplatePickerOpen(true);
    }
    tryFabricSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  React.useEffect(() => {
    if (!pendingTryOnFabricPickerOpen) return;

    let tries = 0;
    const id = window.setInterval(() => {
      const panel = tryFabricPanelRef.current;
      if (panel) {
        panel.openFabricPicker();
        setPendingTryOnFabricPickerOpen(false);
        window.clearInterval(id);
        return;
      }
      tries += 1;
      if (tries >= 30) {
        setPendingTryOnFabricPickerOpen(false);
        window.clearInterval(id);
      }
    }, 50);

    return () => window.clearInterval(id);
  }, [pendingTryOnFabricPickerOpen]);

  React.useEffect(() => {
    if (!pendingTryOnTemplatePickerOpen) return;

    let tries = 0;
    const id = window.setInterval(() => {
      const panel = tryFabricPanelRef.current;
      if (panel) {
        panel.openTemplatePicker();
        setPendingTryOnTemplatePickerOpen(false);
        window.clearInterval(id);
        return;
      }
      tries += 1;
      if (tries >= 30) {
        setPendingTryOnTemplatePickerOpen(false);
        window.clearInterval(id);
      }
    }, 50);

    return () => window.clearInterval(id);
  }, [pendingTryOnTemplatePickerOpen]);

  const openFabricScale = React.useCallback(() => {
    if (fabricImage) {
      setFabricSettingsDraft({ ...fabricSettings });
    } else {
      setFabricSettingsDraft(null);
    }
    setShowFabricScale(true);
  }, [fabricImage, fabricSettings]);

  const closeFabricScale = React.useCallback(() => {
    setShowFabricScale(false);
    setFabricSettingsDraft(null);
  }, []);

  const handleFabricScaleApply = React.useCallback((payload: FabricScaleApplyPayload) => {
    const { settings: next, previewDataUrl } = payload;
    setFabricSettings(next);

    const cacheKey = selectedFabricId;
    const cachedPreview = cacheKey ? fabricPreviewCache[cacheKey]?.previewDataUrl ?? null : null;
    const resolvedPreview = previewDataUrl ?? cachedPreview;

    if (resolvedPreview) {
      setFabricImage(resolvedPreview);
    }

    if (cacheKey) {
      setFabricPreviewCache((prev) => ({
        ...prev,
        [cacheKey]: {
          settings: next,
          previewDataUrl: resolvedPreview ?? null,
          updatedAt: Date.now(),
        },
      }));
    }

    if (fabricSource === 'khuyoot') {
      setKhuyootSel((prev) => (prev ? { ...prev, settings: next, ...(resolvedPreview ? { imageUrl: resolvedPreview } : {}) } : prev));
    } else if (fabricSource === 'shops') {
      setShopsSel((prev) => (prev ? { ...prev, settings: next, ...(resolvedPreview ? { imageUrl: resolvedPreview } : {}) } : prev));
    } else if (fabricSource === 'upload') {
      setUploadSel((prev) => (prev ? { ...prev, settings: next, ...(resolvedPreview ? { imageUrl: resolvedPreview } : {}) } : prev));
    }

    closeFabricScale();
  }, [closeFabricScale, fabricPreviewCache, fabricSource, selectedFabricId, setFabricImage, setFabricPreviewCache, setKhuyootSel, setShopsSel, setUploadSel]);

  const handleFabricScaleCancel = React.useCallback(() => {
    closeFabricScale();
  }, [closeFabricScale]);

  const handleTryOnFabricSubmit = React.useCallback(
    ({ fabricImageUrl }: { fabricImageUrl: string; fabricPreviewUrl?: string | null }) => {
      // Empty - no action taken
    },
    []
  );

  const handleTryOnTemplateSubmit = React.useCallback(
    async ({ templateId, templateImageUrl, originalImageUrl }: { templateId: string; templateImageUrl: string; originalImageUrl?: string }) => {
      if (!templateId) return;
      setSelectedTemplate(templateId);
      if (templateImageUrl) {
        setTemplateImageOverrides(prev => ({ ...prev, [templateId]: templateImageUrl }));
        
        // Download and cache the large/full-size version for comparison before panel
        // Use originalImageUrl (full URL) to get the large version, not the thumbnail
        const sourceUrl = originalImageUrl || templateImageUrl;
        if (!templateFullSizeCache[templateId]) {
          const largeUrl = getOptimizedImageUrl(sourceUrl, 'large');
          if (largeUrl) {
            try {
              console.log('[DesignerV2] Downloading large template image:', { sourceUrl, largeUrl });
              // Preload the large image to cache it
              await preloadImage(largeUrl);
              // Store in cache
              setTemplateFullSizeCache(prev => ({ ...prev, [templateId]: largeUrl }));
              // Set as comparison before image
              setGenerationsBeforeUrl(largeUrl);
              console.log('[DesignerV2] Large template image cached and set as before image');
            } catch (error) {
              console.error('[DesignerV2] Failed to preload large template image:', error);
              // Fallback to source URL if large fails
              setGenerationsBeforeUrl(sourceUrl);
            }
          } else {
            setGenerationsBeforeUrl(sourceUrl);
          }
        } else {
          // Use cached version
          console.log('[DesignerV2] Using cached large template image');
          setGenerationsBeforeUrl(templateFullSizeCache[templateId]);
        }
      }
      setTemplateSectionCollapsed(false);
      setCurrentStep(prev => Math.max(prev, 1));
    },
    [templateFullSizeCache]
  );

  const totalPrice = Object.values(selections).filter((o): o is DesignOption => o !== null).reduce((sum, opt) => sum + (opt.price || 0), 0);
  const selectedCount = Object.values(selections).filter(Boolean).length;

  // **HIBERNATION: If Designer is not active (e.g., Keep-Alive with display:none), return null to stop all rendering**
  if (!isActive) {
    return null;
  }

  return (
    // NOTE: Keep the parent page as the ONLY scroll container.
    // Avoid `h-screen` / `overflow-auto` wrappers here to prevent double-scroll + scroll chaining.
    <div className="mobile-app-frame">

      {/* BREAKPOINT DEBUG INDICATOR */}
      <div className="fixed top-2 right-2 z-[9999] pointer-events-none">
        <div className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border-2 border-white">
          <span className="sm:hidden">📱 XS (&lt;640px)</span>
          <span className="hidden sm:inline md:hidden">📱 SM (≥640px)</span>
          <span className="hidden md:inline lg:hidden">📱 MD (≥768px)</span>
          <span className="hidden lg:inline xl:hidden">💻 LG (≥1024px)</span>
          <span className="hidden xl:inline 2xl:hidden">💻 XL (≥1280px)</span>
          <span className="hidden 2xl:inline">🖥️ 2XL (≥1536px)</span>
        </div>
      </div>

      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-50 font-sans">

        {/* --- MAIN LAYOUT --- */}
        <main className="flex flex-1 flex-col md:flex-row min-h-0 bg-[#F5F5F7] dark:bg-[#050505] pb-safe">
        <CanvasPanel anchorId="designer-canvas" showAdminLabels={showAdminLabels} tryFabricSectionRef={tryFabricSectionRef}>

          <TryOnSection
            tryFabricPanelRef={tryFabricPanelRef}
            tryFabricSectionRef={tryFabricSectionRef}
            showAdminLabels={showAdminLabels}
            selectedTemplate={selectedTemplate}
            templatePreviewUrl={templatePreviewUrl}
            templateDimensions={templateDimensions}
            templateFullSizeCache={templateFullSizeCache}
            fabricImage={fabricImage}
            selectedFabricId={selectedFabricId}
            generationsBeforeUrl={generationsBeforeUrl}
            generationsAfterUrl={generationsAfterUrl}
            showToast={showToast}
            onResultHelp={() => setStartModalOpen(true)}
            onResultToggleAdminAnchors={isAdminUser ? toggleAdminAnchors : undefined}
            onTemplateSubmit={handleTryOnTemplateSubmit}
            onFabricSubmit={handleTryOnFabricSubmit}
            onOpenTiling={openFabricScale}
            onOpenNeck={() => handleCategoryClick('neck')}
            onOpenSleeve={() => handleCategoryClick('sleeve')}
            features={features}
            onReloadGenerations={reloadGenerations}
            onGenerated={async ({ jobId, resultImageUrl, resultThumbnailUrl }) => {
              console.log('[DesignerV2] onGenerated:', { jobId, resultImageUrl: resultImageUrl?.substring(0, 50), resultThumbnailUrl: resultThumbnailUrl?.substring(0, 50) });
              
              if (resultThumbnailUrl) {
                console.log('[DesignerV2] Using API-provided thumbnail');
                setTryOnThumbnailsByJobId((prev) => ({ ...prev, [jobId]: resultThumbnailUrl }));
              } else if (resultImageUrl?.startsWith('data:')) {
                console.log('[DesignerV2] Generating client-side thumbnail from data URL');
                try {
                  const thumb = await generateThumbnailFromDataUrl(resultImageUrl, 240, 320);
                  if (thumb) {
                    console.log('[DesignerV2] Client thumbnail generated:', thumb.substring(0, 50));
                    setTryOnThumbnailsByJobId((prev) => ({ ...prev, [jobId]: thumb }));
                  }
                } catch (e) {
                  console.warn('[DesignerV2] Failed to generate client thumbnail:', e);
                }
              }
              
              setLastTryOnJobId(jobId);
              setLastTryOnResultUrl(resultImageUrl);
              
              // Auto-update the after image to show the latest result
              setGenerationsAfterUrl(resultImageUrl);
              
              const thumbToUse = resultThumbnailUrl || resultImageUrl;
              upsertGeneration(jobId, resultImageUrl, thumbToUse, { fabricId: selectedFabricId || null });
            }}
            initialOptions={{
              neckStyle:
                selections.neck?.id === 'neck-round'
                  ? 'round'
                  : selections.neck?.id === 'neck-v'
                    ? 'v'
                    : selections.neck?.id === 'neck-collar'
                      ? 'collar'
                      : 'keep',
              sleeveStyle:
                selections.sleeve?.id === 'sleeve-long'
                  ? 'long'
                  : selections.sleeve?.id === 'sleeve-short'
                    ? 'short'
                    : selections.sleeve?.id === 'sleeve-none'
                      ? 'none'
                      : 'keep',
              embroideryStyle:
                selections.embroidery?.id === 'emb-chest'
                  ? 'chest'
                  : selections.embroidery?.id === 'emb-collar'
                    ? 'collar'
                    : selections.embroidery?.id === 'emb-full'
                      ? 'full'
                      : 'keep',
              fabricScale: (fabricSettings?.patternScale as any) ?? 1,
              colorPreservation: 'high',
            }}
            onApplyResult={({ jobId, resultImageUrl }) => {
              const thumbToUse = tryOnThumbnailsByJobId[jobId] || resultImageUrl;
              console.log('[DesignerV2] onApplyResult:', { jobId, hasThumb: !!tryOnThumbnailsByJobId[jobId], thumbUrl: thumbToUse?.substring(0, 50) });
              
              setGeneratedImage(resultImageUrl);
              setLastTryOnJobId(jobId);
              setLastTryOnResultUrl(resultImageUrl);
              upsertGeneration(jobId, resultImageUrl, thumbToUse, { fabricId: selectedFabricId || null });
              setCurrentStep(3);
              showToast('✅ تم توليد الصورة وإضافتها للتصميم', 'success');
            }}
            generations={generations}
            onModalGenerationOpen={handleOpenImage}
            onModalGenerationSetBefore={handleSetGenerationBefore}
            onModalGenerationSetAfter={handleSetGenerationAfter}
            onRefreshAfterImage={handleRefreshAfterImage}
            onSaveAfterImage={handleSaveAfterImage}
            lastTryOnJobId={lastTryOnJobId}
          />
          
        </CanvasPanel>
        </main>

      {/* --- TOAST --- */}
      {toast.open && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl border font-bold text-sm flex items-center gap-2 animate-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white text-slate-900 border-slate-200'}`}>
           {toast.type === 'success' && <Check size={16} />}
           {toast.message}
        </div>
      )}

      {/* --- MODALS --- */}
      <ModalsSection
        startModalOpen={startModalOpen}
        onCloseStartModal={() => setStartModalOpen(false)}
        appSettings={appSettings}
        startMode={startMode}
        onSetStartMode={setStartMode}
        myDesigns={myDesigns}
        onStartNewDesign={startNewDesign}
        onOpenExistingDesign={openExistingDesign}
        formatRelativeTime={formatRelativeTime}
        dontShowStart={dontShowStart}
        onToggleDontShowStart={toggleDontShowStart}
        onPersistDontShowStart={persistDontShowStart}
        modalOpen={modalOpen}
        onCloseModal={() => setModalOpen(false)}
        onConfirmSelection={confirmSelection}
        activeCategory={activeCategory}
        designOptions={MOCK_DESIGN_OPTIONS}
        pendingSelection={pendingSelection}
        onOptionSelect={handleOptionSelect}
        onOpenLibraryForOption={openLibraryForOption}
        fabricModalOpen={fabricModalOpen}
        onCloseFabricModal={() => setFabricModalOpen(false)}
        khuyootFabrics={KHUYOOT_FABRICS}
        onKhuyootFabricSelect={handleKhuyootFabricSelect}
        shopsModalOpen={shopsModalOpen}
        onCloseShopsModal={() => setShopsModalOpen(false)}
        shopsFabrics={SHOPS_FABRICS}
        onShopsFabricSelect={(f) => {
          setSelectedFabricId(f.fabricId);
          setFabricImage(f.imageUrl);
          setShopsSel({ shopId: f.shopId, shopName: f.shopName, fabricId: f.fabricId, imageUrl: f.imageUrl, settings: fabricSettings });
          setShopsModalOpen(false);
          setCurrentStep(Math.max(currentStep, 2));
        }}
        showFabricScale={showFabricScale}
        onCloseFabricScale={closeFabricScale}
        fabricImage={fabricImage}
        fabricSettings={fabricSettings}
        fabricSettingsDraft={fabricSettingsDraft}
        onFabricSettingsChange={(next) => setFabricSettingsDraft(next)}
        onFabricScaleApply={handleFabricScaleApply}
        onFabricScaleCancel={handleFabricScaleCancel}
        imagePickerOpen={imagePickerOpen}
        onCloseImagePicker={() => setImagePickerOpen({ open: false })}
        onImageSelect={(imageUrl) => {
          if (pendingSelection) {
            setPendingSelection({ ...pendingSelection, thumbnailUrl: imageUrl });
          } else if (activeCategory) {
            const id = `${activeCategory}-lib-${Date.now()}`;
            setPendingSelection({ id, category: activeCategory, name: 'اختيار من المكتبة', thumbnailUrl: imageUrl, price: 0 });
          }
        }}
        showTemplateImageLibrary={showTemplateImageLibrary}
        onCloseTemplateImageLibrary={() => setShowTemplateImageLibrary(false)}
        womenRootId={womenRootId}
        onTemplateImageSelect={(url) => setTemplateImageOverrides(prev => ({ ...prev, [selectedTemplate]: url }))}
        selectedTemplate={selectedTemplate}
        showMyDesigns={showMyDesigns}
        onCloseMyDesigns={() => setShowMyDesigns(false)}
        onLoadDesign={handleLoadDesign}
      />

      </div>
    </div>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders during navigation
export const DesignerV2Memoized = React.memo(DesignerV2);
// Export as default for backwards compatibility
export default DesignerV2Memoized;
