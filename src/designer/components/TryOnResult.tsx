import React from 'react';
import { createPortal } from 'react-dom';
import { Anchor, HelpCircle, Menu, Save, X, Download } from 'lucide-react';
import type { TryOnResponse } from '../../types/tryon';
import { ImageComparisonSlider } from './ImageComparisonSlider';
import { GenerationsRail, type GenerationItem } from '../../../pages/designerV2/components/GenerationsRail';
import { showToast } from '../../../utils/notifications';

type TryOnResultProps = {
  result: TryOnResponse | null;
  loading: boolean;
  progress?: number;
  originalImageUrl?: string;
  fabricThumbnailUrl?: string | null;

  comparisonBeforeImage?: string;
  comparisonAfterImage?: string;
  comparisonBeforeLabel?: string;
  comparisonAfterLabel?: string;

  onSaveToProject?: () => void;
  animateReveal?: boolean;
  onRetry?: () => void;
  onHelp?: () => void;
  onToggleAdminAnchors?: () => void;
  showAdminAnchors?: boolean;

  modalGenerations?: GenerationItem[];
  modalGenerationsPlaceholderCount?: number;
  onModalGenerationOpen?: (url: string) => void;
  onModalGenerationSetBefore?: (url: string) => void;
  onModalGenerationSetAfter?: (url: string) => void;

  onOpenTemplatePicker?: () => void;
  onOpenFabricPicker?: () => void;
};

