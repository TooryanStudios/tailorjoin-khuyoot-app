import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MeasurementStudioCanvas } from './components/MeasurementStudioCanvas';
import { firebaseService } from '../../services/firebase';
import { useApp } from '../../../context/AppContext';
import { getAllCategories } from '../../admin/products/services';

interface MeasurementTemplate {
  id: string;
  name: string;
  baseImageUrl?: string;
  productType?: string;
  description?: string;
  points?: any[];
  [key: string]: any;
}

// ✅ WRAPPED IN React.memo: Component has 811 lines and heavy computations
const ClientMeasurementsV2Component: React.FC = () => {
  const { appSettings } = useApp();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const location = useLocation();
  const navigate = useNavigate();
  const { productId: productIdParam } = useParams<{ productId?: string }>();
  const state = location.state as any;
  const effectiveProductId: string | undefined = (() => {
    const extractProductId = (value: unknown): string | undefined => {
      if (typeof value !== 'string') return undefined;
      // Support Designer 2.1 template IDs like: product-<productId>-<index>
      const m = /^product-(.+)-(\d+)$/.exec(value);
      if (m?.[1]) return m[1];
      return undefined;
    };

    return (
      productIdParam ||
      state?.productId ||
      state?.productID ||
      state?.templateProductId ||
      extractProductId(state?.templateId) ||
      extractProductId(state?.templateProductId) ||
      undefined
    );
  })();
  const [showDebug, setShowDebug] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [matchedTemplate, setMatchedTemplate] = useState<MeasurementTemplate | null>(null);
  const [manualTemplateId, setManualTemplateId] = useState<string>('');
  const [isStitching, setIsStitching] = useState(false);
  const [activePointId, setActivePointId] = useState<string | null>(null);
  const [pointInputValue, setPointInputValue] = useState<string>('');
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [lineThickness, setLineThickness] = useState(0.7);
  const [pointScale, setPointScale] = useState(0.8);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savedTemplates, setSavedTemplates] = useState<Record<string, { name: string; measurements: Record<string, string>; unit: string }>>({});
  const [dismissedPreviewHint, setDismissedPreviewHint] = useState(false);
  const DEFAULT_HELP_VIDEO_URL = 'https://www.youtube.com/watch?v=6eZtn5Du8O4';

  // Load saved templates from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('measurement_templates');
      if (saved) {
        setSavedTemplates(JSON.parse(saved));
      }
    } catch (error) {
      // silently ignore
    }
  }, []);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert(t('common.templateName') || 'Please enter a template name');
      return;
    }

    if (!isMeasurementsComplete) {
      alert(t('measurements.fillAllMeasurements') || 'Please fill all measurements with valid numbers before saving');
      return;
    }
    
    // Check if name already exists and add numbering
    let finalName = templateName.trim();
    const existingNames = Object.values(savedTemplates).map(t => t.name);
    
    if (existingNames.includes(finalName)) {
      let counter = 2;
      while (existingNames.includes(`${finalName} ${counter}`)) {
        counter++;
      }
      finalName = `${finalName} ${counter}`;
    }
    
    const newTemplates = {
      ...savedTemplates,
      [Date.now().toString()]: {
        name: finalName,
        measurements,
        unit: 'CM'
      }
    };
    setSavedTemplates(newTemplates);
    localStorage.setItem('measurement_templates', JSON.stringify(newTemplates));
    setTemplateName('');
    setShowTemplateModal(false);
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = savedTemplates[templateId];
    if (template) {
      setMeasurements(template.measurements);
      setShowTemplateModal(false);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    const newTemplates = { ...savedTemplates };
    delete newTemplates[templateId];
    setSavedTemplates(newTemplates);
    localStorage.setItem('measurement_templates', JSON.stringify(newTemplates));
  };

  // Helper function to convert YouTube URL to embed format
  const getEmbedUrl = (url: string): string => {
    if (!url) return '';
    // Already an embed URL
    if (url.includes('youtube.com/embed/')) return url;
    // youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    // youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    return url;
  };

  // Load product data from Firebase using productId from URL params
  useEffect(() => {
    const loadProductData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // OPTIMIZATION: Use passed product object from navigation state if available
        // This prevents unnecessary fetches and fixes "Product Not Found" for mock data items
        if (state?.product && (state.product.id === effectiveProductId || !effectiveProductId)) {
          console.log('✅ Using passed product state:', state.product);
          setProductData(state.product);
          setIsLoading(false);
          return;
        }

        if (!effectiveProductId) {
          setError(t('measurements.noProductId'));
          setIsLoading(false);
          return;
        }

        const product = await firebaseService.getProduct(effectiveProductId);
        
        if (product) {
          setProductData(product);
        } else {
          setError(t('measurements.productNotFound'));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('measurements.failedToLoadProduct'));
      } finally {
        setIsLoading(false);
      }
    };

    loadProductData();
  }, [effectiveProductId, state?.product]);

  const coverImageUrl = React.useMemo(() => {
    const pd: any = productData || {};
    const byCoverIndex = Array.isArray(pd.images) ? pd.images[pd.coverImageIndex || 0] : undefined;
    return pd.image || pd.imageUrl || byCoverIndex || undefined;
  }, [productData]);

  // Load measurement templates once
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const saved = await firebaseService.getMeasurementTemplates();

        // Prefer the same category-driven list used by /admin/measurements
        try {
          const categories = await getAllCategories();
          const categoriesMap = new Map(categories.map((c: any) => [c.id, c]));

          const getRootCategory = (category: any) => {
            let current: any | null = category;
            while (current?.parentId) {
              const parent = categoriesMap.get(current.parentId) || null;
              if (!parent) break;
              current = parent;
            }
            return current || category;
          };

          const fashionRootIds = new Set(
            categories
              .filter((c: any) => c?.level === 0 && c?.categoryType === 'fashion')
              .map((c: any) => c.id)
          );

          const isFashionBranch = (category: any) => {
            const root = getRootCategory(category);
            if (!root) return false;
            if (fashionRootIds.size > 0) return fashionRootIds.has(root.id);
            const rootSlug = (root.slug?.toLowerCase?.() || '') as string;
            const rootNameEn = (root.nameEn?.toLowerCase?.() || '') as string;
            return (
              root.categoryType === 'fashion' ||
              rootSlug === 'fashion' ||
              rootNameEn === 'fashion' ||
              (typeof root.nameAr === 'string' && root.nameAr.includes('الأزياء'))
            );
          };

          let fashionCategories = categories.filter((c: any) => isFashionBranch(c));
          // If we can't detect the fashion branch reliably (missing metadata), don't hide everything.
          if (fashionCategories.length === 0) {
            fashionCategories = categories;
          }

          const merged: MeasurementTemplate[] = fashionCategories
            .map((cat: any) => {
              const t = saved.find((s) => s.id === cat.id);
              return {
                id: cat.id,
                name: (t?.name as any) || cat.nameAr || cat.nameEn || cat.id,
                productType: (t?.productType as any) || 'dishdasha',
                description: (t?.description as any) || cat.descriptionAr || cat.descriptionEn || '',
                baseImageUrl: (t?.baseImageUrl as any) || '',
                points: (t?.points as any) || [],
                arrows: (t as any)?.arrows || [],
                // carry through any extra saved fields (opacity, sizes, etc)
                ...(t || {}),
              } as MeasurementTemplate;
            })
            .sort((a: any, b: any) => {
              // Prefer stable order by category level/order when present
              const ca = categoriesMap.get(a.id);
              const cb = categoriesMap.get(b.id);
              const la = (ca?.level ?? 0) as number;
              const lb = (cb?.level ?? 0) as number;
              if (la !== lb) return la - lb;
              const oa = (ca?.order ?? 0) as number;
              const ob = (cb?.order ?? 0) as number;
              if (oa !== ob) return oa - ob;
              return String(a.name || '').localeCompare(String(b.name || ''));
            });

          setTemplates(merged);
          return;
        } catch (catErr) {
          // silently use saved templates only
        }

        setTemplates(saved || []);
      } catch (e) {
        // silently ignore
      }
    };
    loadTemplates();
  }, []);

  // Match template by categoryId and update measurement fields
  useEffect(() => {
    const categoryId = productData?.categoryId;
    if (!categoryId || templates.length === 0) {
      setMatchedTemplate(null);
      return;
    }
    const byId = templates.find((t) => t.id === categoryId) || null;

    const normalize = (value: unknown) =>
      String(value || '')
        .toLowerCase()
        .replace(/[\s\u200f\u200e]/g, '')
        .replace(/[\-–—]/g, '');

    const categoryNameCandidates = [productData?.categoryName, productData?.category, productData?.categoryAr, productData?.categoryEn]
      .filter(Boolean)
      .map((x: any) => String(x));

    const byName =
      !byId && categoryNameCandidates.length
        ? templates.find((t) => categoryNameCandidates.some((n) => normalize(t.name) === normalize(n))) || null
        : null;

    const match = byId || byName;
    setMatchedTemplate(match);

    // template matching handled silently
  }, [productData?.categoryId, templates]);

  // Auto-select Abaya as default if no template matches
  useEffect(() => {
    if (!matchedTemplate && !manualTemplateId && templates.length > 0) {
      // Try to find "Abaya" or use the first template as default
      const abayaTemplate = templates.find((t) => 
        String(t.name || '').toLowerCase().includes('عباية') || 
        String(t.name || '').toLowerCase().includes('abaya')
      );
      
      if (abayaTemplate) {
        setManualTemplateId(abayaTemplate.id);
      } else if (templates.length > 0) {
        // Fallback to first template
        setManualTemplateId(templates[0].id);
      }
    }
  }, [matchedTemplate, templates, manualTemplateId]);

  const activeTemplate = React.useMemo(() => {
    if (manualTemplateId) {
      return templates.find((t) => t.id === manualTemplateId) || null;
    }
    return matchedTemplate;
  }, [manualTemplateId, matchedTemplate, templates]);

  const isMeasurementsComplete = React.useMemo(() => {
    const points = activeTemplate?.points || [];
    if (!Array.isArray(points) || points.length === 0) return false;

    return points.every((point: any) => {
      const pointId = point?.id;
      if (!pointId) return true;
      const raw = (measurements[pointId] || '').toString().trim();
      if (!raw) return false;
      const num = Number(raw);
      return Number.isFinite(num) && num > 0;
    });
  }, [activeTemplate?.points, measurements]);

  const hasAnyEnteredMeasurement = React.useMemo(() => {
    const points = activeTemplate?.points || [];
    if (!Array.isArray(points) || points.length === 0) return false;

    return points.some((point: any) => {
      const pointId = point?.id;
      if (!pointId) return false;
      return (measurements[pointId] || '').toString().trim().length > 0;
    });
  }, [activeTemplate?.points, measurements]);

  useEffect(() => {
    setDismissedPreviewHint(false);
  }, [activeTemplate?.id]);

  const showPreviewHint = !!activeTemplate?.points?.length && !hasAnyEnteredMeasurement && !dismissedPreviewHint;

  // Template preview image mode: normal (no blending/filter)
  const templateBlendClassName = '';

  // Get video URL from template, product, or app settings
  const videoUrl = React.useMemo(() => {
    const templateVideo = activeTemplate?.matchingVideoUrl || activeTemplate?.videoUrl || activeTemplate?.tutorialVideoUrl;
    const productVideo = productData?.measurementVideoUrl || productData?.tutorialVideoUrl || productData?.videoUrl;
    const helpVideoEnabled = appSettings?.helpVideo?.enabled !== false;
    const helpVideoRawUrl = appSettings?.helpVideo?.url || DEFAULT_HELP_VIDEO_URL;
    const rawUrl = templateVideo || productVideo || (helpVideoEnabled ? helpVideoRawUrl : '');
    if (!rawUrl) return '';
    return getEmbedUrl(rawUrl);
  }, [activeTemplate, appSettings, productData]);

  // Handle point click - open input dialog
  const handlePointClick = (point: any) => {
    setDismissedPreviewHint(true);
    setActivePointId(point.id);
    setPointInputValue(measurements[point.id] || '');
  };

  // Handle point input confirmation
  const handlePointConfirm = () => {
    if (activePointId && pointInputValue) {
      setMeasurements(prev => ({
        ...prev,
        [activePointId]: pointInputValue
      }));
    }
    setActivePointId(null);
    setPointInputValue('');
  };

  // Handle keyboard Enter on point input
  const handlePointKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePointConfirm();
    } else if (e.key === 'Escape') {
      setActivePointId(null);
      setPointInputValue('');
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden"
      style={
        {
          // Match Khuyoot logo palette (teal).
          ['--theme-primary' as any]: '#2FB8B3',
          ['--theme-secondary' as any]: '#1E9E9B',
        } as React.CSSProperties
      }
    >
      <style>{`
        /* Ensure stable layout on load - prevent CLS */
        html, body {
          background: #0a0a0a;
          color: white;
        }
        /* Reserve space for main container to prevent layout shift */
        #root {
          background: #0a0a0a;
        }
      `}</style>
      {/* Top Navigation Bar Removed */}

      {/* Main Content: Single Block with Side-by-Side Layout */}
      <div className="max-w-7xl mx-auto px-2.5 py-2.5">
        {isLoading ? (
          <div className="rounded-md border border-white/5 bg-[#1a1a1a] overflow-hidden shadow-2xl min-h-screen sm:min-h-96">
            {/* Mobile Loading State */}
            <div className="sm:hidden space-y-3 p-3">
              {/* Video Help Skeleton */}
              <div className="bg-[#252525] border border-white/5 rounded-lg p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/5 rounded w-full"></div>
                    <div className="h-2 bg-white/5 rounded w-3/4"></div>
                  </div>
                </div>
              </div>

              {/* Template Selector Skeleton */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-white/5 rounded"></div>
              </div>

              {/* Preview Skeleton */}
              <div className="flex flex-col items-center bg-[#0f0f0f] border-b border-white/5 p-3">
                <div className="w-full max-w-md aspect-[3/4] bg-[#252525] rounded-2xl border border-white/5 animate-pulse"></div>
              </div>

              {/* Measurement Grid Skeleton */}
              <div className="p-3 bg-[#1a1a1a] space-y-3">
                <div className="h-4 bg-white/5 rounded w-1/3 animate-pulse"></div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-20 bg-white/5 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Loading State */}
            <div className="hidden sm:flex items-center justify-center h-96">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-[color:var(--theme-primary)] animate-spin mx-auto"></div>
                <p className="text-white/60">{t('measurements.loadingProductData')}</p>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
            <div className="text-center space-y-2">
              <p className="text-red-400 font-semibold">{t('measurements.errorLoadingProduct')}</p>
              <p className="text-red-300/80 text-sm">{error}</p>
              {!effectiveProductId && (
                <p className="text-white/50 text-xs mt-4">
                    {t('measurements.noProductId')}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-white/5 bg-[#1a1a1a] overflow-hidden shadow-2xl">
            <style>{`
              @keyframes shine-sweep {
                0% { transform: translateX(-150%) skewX(-45deg); }
                20% { transform: translateX(150%) skewX(-45deg); }
                100% { transform: translateX(150%) skewX(-45deg); }
              }
              @keyframes play-pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.15); }
              }
            `}</style>
            {/* MOBILE ONLY: Top Section (Video + Template Selector) */}
            <div className="sm:hidden p-1.5 bg-[#1a1a1a] space-y-1.5 border-b border-white/5">
              {/* Video Help Button */}
              <div className="bg-[#252525] border border-white/5 rounded-lg p-4">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(true)}
                  className="w-full flex items-center gap-4 text-left hover:opacity-80 transition-all group"
                >
                  <div className="flex-1 text-right">
                    <p className="text-sm font-semibold text-white">
                      {t('measurements.howToTakeMeasurements')}
                    </p>
                    <p className="text-xs text-white/50">
                      {t('common.watchVideo')}
                    </p>
                  </div>
                  <div className="relative w-16 h-16 rounded-full bg-[color:var(--theme-primary)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[color:var(--theme-primary)]/20 transition-all border-2 border-[color:var(--theme-primary)]/20 overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full" 
                      style={{ animation: 'shine-sweep 3s infinite ease-in-out' }}
                    />
                    <svg 
                      className="w-8 h-8 text-[color:var(--theme-primary)] relative z-10" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                      style={{ animation: 'play-pulse 2s infinite ease-in-out' }}
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <svg className="w-5 h-5 text-white/30 group-hover:text-white/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              {/* Template selector (manual override) */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      className={`p-2 -ml-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all duration-300 hover:scale-110 ${
                        isAr ? '[transform:scaleX(-1)]' : ''
                      }`}
                      onClick={() => window.history.back()}
                      title={isAr ? 'العودة' : 'Go Back'}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                      </svg>
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs text-white/60">قالب القياسات</p>
                      <p className="text-sm text-white/90 font-semibold truncate">
                        {activeTemplate?.name || matchedTemplate?.name || (templates.length ? 'اختر قالباً' : '...')}
                      </p>
                    </div>
                  </div>

                  {/* Save and Load Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setTemplateName(activeTemplate?.name || productData?.categoryName || '');
                        setShowTemplateModal(true);
                      }}
                      disabled={!isMeasurementsComplete}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600/40 text-white rounded-lg text-xs font-bold transition-colors"
                      title={
                        isMeasurementsComplete
                          ? 'Save current measurements'
                          : (t('measurements.fillAllMeasurements') || 'Please fill all measurements first')
                      }
                    >
                      {t('measurements.saveMeasurements')}
                    </button>
                    <button
                      onClick={() => setShowTemplateModal(true)}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-xs font-bold transition-colors"
                      title="Load saved measurements"
                    >
                      {t('measurements.loadSavedMeasurements')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE ONLY: Preview Section */}
            <div className="sm:hidden p-1.5 flex flex-col items-center bg-[#0f0f0f] border-b border-white/5">
              <div className="w-full max-w-md flex items-start justify-center">
                  {/* Priority: matchedTemplate image > product image > placeholder */}
                  <div
                    className="relative w-full aspect-[3/4] bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden"
                    onPointerDown={() => setDismissedPreviewHint(true)}
                  >
                    {showPreviewHint && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                        <div className="px-5 py-3 rounded-2xl bg-black/60 backdrop-blur-sm border border-white/10 text-white/90 text-sm sm:text-base font-semibold shadow-lg">
                          {t('measurements.tapCirclesToStart')}
                        </div>
                      </div>
                    )}
                    {activeTemplate?.baseImageUrl ? (
                      <img 
                        src={activeTemplate.baseImageUrl} 
                        alt={activeTemplate.name}
                        className={`absolute inset-0 w-full h-full object-contain user-select-none pointer-events-none ${templateBlendClassName}`}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    ) : productData?.imageUrl ? (
                      <img 
                        src={productData.imageUrl} 
                        alt={productData.name}
                        className="absolute inset-0 w-full h-full object-cover user-select-none pointer-events-none"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center user-select-none">
                        <img 
                          src="/logo_big.png?v=4" 
                          alt="Khuyoot" 
                          className="w-64 h-auto opacity-10 select-none pointer-events-none grayscale"
                          draggable={false}
                        />
                      </div>
                    )}

                    {/* Arrows from template */}
                    {activeTemplate?.arrows && activeTemplate.arrows.length > 0 && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {activeTemplate.arrows.map((arrow) => (
                          <line
                            key={arrow.id}
                            x1={arrow.startX * 100}
                            y1={arrow.startY * 100}
                            x2={arrow.endX * 100}
                            y2={arrow.endY * 100}
                            stroke="#f97316"
                            strokeWidth={lineThickness}
                            markerEnd="url(#arrowhead-measurements-v2)"
                            opacity={0.8}
                          />
                        ))}
                        <defs>
                          <marker id="arrowhead-measurements-v2" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L6,3 z" fill="#f97316" fillOpacity={0.8} />
                          </marker>
                        </defs>
                      </svg>
                    )}

                    {activeTemplate?.points && activeTemplate.points.length > 0 ? (
                      activeTemplate.points.map((point, idx) => {
                        const order = point.order || idx + 1;
                        const left = `${Math.max(0, Math.min(1, point.x || 0)) * 100}%`;
                        const top = `${Math.max(0, Math.min(1, point.y || 0)) * 100}%`;
                        const hasValue = measurements[point.id] && measurements[point.id].length > 0;
                        const pointSize = 32 * pointScale;
                        return (
                          <button
                            key={point.id}
                            onClick={() => handlePointClick(point)}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 user-select-none transition-all hover:scale-110 cursor-pointer"
                            style={{ left, top }}
                            title={point.label || `Point ${order}`}
                            type="button"
                          >
                            <div 
                              className={`rounded-full flex items-center justify-center text-xs font-bold shadow-lg ring-2 transition-all ${
                                hasValue
                                  ? 'bg-[#f97316] text-white ring-[#f97316]/60'
                                  : 'bg-[color:var(--theme-primary)] text-white ring-[color:var(--theme-primary)]/50 hover:scale-125'
                              }`}
                              style={{ width: `${pointSize}px`, height: `${pointSize}px` }}
                            >
                              {hasValue ? '✓' : order}
                            </div>
                          </button>
                        );
                      })
                    ) : null}
                  </div>
                  {isStitching && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-white/10">
                        <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-[color:var(--theme-primary)] animate-spin" />
                        <span className="text-sm text-white/80">{t('measurements.stitching')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            {/* Desktop and Mobile Input/Preview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2">
              {/* Input Section */}
              <div className="p-6 sm:border-r border-white/5 overflow-y-auto bg-[#1a1a1a]">
                <MeasurementStudioCanvas 
                  template={activeTemplate}
                  measurements={measurements}
                  onMeasurementsChange={(newMeasurements) => {
                    setMeasurements(newMeasurements);
                  }}
                  onGenerate={async (vals) => {
                    try {
                      setIsStitching(true);
                      
                      // Create order in Firebase
                      const orderData = {
                        productId: effectiveProductId || '',
                        productName: productData?.name || '',
                        categoryId: productData?.categoryId || '',
                        categoryName: activeTemplate?.name || '',
                        // Persist the original shop/tailor for correct "browse same shop" navigation.
                        tailorId: productData?.tailorId || '',
                        tailorName: (productData as any)?.tailorName || '',
                        tailorLocation: (productData as any)?.location || (productData as any)?.region || '',
                        region: (productData as any)?.region || (productData as any)?.location || '',
                        measurements: vals,
                        productImage: coverImageUrl || '',
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                        customerId: 'guest', // TODO: Replace with actual user ID when auth is implemented
                      };
                      
                      const orderId = await firebaseService.createOrder(orderData);
                      
                      // Navigate to order summary
                      navigate(`/order-summary/${orderId}`);
                    } catch (error) {
                      alert('Failed to create order. Please try again.');
                      setIsStitching(false);
                    }
                  }}
                  coverImageUrl={coverImageUrl}
                  onVideoClick={() => setShowVideoModal(true)}
                  lineThickness={lineThickness}
                  onLineThicknessChange={setLineThickness}
                  pointScale={pointScale}
                  onPointScaleChange={setPointScale}
                >
                  {/* Template selector (manual override) - Desktop Only */}
                  <div className="hidden sm:block mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          className={`p-2 -ml-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all duration-300 hover:scale-110 ${
                            isAr ? '[transform:scaleX(-1)]' : ''
                          }`}
                          onClick={() => window.history.back()}
                          title={isAr ? 'العودة' : 'Go Back'}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                          </svg>
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs text-white/60">قالب القياسات</p>
                          <p className="text-sm text-white/90 font-semibold truncate">
                            {activeTemplate?.name || matchedTemplate?.name || (templates.length ? 'اختر قالباً' : '...')}
                          </p>
                        </div>
                      </div>

                      {/* Save and Load Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setTemplateName(activeTemplate?.name || productData?.categoryName || '');
                            setShowTemplateModal(true);
                          }}
                          disabled={!isMeasurementsComplete}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600/40 text-white rounded-lg text-xs font-bold transition-colors"
                          title={
                            isMeasurementsComplete
                              ? 'Save current measurements'
                              : (t('measurements.fillAllMeasurements') || 'Please fill all measurements first')
                          }
                        >
                          {t('measurements.saveMeasurements')}
                        </button>
                        <button
                          onClick={() => setShowTemplateModal(true)}
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-xs font-bold transition-colors"
                          title="Load saved measurements"
                        >
                          {t('measurements.loadSavedMeasurements')}
                        </button>
                      </div>
                    </div>
                  </div>
                </MeasurementStudioCanvas>
              </div>

              {/* DESKTOP ONLY: Preview Section */}
              <div className="hidden sm:flex p-6 flex-col items-center bg-[#0f0f0f]">
                <div className="w-full max-w-md flex items-start justify-center">
                  {/* Priority: matchedTemplate image > product image > placeholder */}
                  <div
                    className="relative w-full aspect-[3/4] bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden"
                    onPointerDown={() => setDismissedPreviewHint(true)}
                  >
                    {showPreviewHint && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                        <div className="px-5 py-3 rounded-2xl bg-black/60 backdrop-blur-sm border border-white/10 text-white/90 text-sm sm:text-base font-semibold shadow-lg">
                          {t('measurements.tapCirclesToStart')}
                        </div>
                      </div>
                    )}
                    {activeTemplate?.baseImageUrl ? (
                      <img 
                        src={activeTemplate.baseImageUrl} 
                        alt={activeTemplate.name}
                        className={`absolute inset-0 w-full h-full object-contain user-select-none pointer-events-none ${templateBlendClassName}`}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    ) : productData?.imageUrl ? (
                      <img 
                        src={productData.imageUrl} 
                        alt={productData.name}
                        className="absolute inset-0 w-full h-full object-cover user-select-none pointer-events-none"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center user-select-none">
                        <img 
                          src="/logo_big.png?v=4" 
                          alt="Khuyoot" 
                          className="w-64 h-auto opacity-10 select-none pointer-events-none grayscale"
                          draggable={false}
                        />
                      </div>
                    )}

                    {/* Arrows from template */}
                    {activeTemplate?.arrows && activeTemplate.arrows.length > 0 && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {activeTemplate.arrows.map((arrow) => (
                          <line
                            key={arrow.id}
                            x1={arrow.startX * 100}
                            y1={arrow.startY * 100}
                            x2={arrow.endX * 100}
                            y2={arrow.endY * 100}
                            stroke="#f97316"
                            strokeWidth={lineThickness}
                            markerEnd="url(#arrowhead-measurements-v2)"
                            opacity={0.8}
                          />
                        ))}
                        <defs>
                          <marker id="arrowhead-measurements-v2" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L6,3 z" fill="#f97316" fillOpacity={0.8} />
                          </marker>
                        </defs>
                      </svg>
                    )}

                    {activeTemplate?.points && activeTemplate.points.length > 0 ? (
                      activeTemplate.points.map((point, idx) => {
                        const order = point.order || idx + 1;
                        const left = `${Math.max(0, Math.min(1, point.x || 0)) * 100}%`;
                        const top = `${Math.max(0, Math.min(1, point.y || 0)) * 100}%`;
                        const hasValue = measurements[point.id] && measurements[point.id].length > 0;
                        const pointSize = 32 * pointScale; // Base size 32px scaled
                        return (
                          <button
                            key={point.id}
                            onClick={() => handlePointClick(point)}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 user-select-none transition-all hover:scale-110 cursor-pointer"
                            style={{ left, top }}
                            title={point.label || `Point ${order}`}
                            type="button"
                          >
                            <div 
                              className={`rounded-full flex items-center justify-center text-xs font-bold shadow-lg ring-2 transition-all ${
                                hasValue
                                  ? 'bg-[#f97316] text-white ring-[#f97316]/60'
                                  : 'bg-[color:var(--theme-primary)] text-white ring-[color:var(--theme-primary)]/50 hover:scale-125'
                              }`}
                              style={{ width: `${pointSize}px`, height: `${pointSize}px` }}
                            >
                              {hasValue ? '✓' : order}
                            </div>
                          </button>
                        );
                      })
                    ) : null}
                  </div>
                  {isStitching && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-white/10">
                        <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-[color:var(--theme-primary)] animate-spin" />
                        <span className="text-sm text-white/80">{t('measurements.stitching')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Modal - Portalized & Protected */}
      {showVideoModal && createPortal(
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm" 
          onClick={() => setShowVideoModal(false)}
          data-overlay="khuyoot-modal"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#1a1a1a] border border-[color:var(--theme-primary)]/30 rounded-2xl p-6 w-[90%] max-w-4xl shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{t('measurements.howToTakeMeasurements')}</h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                ✕
              </button>
            </div>
            {videoUrl ? (
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-video">
                <iframe
                  src={videoUrl.includes('?') 
                    ? `${videoUrl}&rel=0&modestbranding=1&iv_load_policy=3` 
                    : `${videoUrl}?rel=0&modestbranding=1&iv_load_policy=3`}
                  title="measurements-video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-[#252525] p-8 text-center">
                <p className="text-white/60">{t('measurements.noVideoGuide')}</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Point Input Dialog - Portalized & Protected */}
      {activePointId && createPortal(
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          data-overlay="khuyoot-modal"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#1a1a1a] border border-[color:var(--theme-primary)]/30 rounded-2xl p-8 w-96 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {activeTemplate?.points?.find(p => p.id === activePointId)?.label || t('measurements.enterMeasurement')}
            </h3>
            <div className="space-y-4">
              <input
                type="number"
                value={pointInputValue}
                onChange={(e) => setPointInputValue(e.target.value)}
                onKeyDown={handlePointKeyDown}
                placeholder={t('measurements.enterNumber')}
                className="w-full px-4 py-3 bg-[#252525] border border-[color:var(--theme-primary)]/40 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[color:var(--theme-primary)]/90 transition-colors"
                autoFocus
              />
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handlePointConfirm}
                  className="flex-1 px-4 py-2 bg-[#2fb8b3] hover:bg-[#2fb8b3]/90 text-white font-bold rounded-lg transition-colors"
                >
                  {t('measurements.confirm')}
                </button>
                <button
                  onClick={() => {
                    setActivePointId(null);
                    setPointInputValue('');
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 text-white font-bold rounded-lg hover:bg-white/20 transition-colors"
                >
                  {t('measurements.cancel')}
                </button>
              </div>
              <p className="text-xs text-white/50 text-center">{t('measurements.pressEnterOrEscape')}</p>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Debug Block - Collapsible */}
      {appSettings?.isAdmin && (
        <div className="max-w-7xl mx-auto px-6 pb-2">
          <div className="mt-10 rounded-3xl border border-blue-500/30 bg-blue-500/5 overflow-hidden shadow-lg">
          <div className="bg-blue-500/10 border-b border-blue-500/30 px-6 py-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-blue-400">DEBUG: Product & Navigation Data</h3>
            <button
              onClick={() => setShowDebug((prev) => !prev)}
              className="px-3 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-semibold transition-all"
            >
              {showDebug ? 'Hide' : 'Show'}
            </button>
          </div>
          {showDebug && (
            <div className="p-6 space-y-4">
              {/* Loaded Product Data */}
              {productData && (
                <div className="bg-[#1a1a1a] border border-white/5 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-white/70 mb-3">Loaded Product Data:</h4>
                  <div className="space-y-2 text-[10px]">
                    <p><span className="text-white/50">ID:</span> <span className="text-white/80 break-all">{productData.id || 'N/A'}</span></p>
                    <p><span className="text-white/50">Name:</span> <span className="text-white/80">{productData.name || 'N/A'}</span></p>
                    <p><span className="text-white/50">Category:</span> <span className="text-white/80">{productData.category || 'N/A'}</span></p>
                    <p><span className="text-white/50">Description:</span> <span className="text-white/80">{productData.description?.substring(0, 50) || 'N/A'}...</span></p>
                    <p><span className="text-white/50">Price:</span> <span className="text-white/80">{productData.price || 'N/A'}</span></p>
                    <p><span className="text-white/50">Image:</span> <span className="text-white/80">{productData.imageUrl ? 'Present' : 'Missing'}</span></p>
                    <p><span className="text-white/50">Category ID:</span> <span className="text-white/80">{productData.categoryId || 'N/A'}</span></p>
                  </div>
                </div>
              )}

              {/* URL & Route Info */}
              <div className="bg-[#1a1a1a] border border-white/5 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-white/70 mb-2">URL & Route Info:</h4>
                <div className="space-y-1 text-[10px]">
                  <p><span className="text-white/50">Product ID (effective):</span> <span className="text-white/80">{effectiveProductId || 'None'}</span></p>
                  <p><span className="text-white/50">Current Path:</span> <span className="text-white/80 break-all">{window.location.pathname}</span></p>
                  <p><span className="text-white/50">Loading:</span> <span className="text-white/80">{isLoading ? 'Yes' : 'No'}</span></p>
                  <p><span className="text-white/50">Error:</span> <span className="text-white/80">{error || 'None'}</span></p>
                </div>
              </div>

              {/* Location State */}
              {state && (
                <div className="bg-[#1a1a1a] border border-white/5 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-white/70 mb-2">Location State:</h4>
                  <pre className="text-[10px] text-white/60 overflow-auto max-h-40 bg-[#0a0a0a] p-2 rounded border border-white/5">
                    {JSON.stringify(state, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      )}

      {/* Template Save/Load Modal - Portalized & Protected */}
      {showTemplateModal && createPortal(
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
          data-overlay="khuyoot-modal"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-zinc-900 rounded-2xl border border-white/10 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{t('measurements.saveMeasurements')}</h3>
              <button onClick={() => { setShowTemplateModal(false); setTemplateName(''); }} className="text-white/50 hover:text-white transition-colors">
                ✕
              </button>
            </div>

            {/* Save New Template Section */}
            <div className="space-y-2 border-b border-white/10 pb-4">
              <label className="text-sm font-semibold text-white/70">{t('measurements.saveMeasurements')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder={t('common.templateName') || 'Template name...'}
                  className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-emerald-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
                />
                <button
                  onClick={handleSaveTemplate}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {t('common.save')}
                </button>
              </div>
            </div>

            {/* Load Template Section */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/70">{t('measurements.loadSavedMeasurements')}</label>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {Object.entries(savedTemplates).length === 0 ? (
                  <p className="text-white/40 text-sm text-center py-4">{t('common.noSavedTemplates')}</p>
                ) : (
                  Object.entries(savedTemplates).map(([id, template]) => (
                    <div key={id} className="flex items-center justify-between bg-zinc-800 rounded-lg p-3 hover:bg-zinc-700 transition-colors">
                      <button
                        onClick={() => handleLoadTemplate(id)}
                        className="flex-1 text-left"
                      >
                        <p className="text-white font-medium text-sm">{template.name}</p>
                        <p className="text-white/40 text-xs">{Object.keys(template.measurements).length} {t('common.measurements')}</p>
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(id)}
                        className="text-red-400 hover:text-red-300 text-sm px-2"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export const ClientMeasurementsV2 = React.memo(ClientMeasurementsV2Component);
ClientMeasurementsV2.displayName = 'ClientMeasurementsV2';

export default ClientMeasurementsV2;
