import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, X } from 'lucide-react';
import { MeasurementStudioCanvas } from './components/MeasurementStudioCanvas';
import { firebaseService } from '../../services/firebase';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../auth/useAuth';
import { measurementService, MeasurementTemplate } from './services/measurementService';

// ✅ WRAPPED IN React.memo: Component has 811 lines and heavy computations
interface ClientMeasurementsV2Props {
  productId?: string;
  isModal?: boolean;
  onClose?: () => void;
}

const ClientMeasurementsV2Component: React.FC<ClientMeasurementsV2Props> = (props) => {
  const { productId: propProductId, isModal, onClose } = props;
  const { user } = useAuth();
  const { appSettings } = useApp();
  const { t, i18n } = useTranslation(['measurements', 'common']);
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
      // Also support raw task IDs or template IDs if needed
      return value;
    };

    return (
      propProductId ||
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
  const [measurements, setMeasurements] = useState<Record<string, string>>(() => {
    // Priority: Explicitly passed measurements from navigation state
    if (state?.measurements && typeof state.measurements === 'object') {
      return { ...state.measurements };
    }
    // Fallback: measurements from an order object if passed
    if (state?.order?.measurements && typeof state.order.measurements === 'object') {
      return { ...state.order.measurements };
    }
    return {};
  });
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [lineThickness, setLineThickness] = useState(0.7);
  const [pointScale, setPointScale] = useState(0.8);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateModalMode, setTemplateModalMode] = useState<'save' | 'load'>('save');
  const [templateName, setTemplateName] = useState('');
  const [savedTemplates, setSavedTemplates] = useState<Record<string, { name: string; measurements: Record<string, string>; unit: string }>>({});
  const [dismissedPreviewHint, setDismissedPreviewHint] = useState(false);
  const [showSliders, setShowSliders] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
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

  // Reset video loading state when modal opens
  useEffect(() => {
    if (showVideoModal) {
      setVideoLoading(true);
    }
  }, [showVideoModal]);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert(t('common:templateNameRequired') || (isAr ? 'يرجى إدخال اسم النموذج' : 'Please enter a template name'));
      return;
    }

    if (!isMeasurementsComplete) {
      alert(t('measurements:fillAllMeasurements') || (isAr ? 'يرجى ملء جميع القياسات بأرقام صحيحة قبل الحفظ' : 'Please fill all measurements with valid numbers before saving'));
      return;
    }
    
    // Check if name already exists and add numbering
    let finalName = templateName.trim();
    const existingNames = (Object.values(savedTemplates) as any[]).map(t => t.name);
    
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
      // Only apply measurements that exist in the active template to prevent data pollution
      const activePointIds = new Set(activeTemplate?.points?.map((p: any) => p.id) || []);
      const filteredMeasurements: Record<string, string> = {};
      
      Object.entries(template.measurements || {}).forEach(([id, val]) => {
        if (activePointIds.has(id)) {
          filteredMeasurements[id] = val as string;
        }
      });
      
      setMeasurements(filteredMeasurements);
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
          setError(t('measurements:noProductId'));
          setIsLoading(false);
          return;
        }

        const product = await firebaseService.getProduct(effectiveProductId);
        
        if (product) {
          setProductData(product);
        } else {
          setError(t('measurements:productNotFound'));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('measurements:failedToLoadProduct'));
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
      const merged = await measurementService.getTemplates();
      setTemplates(merged);
    };
    loadTemplates();
  }, []);

  // Match template by categoryId and update measurement fields
  useEffect(() => {
    const match = async () => {
      const template = await measurementService.getTemplateForProduct(productData, templates);
      setMatchedTemplate(template);
    };
    match();
  }, [productData, templates]);

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
    <>
      <div 
        className={isModal 
          ? "h-full bg-white text-zinc-900 rounded-2xl flex flex-col relative overflow-hidden" 
          : "min-h-screen h-full bg-white text-zinc-900 overflow-x-hidden"}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {isModal && onClose && (
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 z-50 p-2 bg-white/90 hover:bg-zinc-100 rounded-full shadow-md text-zinc-500 hover:text-red-500 transition-colors border border-black/5"
            aria-label={t('common:close')}
          >
            <X size={20} />
          </button>
        )}
      <style>{`
        /* Ensure stable layout on load - prevent CLS */
        html, body {
          background: white;
          color: #18181b;
        }
        /* Reserve space for main container to prevent layout shift */
        #root {
          background: white;
        }
      `}</style>
      {/* Top Navigation Bar Removed */}

      <div className={isModal ? "h-full overflow-y-auto custom-scrollbar" : "h-full"}>
        {isLoading ? (
          <div className={isModal ? "bg-white h-full flex items-center justify-center" : "bg-white overflow-hidden shadow-2xl min-h-screen sm:min-h-96 h-full"}>
            {isModal && (<div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>)}
            {!isModal && (
            <>
            {/* Mobile Loading State */}
            <div className="sm:hidden space-y-3 p-3">
              {/* Video Help Skeleton */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-zinc-100 rounded w-full"></div>
                    <div className="h-2 bg-zinc-100 rounded w-3/4"></div>
                  </div>
                </div>
              </div>

              {/* Template Selector Skeleton */}
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 animate-pulse">
                <div className="h-4 bg-zinc-100 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-zinc-100 rounded"></div>
              </div>

              {/* Preview Skeleton */}
              <div className="flex flex-col items-center bg-white border-b border-zinc-50 p-3">
                <div className="w-full max-w-md aspect-[3/4] bg-zinc-100 rounded-2xl border border-zinc-100 animate-pulse"></div>
              </div>

              {/* Measurement Grid Skeleton */}
              <div className="p-3 bg-white space-y-3">
                <div className="h-4 bg-zinc-100 rounded w-1/3 animate-pulse"></div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-20 bg-zinc-100 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Loading State */}
            <div className="hidden sm:flex items-center justify-center h-96">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-2 border-zinc-200 border-t-[color:var(--theme-primary)] animate-spin mx-auto"></div>
                <p className="text-zinc-500">{t('measurements:loadingProductData')}</p>
              </div>
            </div>
            </>
            )}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
            <div className="text-center space-y-2">
              <p className="text-red-600 font-semibold">{t('measurements:errorLoadingProduct')}</p>
              <p className="text-red-500/80 text-sm">{error}</p>
              {!effectiveProductId && (
                <p className="text-zinc-400 text-xs mt-4">
                    {t('measurements:noProductId')}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white overflow-hidden h-full">
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
            <div className="sm:hidden bg-white space-y-1.5 border-b border-zinc-100">
              {/* Video Help Button */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-4">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(true)}
                  className="w-full flex items-center gap-4 text-left hover:opacity-80 transition-all group"
                >
                  <div className="flex-1 text-right">
                    <p className="text-sm font-semibold text-zinc-900">
                      {t('measurements:howToTakeMeasurements')}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {t('common:watchVideo')}
                    </p>
                  </div>
                  <div className="relative w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-all border-2 border-purple-200/50 overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-full h-full" 
                      style={{ animation: 'shine-sweep 3s infinite ease-in-out' }}
                    />
                    <svg 
                      className="w-8 h-8 text-purple-600 relative z-10 translate-x-0.5" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                      style={{ animation: 'play-pulse 2s infinite ease-in-out' }}
                    >
                      <path d="M7 5l12 7-12 7V5z" />
                    </svg>
                  </div>
                  <svg className="w-5 h-5 text-white/30 group-hover:text-white/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>


            </div>

            {/* MOBILE ONLY: Preview Section */}
            <div className="sm:hidden flex flex-col items-center bg-zinc-50 border-b border-zinc-100">
              <div className="w-full max-w-md flex items-start justify-center">
                  {/* Priority: matchedTemplate image > product image > placeholder */}
                  <div
                    className="relative w-full aspect-[3/4] bg-white rounded-2xl border border-zinc-200 overflow-hidden"
                    onPointerDown={() => setDismissedPreviewHint(true)}
                  >
                    {showPreviewHint && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                        <div className="px-5 py-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-zinc-200 text-zinc-900 text-sm sm:text-base font-semibold shadow-lg">
                          {t('measurements:tapCirclesToStart')}
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
                            stroke="#06b6d4"
                            strokeWidth={lineThickness}
                            markerEnd="url(#arrowhead-measurements-v2)"
                            opacity={0.8}
                          />
                        ))}
                        <defs>
                          <marker id="arrowhead-measurements-v2" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L6,3 z" fill="#06b6d4" fillOpacity={0.8} />
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
                        <span className="text-sm text-white/80">{t('measurements:stitching')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            {/* Desktop and Mobile Input/Preview Flex Layout */}
            <div className="flex flex-col sm:flex-row h-[calc(100vh-2rem)] overflow-hidden">
              {/* Input Section */}
              <div className="w-full sm:w-[320px] flex-shrink-0 sm:border-r border-white/5 overflow-y-auto bg-[#1a1a1a] h-full custom-scrollbar">
                <MeasurementStudioCanvas 
                  template={activeTemplate}
                  measurements={measurements}
                  onMeasurementsChange={(newMeasurements) => {
                    setMeasurements(newMeasurements);
                  }}
                  onGenerate={async (vals) => {
                    try {
                      setIsStitching(true);

                      // Create a mapping of measurement point IDs to labels for the tailor
                      const measurementLabels: Record<string, string> = {};
                      const filteredMeasurements: Record<string, number> = {};
                      activeTemplate?.points?.forEach((p: any) => {
                        measurementLabels[p.id] = p.label || p.name || p.id;
                        if (vals[p.id] !== undefined) {
                          filteredMeasurements[p.id] = vals[p.id];
                        }
                      });
                      
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
                        measurements: filteredMeasurements,
                        measurementLabels: measurementLabels,
                        templateId: activeTemplate?.id,
                        templateUrl: activeTemplate?.imageUrl || activeTemplate?.baseImageUrl,
                        templatePoints: activeTemplate?.points || [],
                        templateArrows: activeTemplate?.arrows || [],
                        productImage: coverImageUrl || '',
                        price: productData?.price || 0,
                        status: 'pending',
                        orderDate: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        customerName: user?.displayName || (user as any)?.name || 'عميل خيوط',
                        customerEmail: user?.email || '',
                        customerPhone: (user as any)?.phoneNumber || (user as any)?.phone || '',
                        userId: user?.uid || (user as any)?.id || 'guest',
                        customerId: user?.uid || (user as any)?.id || 'guest',
                      };
                      
                      const orderId = await firebaseService.createOrder(orderData);
                      
                      // Navigate to order summary
                      navigate(`/order-summary/${orderId}`);
                    } catch (error) {
                      alert(isAr ? 'فشل في إنشاء الطلب. يرجى المحاولة مرة أخرى.' : 'Failed to create order. Please try again.');
                      setIsStitching(false);
                    }
                  }}
                  coverImageUrl={coverImageUrl}
                  onVideoClick={() => setShowVideoModal(true)}
                  onSaveClick={() => {
                    setTemplateName(activeTemplate?.name || productData?.categoryName || '');
                    setTemplateModalMode('save');
                    setShowTemplateModal(true);
                  }}
                  onLoadClick={() => {
                    setTemplateModalMode('load');
                    setShowTemplateModal(true);
                  }}
                  canSave={isMeasurementsComplete}
                />
              </div>

              {/* DESKTOP ONLY: Preview Section */}
              <div className="flex-1 hidden sm:flex flex-col items-center bg-[#0f0f0f] h-full overflow-y-auto custom-scrollbar p-7">
                <div className="w-full max-w-md flex items-start justify-center">
                  {/* Priority: matchedTemplate image > product image > placeholder */}
                  <div
                    className="relative w-full aspect-[3/4] bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden"
                    onPointerDown={() => setDismissedPreviewHint(true)}
                  >
                    {showPreviewHint && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                        <div className="px-5 py-3 rounded-2xl bg-black/60 backdrop-blur-sm border border-white/10 text-white/90 text-sm sm:text-base font-semibold shadow-lg">
                          {t('measurements:tapCirclesToStart')}
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
                            stroke="#06b6d4"
                            strokeWidth={lineThickness}
                            markerEnd="url(#arrowhead-measurements-v2)"
                            opacity={0.8}
                          />
                        ))}
                        <defs>
                          <marker id="arrowhead-measurements-v2" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L6,3 z" fill="#06b6d4" fillOpacity={0.8} />
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
                        <span className="text-sm text-white/80">{t('measurements:stitching')}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Line Thickness & Point Scale Sliders - Collapsible */}
                <div className="w-full max-w-md mt-4">
                  <button
                    onClick={() => setShowSliders(!showSliders)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors mb-2"
                  >
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white/70">
                      {isAr ? 'أدوات التحكم البصرية' : 'Visual Controls'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-zinc-500 dark:text-white/50 transition-transform ${showSliders ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showSliders && (
                    <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 dark:text-white/50 mb-1.5 block pb-1">
                      {isAr ? 'حجم النقاط' : 'Point Scale'}: {pointScale.toFixed(1)}
                    </label>
                    <div className="rounded-lg bg-zinc-100 dark:bg-[#252525] border border-zinc-200 dark:border-white/5 p-2 pb-3">
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={pointScale}
                        title="Point Scale Control"
                        onChange={(e) => setPointScale(parseFloat(e.target.value))}
                        className="w-full h-1 rounded-lg appearance-none cursor-pointer"
                        dir="ltr"
                        style={{
                          background: `linear-gradient(to right, #7c3aed ${((pointScale - 0.5) / 1.0) * 100}%, rgba(0,0,0,0.1) ${((pointScale - 0.5) / 1.0) * 100}%)`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 dark:text-white/50 mb-1.5 block pb-1">
                      {isAr ? 'سمك الخطوط' : 'Line Thickness'}: {lineThickness.toFixed(1)}
                    </label>
                    <div className="rounded-lg bg-zinc-100 dark:bg-[#252525] border border-zinc-200 dark:border-white/5 p-2 pb-3">
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={lineThickness}
                        title="Line Thickness Control"
                        onChange={(e) => setLineThickness(parseFloat(e.target.value))}
                        className="w-full h-1 rounded-lg appearance-none cursor-pointer"
                        dir="ltr"
                        style={{
                          background: `linear-gradient(to right, #7c3aed ${((lineThickness - 0.5) / 1.0) * 100}%, rgba(0,0,0,0.1) ${((lineThickness - 0.5) / 1.0) * 100}%)`
                        }}
                      />
                    </div>
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
          <div className="bg-white dark:bg-[#1a1a1a] border border-purple-600/30 rounded-2xl p-6 w-[90%] max-w-4xl shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{t('measurements:howToTakeMeasurements')}</h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 flex items-center justify-center text-zinc-600 dark:text-white transition-colors font-bold"
              >
                ✕
              </button>
            </div>
            {videoUrl ? (
              <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-black aspect-video relative">
                {videoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-black z-10">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full border-4 border-zinc-200 dark:border-white/10 border-t-purple-600 animate-spin" />
                      <p className="text-sm text-zinc-500 dark:text-white/50">
                        {isAr ? 'جاري تحميل الفيديو...' : 'Loading video...'}
                      </p>
                    </div>
                  </div>
                )}
                <iframe
                  src={videoUrl.includes('?') 
                    ? `${videoUrl}&rel=0&modestbranding=1&iv_load_policy=3` 
                    : `${videoUrl}?rel=0&modestbranding=1&iv_load_policy=3`}
                  title="measurements-video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                  onLoad={() => setVideoLoading(false)}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#252525] p-8 text-center">
                <p className="text-zinc-500 dark:text-white/60">{t('measurements:noVideoGuide')}</p>
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
          <div className="bg-white dark:bg-[#1a1a1a] border border-purple-600/30 rounded-2xl p-8 w-96 shadow-2xl">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
              {activeTemplate?.points?.find(p => p.id === activePointId)?.label || t('measurements:enterMeasurement')}
            </h3>
            <div className="space-y-4">
              <label htmlFor="point-measurement-input" className="sr-only">{activeTemplate?.points?.find(p => p.id === activePointId)?.label || t('measurements:enterMeasurement')}</label>
              <input
                id="point-measurement-input"
                type="number"
                value={pointInputValue}
                onChange={(e) => setPointInputValue(e.target.value)}
                onKeyDown={handlePointKeyDown}
                placeholder={t('measurements:enterNumber')}
                title={t('measurements:enterMeasurement')}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-[#252525] border border-purple-600/40 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-white/40 focus:outline-none focus:border-purple-600 dark:focus:border-[color:var(--theme-primary)]/90 transition-colors"
                autoFocus
              />
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handlePointConfirm}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
                >
                  {t('measurements:confirm')}
                </button>
                <button
                  onClick={() => {
                    setActivePointId(null);
                    setPointInputValue('');
                  }}
                  className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white font-bold rounded-lg hover:bg-zinc-200 dark:hover:bg-white/20 transition-colors"
                >
                  {t('measurements:cancel')}
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-white/50 text-center">{t('measurements:pressEnterOrEscape')}</p>
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
            <h3 className="text-sm font-bold text-blue-400">{isAr ? 'تصحيح الأخطاء: بيانات المنتج والتنقل' : 'DEBUG: Product & Navigation Data'}</h3>
            <button
              onClick={() => setShowDebug((prev) => !prev)}
              className="px-3 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-semibold transition-all"
            >
              {showDebug ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
            </button>
          </div>
          {showDebug && (
            <div className="p-6 space-y-4">
              {/* Loaded Product Data */}
              {productData && (
                <div className="bg-[#1a1a1a] border border-white/5 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-white/70 mb-3">{isAr ? 'بيانات المنتج المحملة:' : 'Loaded Product Data:'}</h4>
                  <div className="space-y-2 text-[10px] text-right" dir={isAr ? 'rtl' : 'ltr'}>
                    <p><span className="text-white/50">{isAr ? 'المعرف:' : 'ID:'}</span> <span className="text-white/80 break-all">{productData.id || 'N/A'}</span></p>
                    <p><span className="text-white/50">{isAr ? 'الاسم:' : 'Name:'}</span> <span className="text-white/80">{productData.name || 'N/A'}</span></p>
                    <p><span className="text-white/50">{isAr ? 'الفئة:' : 'Category:'}</span> <span className="text-white/80">{productData.category || 'N/A'}</span></p>
                    <p><span className="text-white/50">{isAr ? 'الوصف:' : 'Description:'}</span> <span className="text-white/80">{productData.description?.substring(0, 50) || 'N/A'}...</span></p>
                    <p><span className="text-white/50">{isAr ? 'السعر:' : 'Price:'}</span> <span className="text-white/80">{productData.price || 'N/A'}</span></p>
                    <p><span className="text-white/50">{isAr ? 'الصورة:' : 'Image:'}</span> <span className="text-white/80">{productData.imageUrl ? (isAr ? 'متوفرة' : 'Present') : (isAr ? 'غير متوفرة' : 'Missing')}</span></p>
                    <p><span className="text-white/50">{isAr ? 'معرف الفئة:' : 'Category ID:'}</span> <span className="text-white/80">{productData.categoryId || 'N/A'}</span></p>
                  </div>
                </div>
              )}

              {/* URL & Route Info */}
              <div className="bg-[#1a1a1a] border border-white/5 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-white/70 mb-2">{isAr ? 'معلومات الرابط والمسار:' : 'URL & Route Info:'}</h4>
                <div className="space-y-1 text-[10px] text-right" dir={isAr ? 'rtl' : 'ltr'}>
                  <p><span className="text-white/50">{isAr ? 'معرف المنتج (فعلي):' : 'Product ID (effective):'}</span> <span className="text-white/80">{effectiveProductId || 'None'}</span></p>
                  <p><span className="text-white/50">{isAr ? 'المسار الحالي:' : 'Current Path:'}</span> <span className="text-white/80 break-all">{window.location.pathname}</span></p>
                  <p><span className="text-white/50">{isAr ? 'قيد التحميل:' : 'Loading:'}</span> <span className="text-white/80">{isLoading ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}</span></p>
                  <p><span className="text-white/50">{isAr ? 'خطأ:' : 'Error:'}</span> <span className="text-white/80">{error || 'None'}</span></p>
                </div>
              </div>

              {/* Location State */}
              {state && (
                <div className="bg-[#1a1a1a] border border-white/5 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-white/70 mb-2">{isAr ? 'حالة الموقع (Location State):' : 'Location State:'}</h4>
                  <pre className="text-[10px] text-white/60 overflow-auto max-h-40 bg-[#0a0a0a] p-2 rounded border border-white/5" dir="ltr">
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
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">
                {templateModalMode === 'save' 
                  ? t('measurements:saveMeasurements') 
                  : t('measurements:loadSavedMeasurements')}
              </h3>
              <button onClick={() => { setShowTemplateModal(false); setTemplateName(''); }} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                ✕
              </button>
            </div>

            {/* Save New Template Section */}
            {templateModalMode === 'save' && (
              <div className="space-y-4 border-b border-zinc-100 pb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder={t('common:templateName') || 'Template name...'}
                    className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 placeholder-zinc-400 text-sm focus:outline-none focus:border-purple-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
                  />
                  <button
                    onClick={handleSaveTemplate}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                  >
                    {t('common:save')}
                  </button>
                </div>
              </div>
            )}

            {/* Load Template Section */}
            <div className="space-y-2">
              {templateModalMode === 'save' && (
                <label className="text-sm font-semibold text-zinc-500">{t('measurements:loadSavedMeasurements')}</label>
              )}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {Object.entries(savedTemplates).length === 0 ? (
                  <p className="text-zinc-400 text-sm text-center py-4">{t('common:noSavedTemplates')}</p>
                ) : (
                  Object.entries(savedTemplates).map(([id, template]) => (
                    <div key={id} className="flex items-center justify-between bg-zinc-50 rounded-lg p-3 hover:bg-zinc-100 transition-colors border border-zinc-100">
                      <button
                        onClick={() => handleLoadTemplate(id)}
                        className="flex-1 text-left"
                      >
                        <p className="text-zinc-900 font-bold text-sm">{(template as any).name}</p>
                        <p className="text-zinc-500 text-xs tracking-tight">{Object.keys((template as any).measurements || {}).length} {t('common:measurements')}</p>
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(id)}
                        className="text-red-500 hover:text-red-600 transition-colors p-2"
                        title={t('common:delete')}
                      >
                        <Trash2 size={18} />
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
    </>
  );
};

export const ClientMeasurementsV2 = React.memo(ClientMeasurementsV2Component);
ClientMeasurementsV2.displayName = 'ClientMeasurementsV2';

export default ClientMeasurementsV2;
