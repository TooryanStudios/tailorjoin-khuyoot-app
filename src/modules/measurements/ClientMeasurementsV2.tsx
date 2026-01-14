import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
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

export const ClientMeasurementsV2: React.FC = () => {
  const { appSettings } = useApp();
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
  const [showDebug, setShowDebug] = useState(true);
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
  const DEFAULT_HELP_VIDEO_URL = 'https://www.youtube.com/watch?v=6eZtn5Du8O4';

  // Load saved templates from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('measurement_templates');
      if (saved) {
        setSavedTemplates(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load saved templates:', error);
    }
  }, []);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
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

        console.log('[DEBUG ClientMeasurementsV2] productId from URL:', productIdParam);
        console.log('[DEBUG ClientMeasurementsV2] productId from state:', state?.productId || state?.templateId);
        console.log('[DEBUG ClientMeasurementsV2] effectiveProductId:', effectiveProductId);
        console.log('[DEBUG ClientMeasurementsV2] Firebase initialized:', firebaseService.isInitialized());

        if (!effectiveProductId) {
          console.log('[DEBUG ClientMeasurementsV2] No productId available (URL/state)');
          setError('No productId provided. Use format: /measurements/:productId');
          setIsLoading(false);
          return;
        }

        console.log('[DEBUG ClientMeasurementsV2] Loading product data for productId:', effectiveProductId);
        const product = await firebaseService.getProduct(effectiveProductId);
        console.log('[DEBUG ClientMeasurementsV2] getProduct response:', product);
        
        if (product) {
          console.log('[DEBUG ClientMeasurementsV2] Product loaded successfully:', product);
          setProductData(product);
        } else {
          console.warn('[DEBUG ClientMeasurementsV2] Product not found in Firebase for ID:', effectiveProductId);
          setError('Product not found in Firebase. Please check the product ID.');
        }
      } catch (err) {
        console.error('[DEBUG ClientMeasurementsV2] Error loading product:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    loadProductData();
  }, [effectiveProductId]);

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
          console.log('[DEBUG ClientMeasurementsV2] Templates loaded (categories+saved):', merged.length);
          return;
        } catch (catErr) {
          console.warn('[DEBUG ClientMeasurementsV2] Failed to load categories; using saved templates only:', catErr);
        }

        setTemplates(saved || []);
        console.log('[DEBUG ClientMeasurementsV2] Templates loaded (saved only):', saved?.length || 0);
      } catch (e) {
        console.warn('[DEBUG ClientMeasurementsV2] Failed to load templates:', e);
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

    if (match) {
      console.log('[DEBUG ClientMeasurementsV2] Matched template:', {
        matchId: match.id,
        matchName: match.name,
        by: byId ? 'id' : 'name',
        categoryId,
        categoryNames: categoryNameCandidates,
      });
      console.log('[DEBUG ClientMeasurementsV2] Template points:', match.points?.length || 0);
    } else {
      console.warn('[DEBUG ClientMeasurementsV2] No matched template', {
        categoryId,
        categoryNames: categoryNameCandidates,
        templatesCount: templates.length,
      });
    }
  }, [productData?.categoryId, templates]);

  const activeTemplate = React.useMemo(() => {
    if (manualTemplateId) {
      return templates.find((t) => t.id === manualTemplateId) || null;
    }
    return matchedTemplate;
  }, [manualTemplateId, matchedTemplate, templates]);

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
      console.log('[DEBUG ClientMeasurementsV2] Measurement saved:', activePointId, '=', pointInputValue);
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
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/icons/icon-192.png"
              alt="Khuyoot logo"
              className="w-10 h-10 rounded-lg object-cover border border-white/10 select-none"
              draggable={false}
            />
            <div>
              <h1 className="text-2xl font-bold text-white">MEASUREMENT STUDIO</h1>
              <p className="text-sm text-white/60">
                {productData ? `${productData.name} - ${productData.category}` : 'Transform your body measurements into perfect tailoring instantly.'}
              </p>
            </div>
          </div>
          <button
            className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium border border-white/20 transition-all"
            onClick={() => window.history.back()}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Main Content: Single Block with Side-by-Side Layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-[color:var(--theme-primary)] animate-spin mx-auto"></div>
              <p className="text-white/60">Loading product data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
            <div className="text-center space-y-2">
              <p className="text-red-400 font-semibold">Error Loading Product</p>
              <p className="text-red-300/80 text-sm">{error}</p>
              {!effectiveProductId && (
                <p className="text-white/50 text-xs mt-4">
                  No productId provided. Use format: /measurements/:productId
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/5 bg-[#1a1a1a] overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2">
              {/* LEFT: Input Section */}
              <div className="p-6 sm:border-r border-white/5 overflow-y-auto bg-[#1a1a1a]">
                {/* Template selector (manual override) */}
                <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-white/60">قالب القياسات</p>
                      <p className="text-sm text-white/90 font-semibold truncate">
                        {activeTemplate?.name || matchedTemplate?.name || (templates.length ? 'اختر قالباً' : '...')}
                      </p>
                    </div>

                    <select
                      value={manualTemplateId}
                      onChange={(e) => setManualTemplateId(e.target.value)}
                      className="bg-[#252525] border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[color:var(--theme-primary)]"
                    >
                      <option value="">تلقائي (حسب الصنف)</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name || t.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!manualTemplateId && templates.length > 0 && !matchedTemplate && (
                    <p className="mt-3 text-xs text-amber-300/90">
                      لم يتم العثور على قالب مطابق لصنف هذا المنتج. اختر قالباً يدوياً من القائمة.
                    </p>
                  )}
                </div>

                <MeasurementStudioCanvas 
                  template={activeTemplate}
                  measurements={measurements}
                  onMeasurementsChange={(newMeasurements) => {
                    setMeasurements(newMeasurements);
                    console.log('[DEBUG ClientMeasurementsV2] Measurements updated:', newMeasurements);
                  }}
                  onGenerate={async (vals) => {
                    try {
                      console.log('[DEBUG ClientMeasurementsV2] Stitching started with measurements:', vals);
                      setIsStitching(true);
                      
                      // Create order in Firebase
                      const orderData = {
                        productId: effectiveProductId || '',
                        productName: productData?.name || '',
                        categoryId: productData?.categoryId || '',
                        categoryName: activeTemplate?.name || '',
                        measurements: vals,
                        productImage: coverImageUrl || '',
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                        customerId: 'guest', // TODO: Replace with actual user ID when auth is implemented
                      };
                      
                      const orderId = await firebaseService.createOrder(orderData);
                      console.log('[DEBUG ClientMeasurementsV2] Order created:', orderId);
                      
                      // Navigate to order summary
                      navigate(`/order-summary/${orderId}`);
                    } catch (error) {
                      console.error('[DEBUG ClientMeasurementsV2] Error creating order:', error);
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
                  onSaveTemplate={() => {
                    setTemplateName(activeTemplate?.name || productData?.categoryName || '');
                    setShowTemplateModal(true);
                  }}
                  onLoadTemplate={() => setShowTemplateModal(true)}
                />
              </div>

              {/* RIGHT: Preview Section */}
              <div className="p-6 flex flex-col items-center bg-[#0f0f0f]">
                <div className="w-full max-w-md flex items-start justify-center">
                  {/* Priority: matchedTemplate image > product image > placeholder */}
                  <div className="relative w-full aspect-[3/4] bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden">
                    {activeTemplate?.baseImageUrl ? (
                      <img 
                        src={activeTemplate.baseImageUrl} 
                        alt={activeTemplate.name}
                        className="absolute inset-0 w-full h-full object-contain user-select-none pointer-events-none"
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
                      <div className="absolute inset-0 flex items-center justify-center opacity-20 user-select-none">
                        <svg viewBox="0 0 200 400" className="w-full h-full pointer-events-none">
                          <path d="M100 50 L100 150 M80 100 L120 100 M100 150 L80 250 M100 150 L120 250 M80 250 L80 350 M120 250 L120 350"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            className="text-white/30"
                          />
                          <circle cx="100" cy="30" r="20" fill="currentColor" className="text-white/30" />
                        </svg>
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
                            stroke="var(--theme-primary)"
                            strokeWidth={lineThickness}
                            markerEnd="url(#arrowhead-measurements-v2)"
                            opacity={activeTemplate?.baseImageUrl ? 0.9 : 0.5}
                          />
                        ))}
                        <defs>
                          <marker id="arrowhead-measurements-v2" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L6,3 z" fill="var(--theme-primary)" />
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
                                  ? 'bg-[color:var(--theme-secondary)] text-white ring-[color:var(--theme-secondary)]/50'
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
                        <span className="text-sm text-white/80">Stitching...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Point Input Dialog */}
      {activePointId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-[color:var(--theme-primary)]/30 rounded-2xl p-8 w-96 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {activeTemplate?.points?.find(p => p.id === activePointId)?.label || 'Enter Measurement'}
            </h3>
            <div className="space-y-4">
              <input
                type="number"
                value={pointInputValue}
                onChange={(e) => setPointInputValue(e.target.value)}
                onKeyDown={handlePointKeyDown}
                placeholder="Enter number (cm)"
                className="w-full px-4 py-3 bg-[#252525] border border-[color:var(--theme-primary)]/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[color:var(--theme-primary)] transition-colors"
                autoFocus
              />
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handlePointConfirm}
                  className="flex-1 px-4 py-2 bg-[color:var(--theme-primary)] text-white font-bold rounded-lg hover:bg-[color:var(--theme-primary)]/90 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setActivePointId(null);
                    setPointInputValue('');
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 text-white font-bold rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-white/50 text-center">Press Enter to confirm or Escape to cancel</p>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowVideoModal(false)}>
          <div className="bg-[#1a1a1a] border border-[color:var(--theme-primary)]/30 rounded-2xl p-6 w-[90%] max-w-4xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">How to Take Measurements</h3>
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
                  src={videoUrl.includes('?') ? `${videoUrl}&rel=0` : `${videoUrl}?rel=0`}
                  title="measurements-video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-[#252525] p-8 text-center">
                <p className="text-white/60">No video guide available for this product.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Debug Block - Collapsible */}
      <div className="max-w-7xl mx-auto px-6 pb-10">
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

      {/* Template Save/Load Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl border border-white/10 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Measurement Templates</h3>
              <button onClick={() => { setShowTemplateModal(false); setTemplateName(''); }} className="text-white/50 hover:text-white transition-colors">
                ✕
              </button>
            </div>

            {/* Save New Template Section */}
            <div className="space-y-2 border-b border-white/10 pb-4">
              <label className="text-sm font-semibold text-white/70">Save Current Measurements</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name..."
                  className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
                />
                <button
                  onClick={handleSaveTemplate}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Load Template Section */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/70">Load Template</label>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {Object.entries(savedTemplates).length === 0 ? (
                  <p className="text-white/40 text-sm text-center py-4">No saved templates</p>
                ) : (
                  Object.entries(savedTemplates).map(([id, template]) => (
                    <div key={id} className="flex items-center justify-between bg-zinc-800 rounded-lg p-3 hover:bg-zinc-700 transition-colors">
                      <button
                        onClick={() => handleLoadTemplate(id)}
                        className="flex-1 text-left"
                      >
                        <p className="text-white font-medium text-sm">{template.name}</p>
                        <p className="text-white/40 text-xs">{Object.keys(template.measurements).length} measurements</p>
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(id)}
                        className="text-red-400 hover:text-red-300 text-sm px-2"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClientMeasurementsV2;