function TryOnResultComponent(props: TryOnResultProps, ref: React.Ref<HTMLDivElement>) {
  const {
    result,
    loading,
    progress,
    originalImageUrl,
    fabricThumbnailUrl,
    comparisonBeforeImage,
    comparisonAfterImage,
    comparisonBeforeLabel,
    comparisonAfterLabel,
    onSaveToProject,
    onRetry,
    onHelp,
    onToggleAdminAnchors,
    showAdminAnchors = false,
    modalGenerations,
    modalGenerationsPlaceholderCount,
    onModalGenerationOpen,
    onModalGenerationSetBefore,
    onModalGenerationSetAfter,
    onOpenTemplatePicker,
    onOpenFabricPicker,
  } = props;

  const [showDrawer, setShowDrawer] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const [showThumbnailBar, setShowThumbnailBar] = React.useState(true);
  const [sliderPosition, setSliderPosition] = React.useState<number | undefined>(undefined);
  const [testingMode, setTestingMode] = React.useState(true); // Default: disabled real generation
  const [mockLoading, setMockLoading] = React.useState(false);
  const [mockProgress, setMockProgress] = React.useState(0);
  const [mockResult, setMockResult] = React.useState<TryOnResponse | null>(null);

  const comparisonPanelRef = React.useRef<HTMLDivElement | null>(null);
  const prevLoadingRef = React.useRef<boolean>(loading || mockLoading);
  const lastAutoScrollKeyRef = React.useRef<string | null>(null);

  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  const lastErrorRef = React.useRef<string | null>(null);

  const simulateMockGeneration = React.useCallback(() => {
    if (mockLoading) return;
    setMockLoading(true);
    setMockProgress(0);
    setMockResult(null);

    const progressInterval = setInterval(() => {
      setMockProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(progressInterval);
      setMockProgress(100);
      
      // Create mock result with grayscale applied to original image
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw the original image
          ctx.drawImage(img, 0, 0);
          
          // Get image data and apply grayscale manually
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;     // Red
            data[i + 1] = avg; // Green
            data[i + 2] = avg; // Blue
            // data[i + 3] is alpha, leave unchanged
          }
          
          ctx.putImageData(imageData, 0, 0);
          const mockImageUrl = canvas.toDataURL('image/png');
          setMockResult({
            jobId: `mock-${Date.now()}`,
            status: 'completed',
            resultImageUrl: mockImageUrl,
            resultImageDataUrl: mockImageUrl,
          });
        }
        setMockLoading(false);
      };
      img.onerror = () => {
        // Fallback: just use original image
        setMockResult({
          jobId: `mock-${Date.now()}`,
          status: 'completed',
          resultImageUrl: originalImageUrl || '',
          resultImageDataUrl: originalImageUrl || '',
        });
        setMockLoading(false);
      };
      img.src = originalImageUrl || '';
    }, 3000);
  }, [mockLoading, originalImageUrl]);

  const scrollComparisonPanelToViewportTop = React.useCallback(() => {
    const target = comparisonPanelRef.current;
    if (!target) return;

    const findScrollContainer = (node: HTMLElement): HTMLElement | null => {
      let current: HTMLElement | null = node.parentElement;
      while (current) {
        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY;
        const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight;
        if (isScrollable) return current;
        current = current.parentElement;
      }
      return null;
    };

    const container = findScrollContainer(target);
    const offset = -16; // Add breathing room to show panel header/icons
    
    if (!container) {
      const y = target.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    } else {
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const y = targetRect.top - containerRect.top + container.scrollTop + offset;
      container.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }, []);

  const handleRetry = React.useCallback(() => {
    // Scroll to comparison panel for both testing and real modes
    scrollComparisonPanelToViewportTop();

    if (testingMode) {
      simulateMockGeneration();
    } else {
      onRetry?.();
    }
  }, [testingMode, simulateMockGeneration, onRetry, scrollComparisonPanelToViewportTop]);

  const effectiveLoading = testingMode ? mockLoading : loading;
  const effectiveProgress = testingMode ? mockProgress : progress;
  const effectiveResult = testingMode ? mockResult : result;
  const effectiveResultImageSrc = effectiveResult?.status !== 'failed' 
    ? (effectiveResult?.resultImageUrl || effectiveResult?.resultImageDataUrl) 
    : null;

  React.useEffect(() => {
    if (effectiveResult?.status !== 'failed') return;
    const message = effectiveResult.error || 'حدث خطأ غير معروف';
    if (lastErrorRef.current === message) return;
    lastErrorRef.current = message;
    showToast('خطأ في إنشاء الصورة', message, 'error');
  }, [effectiveResult?.status, effectiveResult?.error]);

  React.useEffect(() => {
    if (!showDrawer) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDrawer(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [showDrawer]);

  const resultImageSrc = result?.status !== 'failed' ? (result?.resultImageUrl || result?.resultImageDataUrl) : null;
  const hasResultImage = Boolean(effectiveResultImageSrc);
  const hasComparisonPanel = Boolean(comparisonBeforeImage || comparisonAfterImage);
  const canUseResultImageActions = hasResultImage;
  const canOpenDrawer = Boolean(hasResultImage || originalImageUrl || hasComparisonPanel);

  // Control slider position based on loading state
  React.useEffect(() => {
    if (effectiveLoading) {
      // When generation starts, move slider to show only before image (100%)
      setSliderPosition(100);
    } else if (effectiveResultImageSrc) {
      // When result arrives, move slider to reveal after image (0%)
      setTimeout(() => {
        setSliderPosition(0);
        // After animation completes, release control to allow free sliding
        setTimeout(() => setSliderPosition(undefined), 1000);
      }, 300);
    }
  }, [effectiveLoading, effectiveResultImageSrc]);

  const hasModalGenerations = Array.isArray(modalGenerations) && modalGenerations.length > 0;
  const placeholderCount = modalGenerationsPlaceholderCount ?? Math.max(0, 8 - (modalGenerations?.length ?? 0));

  const handleDownload = (href: string, filename: string) => {
    try {
      const link = document.createElement('a');
      link.href = href;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download:', error);
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div ref={ref} className="space-y-3 relative">
      {/* ========================================
          PANEL 1: RESULT PANEL
          ======================================== */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 relative">
        <div className="p-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onOpenTemplatePicker?.()}
              disabled={!onOpenTemplatePicker}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-2 text-right hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="اختيار القالب"
              title="اختيار القالب"
            >
              <div className="text-xs font-bold text-slate-800 dark:text-white">القالب</div>
              <div className="mt-2 aspect-[3/4] w-full rounded-lg bg-slate-200/70 dark:bg-slate-700/60 overflow-hidden">
                {originalImageUrl ? (
                  <img src={originalImageUrl} alt="القالب" className="w-full h-full object-cover" />
                ) : null}
              </div>
            </button>

            <button
              type="button"
              onClick={() => onOpenFabricPicker?.()}
              disabled={!onOpenFabricPicker}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-2 text-right hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="اختيار القماش"
              title="اختيار القماش"
            >
              <div className="text-xs font-bold text-slate-800 dark:text-white">القماش</div>
              <div className="mt-2 aspect-[3/4] w-full rounded-lg bg-slate-200/70 dark:bg-slate-700/60 overflow-hidden">
                {fabricThumbnailUrl ? (
                  <img src={fabricThumbnailUrl} alt="القماش" className="w-full h-full object-cover" />
                ) : null}
              </div>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleRetry()}
            disabled={!onRetry || effectiveLoading}
            className="mt-3 w-full rounded-xl bg-violet-600 text-white px-4 py-3 text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1.5 relative overflow-hidden"
            aria-label="ابدأ التوليد"
            title="ابدأ التوليد"
          >
            {effectiveLoading && typeof effectiveProgress === 'number' && effectiveProgress > 0 ? (
              <div className="absolute inset-0 bg-violet-500/30" style={{ width: `${effectiveProgress}%`, transition: 'width 0.3s ease-out' }} />
            ) : null}
            <div className="relative z-10 flex items-center gap-2">
              {effectiveLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                  {typeof effectiveProgress === 'number' && effectiveProgress > 0 ? (
                    <span>جارِ التوليد... {Math.round(effectiveProgress)}%</span>
                  ) : (
                    <span>جارِ التوليد...</span>
                  )}
                </>
              ) : (
                'ابدأ السحر'
              )}
            </div>
          </button>
        </div>
      </div>

      {/* ========================================
          PANEL 2: COMPARISON PANEL
          ======================================== */}
      <div ref={comparisonPanelRef} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-white">المقارنة | Comparison Panel</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">حدّد صور قبل/بعد</div>
            </div>
            <div className="flex gap-2">
              {/* Testing mode toggle */}
              <button
                type="button"
                onClick={() => setTestingMode((v) => !v)}
                className={`p-2 rounded-xl transition-all flex items-center justify-center text-xs font-bold ${
                  testingMode 
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/50' 
                    : 'bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/50'
                }`}
                title={testingMode ? 'وضع الاختبار مفعّل' : 'وضع الإنتاج مفعّل'}
                aria-label={testingMode ? 'Testing Mode' : 'Production Mode'}
              >
                {testingMode ? 'تجربة' : 'حقيقي'}
              </button>

              {/* Burger menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMenu((v) => !v)}
                  className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:opacity-90 transition-opacity flex items-center justify-center"
                  title="القائمة"
                  aria-label="القائمة"
                >
                  {showMenu ? <X size={18} /> : <Menu size={18} />}
                </button>

                {showMenu ? (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-20">
                      <div className="p-2 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (!canOpenDrawer) {
                              setShowMenu(false);
                              return;
                            }
                            setShowDrawer(true);
                            setShowMenu(false);
                          }}
                          disabled={!canOpenDrawer}
                          className="w-full px-3 py-2.5 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                            />
                          </svg>
                          عرض المقارنة
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (effectiveResultImageSrc) {
                              handleDownload(effectiveResultImageSrc, `khuyoot-tryon-${effectiveResult?.jobId || Date.now()}.png`);
                            }
                            setShowMenu(false);
                          }}
                          disabled={!canUseResultImageActions}
                          className="w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 text-right disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download size={16} />
                          تحميل الصورة
                        </button>

                        {onSaveToProject ? (
                          <button
                            type="button"
                            onClick={() => {
                              onSaveToProject();
                              setShowMenu(false);
                            }}
                            className="w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 text-right"
                          >
                            <Save size={16} />
                            حفظ إلى المشروع
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
              {onHelp ? (
                <button
                  type="button"
                  onClick={onHelp}
                  className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:opacity-90 transition-opacity flex items-center justify-center"
                  title="مساعدة"
                  aria-label="مساعدة"
                >
                  <HelpCircle size={18} />
                </button>
              ) : null}

              {onToggleAdminAnchors ? (
                <button
                  type="button"
                  onClick={onToggleAdminAnchors}
                  className={
                    `p-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:opacity-90 transition-opacity flex items-center justify-center ` +
                    (showAdminAnchors ? 'text-amber-600' : 'text-slate-800 dark:text-white')
                  }
                  title="وسوم المشرف"
                  aria-label="وسوم المشرف"
                >
                  <Anchor size={18} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="relative">
            <ImageComparisonSlider
              beforeImage={comparisonBeforeImage || originalImageUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22600%22%3E%3Cdefs%3E%3ClinearGradient id=%22grad1%22 x1=%220%25%22 y1=%220%25%22 x2=%220%25%22 y2=%22100%25%22%3E%3Cstop offset=%220%25%22 style=%22stop-color:%23f1f5f9;stop-opacity:1%22 /%3E%3Cstop offset=%22100%25%22 style=%22stop-color:%23e2e8f0;stop-opacity:1%22 /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=%22url(%23grad1)%22 width=%22400%22 height=%22600%22/%3E%3Crect x=%2215%22 y=%2215%22 width=%22370%22 height=%22570%22 fill=%22none%22 stroke=%22%23cbd5e1%22 stroke-width=%222%22 stroke-dasharray=%2210,8%22 rx=%2212%22/%3E%3Cg transform=%22translate(200,240)%22%3E%3Ccircle cx=%220%22 cy=%220%22 r=%2245%22 fill=%22%23fff%22 opacity=%220.9%22/%3E%3Cpath d=%22M-20,-10 L-20,15 L20,15 L20,-10 Z M-15,-15 L-10,-20 L10,-20 L15,-15 Z%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3Ccircle cx=%22-8%22 cy=%22-2%22 r=%224%22 fill=%22%2394a3b8%22/%3E%3Cpath d=%22M-20,8 L-8,0 L8,8 L20,0%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/g%3E%3Ctext x=%2250%25%22 y=%2270%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22-apple-system,BlinkMacSystemFont,Segoe UI,Arial%22 font-size=%2220%22 font-weight=%22600%22 fill=%22%2364748b%22%3E%D8%A7%D8%AE%D8%AA%D8%B1 %D8%B5%D9%88%D8%B1%D8%A9 %D9%82%D8%A8%D9%84%3C/text%3E%3Ctext x=%2250%25%22 y=%2277%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22-apple-system,BlinkMacSystemFont,Segoe UI,Arial%22 font-size=%2214%22 fill=%22%2394a3b8%22%3E%D8%A7%D8%B6%D8%BA%D8%B7 %D8%B9%D9%84%D9%89 %D8%A7%D9%84%D8%B2%D8%B1%3C/text%3E%3C/svg%3E'}
              afterImage={comparisonAfterImage || effectiveResultImageSrc || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22600%22%3E%3Cdefs%3E%3ClinearGradient id=%22grad2%22 x1=%220%25%22 y1=%220%25%22 x2=%220%25%22 y2=%22100%25%22%3E%3Cstop offset=%220%25%22 style=%22stop-color:%23faf5ff;stop-opacity:1%22 /%3E%3Cstop offset=%22100%25%22 style=%22stop-color:%23f3e8ff;stop-opacity:1%22 /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=%22url(%23grad2)%22 width=%22400%22 height=%22600%22/%3E%3Crect x=%2215%22 y=%2215%22 width=%22370%22 height=%22570%22 fill=%22none%22 stroke=%22%23d8b4fe%22 stroke-width=%222%22 stroke-dasharray=%2210,8%22 rx=%2212%22/%3E%3Cg transform=%22translate(200,240)%22%3E%3Ccircle cx=%220%22 cy=%220%22 r=%2245%22 fill=%22%23fff%22 opacity=%220.95%22/%3E%3Cpath d=%22M-20,-10 L-20,15 L20,15 L20,-10 Z M-15,-15 L-10,-20 L10,-20 L15,-15 Z%22 fill=%22none%22 stroke=%22%23a855f7%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3Ccircle cx=%22-8%22 cy=%22-2%22 r=%224%22 fill=%22%23a855f7%22/%3E%3Cpath d=%22M-20,8 L-8,0 L8,8 L20,0%22 fill=%22none%22 stroke=%22%23a855f7%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/g%3E%3Ctext x=%2250%25%22 y=%2270%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22-apple-system,BlinkMacSystemFont,Segoe UI,Arial%22 font-size=%2220%22 font-weight=%22600%22 fill=%22%237c3aed%22%3E%D8%A7%D8%AE%D8%AA%D8%B1 %D8%B5%D9%88%D8%B1%D8%A9 %D8%A8%D8%B9%D8%AF%3C/text%3E%3Ctext x=%2250%25%22 y=%2277%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22-apple-system,BlinkMacSystemFont,Segoe UI,Arial%22 font-size=%2214%22 fill=%22%23a78bfa%22%3E%D9%86%D8%AA%D9%8A%D8%AC%D8%A9 %D8%A7%D9%84%D8%AA%D8%AC%D8%B1%D8%A8%D8%A9%3C/text%3E%3C/svg%3E'}
              beforeLabel={comparisonBeforeLabel || 'قبل'}
              afterLabel={comparisonAfterLabel || 'بعد'}
              animateReveal={false}
              controlledPosition={sliderPosition}
              isLoading={effectiveLoading}
            />

            {/* Floating Thumbnail Selector Bar */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 w-full max-w-xs px-3">
              <div className="bg-slate-950/98 dark:bg-black/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-800/50 dark:border-slate-700/50 overflow-hidden">
                <div className="flex justify-center pt-1 pb-0.5">
                  <button
                    type="button"
                    onClick={() => setShowThumbnailBar((v) => !v)}
                    className="p-1 rounded-full hover:bg-slate-800/50 dark:hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
                    title={showThumbnailBar ? 'إخفاء' : 'إظهار'}
                    aria-label={showThumbnailBar ? 'إخفاء' : 'إظهار'}
                  >
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${showThumbnailBar ? '' : 'rotate-180'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {showThumbnailBar && (
                  <div className="px-2 pb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenTemplatePicker?.()}
                        className="flex-1 group relative overflow-hidden rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all border border-slate-700/50 hover:border-violet-500/50"
                      >
                        <div className="aspect-[3/4] flex items-center justify-center p-1.5">
                          {originalImageUrl ? (
                            <img src={originalImageUrl} alt="القالب" className="w-full h-full object-cover rounded-md" />
                          ) : (
                            <div className="text-center">
                              <svg
                                className="w-6 h-6 mx-auto text-slate-400 group-hover:text-violet-400 transition-colors"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <div className="text-[9px] text-slate-400 mt-0.5 font-medium">القالب</div>
                            </div>
                          )}
                        </div>
                        dddddd
                        {originalImageUrl && (
                          <div className="absolute bottom-0.5 left-0.5 right-0.5 bg-black/60 backdrop-blur-sm rounded px-1 py-0.5">
                            <div className="text-[8px] text-white font-medium text-center">القالب</div>
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenFabricPicker?.()}
                        className="flex-1 group relative overflow-hidden rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all border border-slate-700/50 hover:border-violet-500/50"
                      >
                        <div className="aspect-[3/4] flex items-center justify-center p-1.5">
                          {fabricThumbnailUrl ? (
                            <img src={fabricThumbnailUrl} alt="القماش" className="w-full h-full object-cover rounded-md" />
                          ) : (
                            <div className="text-center">
                              <svg
                                className="w-6 h-6 mx-auto text-slate-400 group-hover:text-violet-400 transition-colors"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                                />
                              </svg>
                              <div className="text-[9px] text-slate-400 mt-0.5 font-medium">القماش</div>
                            </div>
                          )}
                        </div>
                        {fabricThumbnailUrl && (
                          <div className="absolute bottom-0.5 left-0.5 right-0.5 bg-black/60 backdrop-blur-sm rounded px-1 py-0.5">
                            <div className="text-[8px] text-white font-medium text-center">القماش</div>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>

      {/* ========================================
          PANEL 3: SLIDE-OVER DRAWER (PORTAL)
          ======================================== */}
      {showDrawer && portalTarget
        ? createPortal(
            <div className="fixed inset-0 z-[300] flex" aria-modal="true" role="dialog">
              <div
                className="flex-1 bg-black/60 backdrop-blur-[2px]"
                onClick={() => setShowDrawer(false)}
                aria-label="إغلاق المقارنة"
              />
              <aside className="relative w-full max-w-[520px] h-full bg-slate-950 text-white shadow-2xl border-l border-white/10 flex flex-col">
                <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold tracking-wide">سحب المقارنة</div>
                    <div className="text-[11px] text-white/60">راجع قبل/بعد مع آخر النتائج</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDrawer(false)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    title="إغلاق"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="bg-white/5 rounded-2xl p-2 border border-white/10">
                    <ImageComparisonSlider
                      beforeImage={comparisonBeforeImage || originalImageUrl}
                      afterImage={comparisonAfterImage || (resultImageSrc ?? undefined)}
                      beforeLabel={comparisonBeforeLabel || 'الأصل'}
                      afterLabel={comparisonAfterLabel || 'بعد القماش'}
                      animateReveal={false}
                    />
                  </div>

                  {hasModalGenerations ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
                      <GenerationsRail
                        generations={modalGenerations ?? []}
                        onOpenImage={onModalGenerationOpen ?? (() => {})}
                        onSetBefore={onModalGenerationSetBefore}
                        onSetAfter={onModalGenerationSetAfter}
                        placeholderCount={placeholderCount}
                      />
                    </div>
                  ) : null}
                </div>
              </aside>
            </div>,
            portalTarget
          )
        : null}
    </div>
  );
}

const TryOnResultBase = React.forwardRef(TryOnResultComponent);
TryOnResultBase.displayName = 'TryOnResult';
export const TryOnResult = React.memo(TryOnResultBase);
