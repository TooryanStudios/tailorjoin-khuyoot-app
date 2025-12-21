
// Designer V2


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Upload, Wand2, Check, Share2, ZoomIn, Shirt, Layers, User, ShoppingCart, ChevronLeft, ChevronRight, X, RotateCcw, Save, Heart, Palette, Store, Search, Image as ImageIcon, Link as LinkIcon, Pencil, ChevronDown, HelpCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { FabricScaleControl } from '../components/FabricScaleControl';
import { FabricPatternSettings, DesignOption, MeasurementTemplate } from '../types';
import { trackDesignEvent } from '../services/recommendationService';
import { designService, PersistedDesign } from '../services/designService';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/Modal';
import { ImageLibraryPicker } from '../components/ImageLibraryPicker';
import { getImageCategories } from '../services/imageLibraryService';
import { firebaseService } from '../services/firebase';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import { TryFabricPanel } from '../src/designer/components/TryFabricPanel';

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
  createdAt: number;
  updatedAt: number;
}

type FabricSource = 'khuyoot' | 'shops' | 'upload' | null;

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

export const DesignerV2 = () => {
  // ... (KEEP ALL STATE AND LOGIC EXACTLY THE SAME - NO CHANGES HERE)
  const { user, appSettings } = useApp();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeId } = useParams();
  const [selectedTemplate, setSelectedTemplate] = useState('dishdasha');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [fabricSource, setFabricSource] = useState<FabricSource>('khuyoot');
  const [selectedFabricId, setSelectedFabricId] = useState<string | null>(null);
  const [fabricImage, setFabricImage] = useState<string | null>(null);
  const [showFabricScale, setShowFabricScale] = useState(false);
  const [fabricSettings, setFabricSettings] = useState<FabricPatternSettings>({
    patternScale: 1.0,
    patternOffsetX: 0,
    patternOffsetY: 0,
    patternRotation: 0,
    patternRepeatMode: 'repeat'
  });
  // Live preview blend options (kept local to avoid type changes)
  const [previewBlendMode, setPreviewBlendMode] = useState<'normal' | 'multiply' | 'overlay'>('multiply');
  const [previewOverlayOpacity, setPreviewOverlayOpacity] = useState<number>(0.35);
  const [previewOverlayTheme, setPreviewOverlayTheme] = useState<'light' | 'dark'>('light');
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

    // Auto-open or suppress the start modal based on stored preference and user profile
    // Do NOT auto-close when toggling the button in the modal; persist on confirm instead.
    useEffect(() => {
      const stored = localStorage.getItem('hide_designer_intro') === '1';
      const profilePref = !!user && (user as any).hideDesignerIntro === true;
      const shouldHide = stored || profilePref;
      setStartModalOpen(!shouldHide);
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
  const [templateImageOverrides, setTemplateImageOverrides] = useState<Record<string, string>>({});
  const [imageCategories, setImageCategories] = useState<any[]>([]);
  const [womenRootId, setWomenRootId] = useState<string | null>(null);
  const [womenLevel1, setWomenLevel1] = useState<any[]>([]);
  const [showMyDesigns, setShowMyDesigns] = useState<boolean>(false);
  const [lastTryOnJobId, setLastTryOnJobId] = useState<string | null>(null);
  const [lastTryOnResultUrl, setLastTryOnResultUrl] = useState<string | null>(null);
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

  const buildShareText = () => {
    const tplName = TEMPLATES.find(t => t.id === selectedTemplate)?.name || 'تصميم';
    const opts = Object.values(selections).filter((o): o is DesignOption => !!o).map(o => o.name).join('، ');
    let fabricDesc = 'قماش: غير محدد';
    if (fabricSource === 'khuyoot' && khuyootSel?.name) fabricDesc = `قماش: ${khuyootSel.name}`;
    else if (fabricSource === 'shops' && shopsSel) fabricDesc = `قماش: ${SHOPS_FABRICS.find(s => s.fabricId === shopsSel.fabricId)?.name || 'من المتاجر'}`;
    else if (fabricSource === 'upload') fabricDesc = 'قماش: صورة مرفوعة';
    return `${tplName}؛ التفاصيل: ${opts || 'بدون'}؛ ${fabricDesc}`;
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

  // ... (Keep existing useEffects for loading/saving logic)
  useEffect(() => {
    setStartModalOpen(!routeId);
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
    const loadImageCats = async () => {
      try {
        const cats = await getImageCategories();
        setImageCategories(cats);
        const womenRoot = cats.find((c: any) => (c.level === 0 || !c.parentId) && ((c.nameAr || c.name || '').includes('الأزياء')));
        setWomenRootId(womenRoot?.id || null);
        const level1 = womenRoot ? cats.filter((c: any) => c.parentId === womenRoot.id && (c.hasChildren || c.level === 1)) : [];
        setWomenLevel1(level1);
      } catch (e) {}
    };
    loadImageCats();
    const savedDraft = localStorage.getItem(DESIGN_DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft: DesignDraft = JSON.parse(savedDraft);
        setSelectedTemplate(draft.selectedTemplate);
        setFabricSource(draft.fabricSource ?? 'khuyoot');
        setSelectedFabricId(draft.fabricId);
        setFabricImage(draft.fabricImage);
        setFabricSettings(draft.fabricSettings);
        setKhuyootSel(draft.khuyoot || null);
        setShopsSel(draft.shops || null);
        setUploadSel(draft.upload || null);
        setSelections(draft.selections);
        setGeneratedImage(draft.generatedImage);
        setCurrentDesignId(draft.id);
        if (draft.generatedImage) setCurrentStep(3);
        else if (Object.values(draft.selections).some(Boolean) || draft.fabricImage) setCurrentStep(2);
      } catch (e) {}
    }
  }, [isOnline]);

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
  }, [routeId, user, location.search]);

  useEffect(() => {
    const loadDesigns = async () => {
      if (!user) return;
      const list = await designService.listDesigns(user.id);
      setMyDesigns(list.sort((a, b) => b.updatedAt - a.updatedAt));
    };
    loadDesigns();
  }, [user]);

  useEffect(() => {
    const draft: DesignDraft = {
      id: currentDesignId || `draft-${Date.now()}`,
      selectedTemplate,
      fabricSource,
      khuyoot: khuyootSel || null,
      shops: shopsSel || null,
      upload: uploadSel || null,
      fabricId: selectedFabricId,
      fabricImage,
      fabricSettings,
      selections,
      generatedImage,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    localStorage.setItem(DESIGN_DRAFT_KEY, JSON.stringify(draft));
  }, [selectedTemplate, fabricSource, selectedFabricId, fabricImage, fabricSettings, selections, generatedImage, currentDesignId, khuyootSel, shopsSel, uploadSel]);

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
        setShowFabricScale(true);
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
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedImage('https://picsum.photos/500/700?random=template');
      setIsGenerating(false);
      setCurrentStep(3);
      if (user) {
        const designId = `design-${Date.now()}`;
        setCurrentDesignId(designId);
        trackDesignEvent(user.id, 'design_created', designId, selectedFabricId || undefined, Object.values(selections).filter((o): o is DesignOption => o !== null).map(o => o.id));
      }
    }, 2500);
  };

  const handleSaveDesign = async () => {
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
  };

  const handleAddToCart = async () => {
    if (!user || !currentDesignId) { showToast('يرجى تسجيل الدخول أولاً', 'error'); return; }
    await trackDesignEvent(user.id, 'added_to_cart', currentDesignId, selectedFabricId || undefined, Object.values(selections).filter((o): o is DesignOption => o !== null).map(o => o.id));
    showToast('🛒 تمت الإضافة إلى السلة!', 'success');
  };

  const handleReset = () => { setGeneratedImage(null); setSelections({}); setFabricImage(null); setSelectedFabricId(null); setFabricSource(null); setCurrentStep(1); setShowFabricScale(false); localStorage.removeItem(DESIGN_DRAFT_KEY); };
  const startNewDesign = () => { handleReset(); ensureDesignId(); setStartModalOpen(false); };
  const openExistingDesign = (d: PersistedDesign) => { navigate(`/designer/${d.id}`); handleLoadDesign(d); setStartModalOpen(false); };
  const handleLoadDesign = async (d: PersistedDesign) => { setCurrentDesignId(d.id); setSelectedTemplate(d.selectedTemplate); setFabricSource(d.fabricSource); setKhuyootSel(d.khuyoot || null); setShopsSel(d.shops || null); setUploadSel(d.upload || null); setSelectedFabricId(d.fabricId); setFabricImage(d.fabricImage); setFabricSettings(d.fabricSettings as FabricPatternSettings); const mapped: Record<string, DesignOption | null> = {}; Object.entries(d.selections || {}).forEach(([k, v]) => { mapped[k] = v ? { id: v.id, name: v.name, category: k as DesignOption['category'], thumbnailUrl: v.thumbnailUrl, price: v.price } : null; }); setSelections(mapped); setGeneratedImage(d.generatedImage); setCurrentStep(d.generatedImage ? 3 : (d.fabricImage || Object.values(mapped).some(Boolean)) ? 2 : 1); };

  const handleFabricSourceSelect = (source: FabricSource) => { setFabricSource(source); if (source === 'khuyoot' && khuyootSel) { setSelectedFabricId(khuyootSel.fabricId); setFabricImage(khuyootSel.imageUrl); setFabricSettings(khuyootSel.settings); } else if (source === 'shops' && shopsSel) { setSelectedFabricId(shopsSel.fabricId); setFabricImage(shopsSel.imageUrl); setFabricSettings(shopsSel.settings); } else if (source === 'upload' && uploadSel) { setSelectedFabricId(`custom-${Date.now()}`); setFabricImage(uploadSel.imageUrl); setFabricSettings(uploadSel.settings); } else { setSelectedFabricId(null); setFabricImage(null); } };
  const handleKhuyootFabricSelect = (fabric: typeof KHUYOOT_FABRICS[0]) => { setSelectedFabricId(fabric.id); setFabricImage(fabric.imageUrl); setKhuyootSel({ fabricId: fabric.id, name: fabric.name, imageUrl: fabric.imageUrl, settings: fabricSettings }); setFabricModalOpen(false); setCurrentStep(Math.max(currentStep, 2)); };
  const clearFabricSelection = () => { if (fabricSource === 'khuyoot') setKhuyootSel(null); if (fabricSource === 'shops') setShopsSel(null); if (fabricSource === 'upload') setUploadSel(null); setFabricImage(null); setSelectedFabricId(null); setShowFabricScale(false); };

  const totalPrice = Object.values(selections).filter((o): o is DesignOption => o !== null).reduce((sum, opt) => sum + (opt.price || 0), 0);
  const selectedCount = Object.values(selections).filter(Boolean).length;
  const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    // NOTE: Keep the parent page as the ONLY scroll container.
    // Avoid `h-screen` / `overflow-auto` wrappers here to prevent double-scroll + scroll chaining.
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-50 font-sans">
      
      {/* --- HEADER --- */}
      <header className="h-16 flex-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">استوديو خيوط</h1>
            <p className="text-[10px] text-slate-500">Professional Designer</p>
          </div>
        </div>

        <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
           {[1, 2, 3].map(step => (
             <div key={step} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${currentStep >= step ? 'bg-white dark:bg-slate-700 shadow text-violet-600' : 'text-slate-400'}`}>
               {step === 1 ? 'الموديل' : step === 2 ? 'القماش' : 'التفاصيل'}
             </div>
           ))}
        </div>

        <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" onClick={handleReset} className="hidden sm:flex text-slate-500 hover:text-red-500">
             <RotateCcw size={16} />
           </Button>
           <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"/>
           <Button variant="ghost" size="sm" onClick={() => setStartModalOpen(true)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300" title="مساعدة">
             <HelpCircle size={18} />
           </Button>
           <Button variant="ghost" size="sm" onClick={() => setShowMyDesigns(true)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">
             <Layers size={18} />
           </Button>

           <Button
             variant="ghost"
             size="sm"
             onClick={() => tryFabricSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
             className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
             title="Try Fabric"
           >
             <Wand2 size={18} />
             <span className="hidden md:inline text-xs font-bold">Try Fabric</span>
           </Button>

           <Button onClick={handleSaveDesign} className="rounded-full px-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 transition-transform">
             <span className="text-xs font-bold">حفظ</span>
           </Button>
        </div>
      </header>

      {/* --- MAIN CONTROLS --- */}
      <div className="w-full h-auto overflow-visible bg-[#F5F5F7] dark:bg-[#050505] z-10 pb-6 relative">
        <div className="absolute top-0 right-0 text-[9px] bg-green-500 text-white px-1 py-0.5 z-[9999]">LEFT-CONTROLS</div>
          
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-violet-200/40 to-fuchsia-100/40 dark:from-violet-900/10 dark:to-fuchsia-900/10 rounded-full blur-[120px]" />
            <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: 'radial-gradient(#a1a1aa 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          </div>
          
          <div className="p-6 space-y-8 relative z-10">
            
            {/* ROW: TEMPLATE + FABRIC (responsive) */}
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
              {/* SECTION 1: TEMPLATE */}
              <section className="relative flex-1">
                <div className="absolute top-0 left-0 text-[9px] bg-purple-500 text-white px-1 py-0.5 z-[9999]">SEC-1-TEMPLATE</div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs flex items-center justify-center">1</span>
                    الموديل الأساسي
                  </h2>
                  <button onClick={() => setShowTemplateImageLibrary(true)} className="text-xs font-bold text-violet-600 hover:underline">تغيير</button>
                </div>
                
                <div 
                  onClick={() => setShowTemplateImageLibrary(true)}
                  className="group relative w-full aspect-[3/4] rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer border-2 border-slate-300 dark:border-slate-600 hover:border-violet-500 transition-all"
                >
                   <div className="absolute top-0 left-0 text-[9px] bg-violet-500 text-white px-1 py-0.5 z-[9999]">MODEL-CARD</div>
                   {(() => {
                      const rep = measurementTemplates.find(t => t.productType === selectedTemplate);
                      const overrideImg = templateImageOverrides[selectedTemplate];
                      const img = overrideImg || rep?.categoryImageUrl || rep?.baseImageUrl;
                      if (img) return <img src={img} alt="Model" className="w-full h-full object-contain" />;
                      return (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                               <Shirt size={48} className="mb-2 opacity-50" />
                               <span className="text-xs font-bold">اضغط للاختيار</span>
                          </div>
                      );
                   })()}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold border border-white/30">
                       تصفح المكتبة
                     </div>
                   </div>
                </div>
              </section>

              {/* SECTION 2: FABRIC */}
              <section className="relative flex-1">
                <div className="absolute top-0 left-0 text-[9px] bg-purple-500 text-white px-1 py-0.5 z-[9999]">SEC-2-FABRIC</div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs flex items-center justify-center">2</span>
                    القماش
                  </h2>
                  {fabricImage && <button onClick={clearFabricSelection} className="text-xs text-red-500">حذف</button>}
                </div>

                {/* Fabric Source Pills */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide relative">
                  <div className="absolute top-0 left-0 text-[9px] bg-blue-500 text-white px-1 py-0.5 z-[9999]">FABRIC-SOURCE-PILLS</div>
                  {(['khuyoot', 'shops', 'upload'] as const).map(src => (
                    <button
                      key={src}
                      onClick={() => handleFabricSourceSelect(src)}
                      className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${fabricSource === src ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'}`}
                    >
                      {src === 'khuyoot' ? 'متجر خيوط' : src === 'shops' ? 'من المتاجر' : 'رفع صورة'}
                    </button>
                  ))}
                </div>

                {/* Selected Fabric Preview (Styled like model card) */}
                <div className="space-y-3 relative">
                  <div className="absolute top-0 left-0 text-[9px] bg-emerald-500 text-white px-1 py-0.5 z-[9999]">FABRIC-CARD</div>
                  <div 
                    className="group relative w-full aspect-[3/4] rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 transition-all"
                    onClick={() => {
                      if (fabricSource === 'khuyoot') setFabricModalOpen(true);
                      else if (fabricSource === 'shops') setShopsModalOpen(true);
                    }}
                  >
                    {fabricImage ? (
                      <img src={fabricImage} alt="Fabric" className="w-full h-full object-contain" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                      <Palette size={48} className="mb-2 opacity-50" />
                      <span className="text-xs font-bold">اضغط للاختيار</span>
                    </div>
                  )}
                  {fabricSource === 'upload' && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFabricUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold border border-white/30">
                      {fabricImage ? 'تغيير القماش' : (fabricSource === 'upload' ? 'رفع صورة' : 'تصفح الأقمشة')}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {fabricImage ? (khuyootSel?.name || shopsSel?.name || uploadSel?.fileName || 'قماش مختار') : 'لم يتم اختيار قماش'}
                </div>
                {showFabricScale && fabricImage && (
                  <div className="mt-1">
                    <FabricScaleControl imageUrl={fabricImage} settings={fabricSettings} onSettingsChange={setFabricSettings} onPreview={() => {}} />
                  </div>
                )}
                {fabricImage && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-300">وضع المزج:</span>
                      {(['normal','multiply','overlay'] as const).map(m => (
                        <button
                          key={m}
                          onClick={() => setPreviewBlendMode(m)}
                          className={`px-3 py-1 rounded-full text-[11px] border ${previewBlendMode===m ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'}`}
                        >
                          {m==='normal' ? 'عادي' : m==='multiply' ? 'دمج' : 'تراكب'}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-600 dark:text-slate-300">شفافية التراكب:</span>
                      <input
                        type="range"
                        min={0}
                        max={0.8}
                        step={0.05}
                        value={previewOverlayOpacity}
                        onChange={(e) => setPreviewOverlayOpacity(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-[10px] text-slate-500">{Math.round(previewOverlayOpacity*100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-300">لون التراكب:</span>
                      {(['light','dark'] as const).map(theme => (
                        <button
                          key={theme}
                          onClick={() => setPreviewOverlayTheme(theme)}
                          className={`px-3 py-1 rounded-full text-[11px] border ${previewOverlayTheme===theme ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'}`}
                        >
                          {theme==='light' ? 'فاتح' : 'داكن'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* SECTION 3: DETAILS */}
            <section className="relative">
               <div className="absolute top-0 left-0 text-[9px] bg-purple-500 text-white px-1 py-0.5 z-[9999]">SEC-3-DETAILS</div>
               <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs flex items-center justify-center">3</span>
                  التفاصيل والإضافات
               </h2>
               
               <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  {DESIGN_CATEGORIES.map(cat => {
                    const isSelected = !!selections[cat.id];
                    const selected = selections[cat.id];
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.id)}
                        className={`w-full flex flex-col items-center p-3 sm:p-4 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md ${isSelected ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg shadow-lg shadow-slate-900/10' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 hover:border-slate-300'}`}
                      >
                        <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                          {isSelected && selected?.thumbnailUrl ? (
                            <img src={selected.thumbnailUrl!} alt={selected.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] sm:text-[11px] text-slate-500">اضغط للاختيار</div>
                          )}
                        </div>
                        <div className="mt-2 text-center">
                          <div className="text-xs sm:text-sm font-bold">{cat.name}</div>
                          <div className="text-[10px] sm:text-[11px] opacity-80">
                            {isSelected ? selected?.name : 'اضغط للاختيار'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {/* Reserved empty tile */}
                  <div className="w-full aspect-square p-3 sm:p-4 rounded-2xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 text-xs">
                    احتياطي
                  </div>
               </div>
            </section>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* TRY-ON (Always visible, inline) */}
            <section ref={tryFabricSectionRef} className="space-y-3 relative">
              <div className="absolute top-0 left-0 text-[9px] bg-orange-500 text-white px-1 py-0.5 z-[9999]">SEC-TRYON</div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs flex items-center justify-center">★</span>
                  تجربة القماش (Try‑On)
                </h2>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">يعمل داخل نفس الصفحة</div>
              </div>
              <TryFabricPanel
                initialTemplateId={selectedTemplate}
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
                  setGeneratedImage(resultImageUrl);
                  setLastTryOnJobId(jobId);
                  setLastTryOnResultUrl(resultImageUrl);
                  setCurrentStep(3);
                  showToast('✅ تم توليد الصورة وإضافتها للتصميم', 'success');
                }}
              />
              {lastTryOnJobId ? (
                <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                  آخر عملية Try-On: {lastTryOnJobId}
                </div>
              ) : null}
            </section>

             {/* Removed mobile spacer to avoid large gap */}
          </div>
        </div>

      {/* --- TOAST --- */}
      {toast.open && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl border font-bold text-sm flex items-center gap-2 animate-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white text-slate-900 border-slate-200'}`}>
           {toast.type === 'success' && <Check size={16} />}
           {toast.message}
        </div>
      )}

      {/* --- MODALS (Reusing existing structures but styled minimally) --- */}
      <Modal isOpen={startModalOpen} onClose={() => setStartModalOpen(false)} title="ابدأ التصميم" showFooter={true} maxWidth="max-w-2xl" onConfirm={async () => { await persistDontShowStart(); setStartModalOpen(false); }}>
         <div className="space-y-4">
            {/* Help video at the top */}
            {appSettings?.helpVideo?.enabled && appSettings?.helpVideo?.url && (
              <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black">
                {(() => {
                  const raw = appSettings.helpVideo.url;
                  let embedSrc = raw;
                  try {
                    const u = new URL(raw);
                    let id = '';
                    if (u.hostname.includes('youtu.be')) {
                      id = u.pathname.replace('/','');
                    } else if (u.hostname.includes('youtube.com')) {
                      id = u.searchParams.get('v') || '';
                    }
                    if (id) {
                      embedSrc = `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&controls=0&iv_load_policy=3`;
                    } else {
                      embedSrc = `${raw.replace('watch?v=', 'embed/')}?rel=0&modestbranding=1&controls=0&iv_load_policy=3`;
                    }
                  } catch {}
                  return (
                    <iframe
                      className="w-full h-full"
                      src={embedSrc}
                      title="كيفية التصميم"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  );
                })()}
              </div>
            )}
            {/* Video importance note */}
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              هذا الفيديو مهم لمعرفة طريقة التفصيل خطوة بخطوة.
            </div>

            {/* Two options in one row */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={startNewDesign} className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between transition-colors text-right">
                  <div className="text-right">
                    <div className="font-bold">تصميم جديد</div>
                    <div className="text-xs text-slate-500">ابدأ من الصفر</div>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-2xl">✨</div>
              </button>
              <button onClick={() => setStartMode('edit')} className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between transition-colors text-right">
                  <div className="text-right">
                    <div className="font-bold">مشاريعي</div>
                    <div className="text-xs text-slate-500">استكمل تصاميم سابقة</div>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-2xl">📂</div>
              </button>
            </div>

            {/* Designs list when edit mode */}
            {startMode === 'edit' && myDesigns.map(d => (
                <button key={d.id} onClick={() => openExistingDesign(d)} className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                    <img src={d.fabricImage || d.generatedImage || ''} className="w-10 h-10 rounded bg-slate-200 object-cover" />
                    <span className="text-sm font-bold flex-1 text-right">{d.selectedTemplate}</span>
                    <span className="text-[10px] text-slate-400">{formatRelativeTime(d.updatedAt)}</span>
                </button>
            ))}

            {/* Do not show again toggle button (persisted on confirm) */}
            <button
              type="button"
              onClick={() => toggleDontShowStart(!dontShowStart)}
              className={`mt-2 text-xs sm:text-sm px-3 py-2 rounded-xl border transition-all ${dontShowStart ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'}`}
            >
              {dontShowStart ? 'سيتم إخفاء هذه النافذة لاحقاً' : 'لا تعرض هذه النافذة مرة أخرى'}
            </button>
         </div>
      </Modal>

      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onConfirm={confirmSelection}
        title="اختر" 
        showFooter={true}
      >
         <div className="grid grid-cols-2 gap-3">
            {activeCategory && MOCK_DESIGN_OPTIONS.filter(o => o.category === activeCategory).map(op => (
                <div 
                  key={op.id} 
                  onClick={() => handleOptionSelect(op)} 
                  role="button"
                  tabIndex={0}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${pendingSelection?.id === op.id ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-400'}`}
                >
                    <img src={(pendingSelection?.id === op.id && pendingSelection?.thumbnailUrl) ? pendingSelection.thumbnailUrl : op.thumbnailUrl} className="w-full h-24 object-cover rounded-xl mb-2" />
                    <div className="font-bold text-sm">{op.name}</div>
                    {op.price > 0 && <div className="text-xs text-slate-500">+{op.price} ر.ع</div>}
                    {(op.id === 'emb-chest' || op.id === 'emb-collar' || op.id === 'emb-full' || op.id.startsWith('neck-') || op.id.startsWith('sleeve-')) && (
                      <div onClick={(e) => { e.stopPropagation(); openLibraryForOption(op.id); }} className="mt-2 w-full text-[11px] px-2 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 rounded">
                        اختر من مكتبة الصور
                      </div>
                    )}
                </div>
            ))}
         </div>
      </Modal>

      <Modal isOpen={fabricModalOpen} onClose={() => setFabricModalOpen(false)} title="أقمشة خيوط" showFooter={false}>
        <div className="grid grid-cols-2 gap-3">
             {KHUYOOT_FABRICS.map(f => (
                 <button key={f.id} onClick={() => handleKhuyootFabricSelect(f)} className="group relative aspect-square rounded-2xl overflow-hidden">
                     <img src={f.imageUrl} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="font-bold text-sm">{f.name}</div>
                        <div className="text-xs">{f.price} ر.ع</div>
                     </div>
                 </button>
             ))}
        </div>
      </Modal>

      {imagePickerOpen.open && (
        <ImageLibraryPicker
          onSelect={(imageUrl) => {
            if (pendingSelection) {
              setPendingSelection({ ...pendingSelection, thumbnailUrl: imageUrl });
            } else if (activeCategory) {
              const id = `${activeCategory}-lib-${Date.now()}`;
              setPendingSelection({ id, category: activeCategory, name: 'اختيار من المكتبة', thumbnailUrl: imageUrl, price: 0 });
            }
          }}
          onClose={() => setImagePickerOpen({ open: false })}
          preselectParentId={imagePickerOpen.preselectParentId}
          preselectChildId={imagePickerOpen.preselectChildId}
          rootParentId={imagePickerOpen.rootParentId}
          hideLevel0={false}
        />
      )}

      {/* KEEP OTHER MODALS (Shops, ImageLibrary, etc.) FUNCTIONAL */}
      <Modal isOpen={shopsModalOpen} onClose={() => setShopsModalOpen(false)} title="من المتاجر" showFooter={false}>
         <div className="grid grid-cols-2 gap-3">
             {SHOPS_FABRICS.map(f => (
                 <button key={f.fabricId} onClick={() => { setSelectedFabricId(f.fabricId); setFabricImage(f.imageUrl); setShopsSel({ shopId: f.shopId, shopName: f.shopName, fabricId: f.fabricId, imageUrl: f.imageUrl, settings: fabricSettings }); setShopsModalOpen(false); setCurrentStep(Math.max(currentStep, 2)); }} className="group relative aspect-square rounded-2xl overflow-hidden">
                     <img src={f.imageUrl} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="font-bold text-sm">{f.name}</div>
                        <div className="text-[10px]">{f.shopName}</div>
                     </div>
                 </button>
             ))}
         </div>
      </Modal>

      {showTemplateImageLibrary && <ImageLibraryPicker rootParentId={womenRootId || undefined} hideLevel0={true} onSelect={(url) => setTemplateImageOverrides(prev => ({ ...prev, [selectedTemplate]: url }))} onClose={() => setShowTemplateImageLibrary(false)} />}
      {showMyDesigns && <Modal isOpen={showMyDesigns} onClose={() => setShowMyDesigns(false)} title="مشاريعي">{myDesigns.map(d => <button key={d.id} onClick={() => { handleLoadDesign(d); setShowMyDesigns(false); }} className="block w-full text-right p-3 hover:bg-slate-50 border-b">{d.selectedTemplate}</button>)}</Modal>}

    </div>
  );
};