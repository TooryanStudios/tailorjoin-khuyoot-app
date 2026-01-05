import React from 'react';
import { createPortal } from 'react-dom';
import { Anchor, HelpCircle, Menu, Save, X, Download } from 'lucide-react';
import type { TryOnResponse } from '../../types/tryon';
import { ImageComparisonSlider } from './ImageComparisonSlider';
import { GenerationsRail, type GenerationItem } from '../../../pages/designerV2/components/GenerationsRail';
import { showToast } from '../../../utils/notifications';
import { GenerateButton } from './GenerateButton';

const PLACEHOLDER_BEFORE = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22600%22 viewBox=%220 0 400 600%22%3E%3Cdefs%3E%3ClinearGradient id=%22grad1%22 x1=%220%25%22 y1=%220%25%22 x2=%220%25%22 y2=%22100%25%22%3E%3Cstop offset=%220%25%22 style=%22stop-color:%23f1f5f9;stop-opacity:1%22 /%3E%3Cstop offset=%22100%25%22 style=%22stop-color:%23e2e8f0;stop-opacity:1%22 /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=%22url(%23grad1)%22 width=%22400%22 height=%22600%22/%3E%3Crect x=%2220%22 y=%2220%22 width=%22360%22 height=%22560%22 fill=%22none%22 stroke=%22%23cbd5e1%22 stroke-width=%221%22 stroke-dasharray=%228,6%22 rx=%2212%22/%3E%3Cg transform=%22translate(200,280)%22%3E%3Ccircle cx=%220%22 cy=%220%22 r=%2230%22 fill=%22%23fff%22 opacity=%220.9%22/%3E%3Cpath d=%22M-13,-6 L-13,9 L13,9 L13,-6 Z M-9,-9 L-6,-13 L6,-13 L9,-9 Z%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%221.8%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3Ccircle cx=%22-4.5%22 cy=%22-0.5%22 r=%222.2%22 fill=%22%2394a3b8%22/%3E%3Cpath d=%22M-13,4 L-4.5,0 L4.5,4 L13,0%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%221.8%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/g%3E%3Ctext x=%2250%25%22 y=%2272%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22-apple-system,BlinkMacSystemFont,Segoe UI,Arial%22 font-size=%2215%22 font-weight=%22600%22 fill=%22%2364748b%22%3E%D8%A7%D8%AE%D8%AA%D8%B1 %D8%B5%D9%88%D8%B1%D8%A9 %D9%82%D8%A8%D9%84%3C/text%3E%3Ctext x=%2250%25%22 y=%2278%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22-apple-system,BlinkMacSystemFont,Segoe UI,Arial%22 font-size=%2211%22 fill=%22%2394a3b8%22%3E%D8%A7%D8%B6%D8%BA%D8%B7 %D8%B9%D9%84%D9%89 %D8%A7%D9%84%D8%B2%D8%B1%3C/text%3E%3C/svg%3E';

const PLACEHOLDER_AFTER = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22600%22 viewBox=%220 0 400 600%22%3E%3Cdefs%3E%3ClinearGradient id=%22grad2%22 x1=%220%25%22 y1=%220%25%22 x2=%220%25%22 y2=%22100%25%22%3E%3Cstop offset=%220%25%22 style=%22stop-color:%23faf5ff;stop-opacity:1%22 /%3E%3Cstop offset=%22100%25%22 style=%22stop-color:%23f3e8ff;stop-opacity:1%22 /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=%22url(%23grad2)%22 width=%22400%22 height=%22600%22/%3E%3Crect x=%2220%22 y=%2220%22 width=%22360%22 height=%22560%22 fill=%22none%22 stroke=%22%23d8b4fe%22 stroke-width=%221%22 stroke-dasharray=%228,6%22 rx=%2212%22/%3E%3Cg transform=%22translate(200,280)%22%3E%3Ccircle cx=%220%22 cy=%220%22 r=%2230%22 fill=%22%23fff%22 opacity=%220.95%22/%3E%3Cpath d=%22M-13,-6 L-13,9 L13,9 L13,-6 Z M-9,-9 L-6,-13 L6,-13 L9,-9 Z%22 fill=%22none%22 stroke=%22%23a855f7%22 stroke-width=%221.8%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3Ccircle cx=%22-4.5%22 cy=%22-0.5%22 r=%222.2%22 fill=%22%23a855f7%22/%3E%3Cpath d=%22M-13,4 L-4.5,0 L4.5,4 L13,0%22 fill=%22none%22 stroke=%22%23a855f7%22 stroke-width=%221.8%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/g%3E%3Ctext x=%2250%25%22 y=%2272%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22-apple-system,BlinkMacSystemFont,Segoe UI,Arial%22 font-size=%2215%22 font-weight=%22600%22 fill=%22%237c3aed%22%3E%D8%A7%D8%AE%D8%AA%D8%B1 %D8%B5%D9%88%D8%B1%D8%A9 %D8%A8%D8%B9%D8%AF%3C/text%3E%3Ctext x=%2250%25%22 y=%2278%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22-apple-system,BlinkMacSystemFont,Segoe UI,Arial%22 font-size=%2211%22 fill=%22%23a78bfa%22%3E%D9%86%D8%AA%D9%8A%D8%AC%D8%A9 %D8%A7%D9%84%D8%AA%D8%AC%D8%B1%D8%A8%D8%A9%3C/text%3E%3C/svg%3E';

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
  const menuRootRef = React.useRef<HTMLDivElement | null>(null);

  // Close the burger menu on outside click / Escape.
  // Avoids rendering an invisible full-screen overlay that can block clicks after HMR.
  React.useEffect(() => {
    if (!showMenu) return;

    const onPointerDown = (event: PointerEvent) => {
      const root = menuRootRef.current;
      if (!root) return;
      const target = event.target as Node | null;
      if (target && root.contains(target)) return;
      setShowMenu(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowMenu(false);
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showMenu]);

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
    const scrollY = window.scrollY;

    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;
    const prevOverflow = document.body.style.overflow;
    const prevOverflowY = document.body.style.overflowY;
    const prevPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = '';
    document.body.style.overflowY = 'scroll';
    document.body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      document.body.style.overflow = prevOverflow;
      document.body.style.overflowY = prevOverflowY;
      document.body.style.paddingRight = prevPaddingRight;
      window.scrollTo(0, scrollY);
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
      setSliderPosition((prev) => (prev === 100 ? prev : 100));
    } else if (effectiveResultImageSrc) {
      // When result arrives, move slider to reveal after image (0%)
      setTimeout(() => {
        setSliderPosition((prev) => (prev === 0 ? prev : 0));
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
    <div ref={ref} className="relative">
      <div className="grid grid-cols-1 gap-3 items-start lg:grid-cols-[360px_minmax(0,1fr)_200px] lg:gap-4">
        {/* ========================================
            PANEL 1: CONTROLS (Mobile: top, Desktop: left sidebar)
            ======================================== */}
        <div className="lg:col-start-1 lg:row-start-1 relative z-10">
          <div className="space-y-3">
            {/* CTA: always rendered (no mount-swap). Desktop: keep near bottom of sidebar. */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 lg:sticky lg:bottom-3 space-y-1">
              {/* Top row previews (Mobile + Desktop) */}
              <div className="grid grid-cols-2 gap-1 lg:grid-cols-[180px_160px] lg:justify-center">
                <button
                  type="button"
                  onClick={() => {
                    console.log('[TryOnResult] Template picker button clicked', { onOpenTemplatePicker });
                    onOpenTemplatePicker?.();
                  }}
                  disabled={!onOpenTemplatePicker}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-right hover:border-emerald-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  aria-label="اختيار القالب"
                  title="اختيار القالب"
                >
                  <div className="relative w-full aspect-[3/4] lg:aspect-auto lg:h-[160px] xl:h-[160px] overflow-hidden rounded-xl">
                    {originalImageUrl ? (
                      <img
                        src={originalImageUrl}
                        alt="القالب"
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="absolute inset-0 animate-pulse bg-slate-200/70 dark:bg-slate-700/60" />
                    )}                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    console.log('[TryOnResult] Fabric picker button clicked', { onOpenFabricPicker });
                    onOpenFabricPicker?.();
                  }}
                  disabled={!onOpenFabricPicker}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-right hover:border-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  aria-label="اختيار القماش"
                  title="اختيار القماش"
                >
                  <div className="relative w-full aspect-[3/4] lg:aspect-auto lg:h-[160px] xl:h-[160px] overflow-hidden rounded-xl">
                    {fabricThumbnailUrl ? (
                      <img
                        src={fabricThumbnailUrl}
                        alt="القماش"
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="absolute inset-0 animate-pulse bg-slate-200/70 dark:bg-slate-700/60" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  </div>
                  
                </button>
              </div>

              <GenerateButton
                onClick={handleRetry}
                onTestClick={() => setTestingMode((v) => !v)}
                disabled={!originalImageUrl || !fabricThumbnailUrl || (!testingMode && !onRetry)}
                loading={effectiveLoading}
                progress={typeof effectiveProgress === 'number' ? effectiveProgress : undefined}
                isTestMode={testingMode}
              />
            </div>
          </div>
        </div>

        {/* ========================================
            PANEL 2: COMPARISON (Mobile: below controls, Desktop: right)
            ======================================== */}
        <div className="lg:col-start-2 lg:row-start-1 relative z-0">
          <div ref={comparisonPanelRef} className="w-full max-w-[520px] mx-auto space-y-3">
            <div className="tryon-comparison-panel rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">المقارنة</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">حدّد القماش/النتيجة</div>
                </div>
                <div className="flex gap-2">
                {/* Burger menu */}
                <div ref={menuRootRef} className="relative">
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
            </div>

            <div className="w-full aspect-[2/3] lg:aspect-[4/3]">
              <ImageComparisonSlider
                className="h-full w-full"
                beforeImage={comparisonBeforeImage || originalImageUrl || PLACEHOLDER_BEFORE}
                afterImage={comparisonAfterImage || effectiveResultImageSrc || PLACEHOLDER_AFTER}
                beforeLabel={comparisonBeforeLabel || 'القماش'}
                afterLabel={comparisonAfterLabel || 'النتيجة'}
                animateReveal={false}
                controlledPosition={sliderPosition}
                isLoading={effectiveLoading}
                fit={(comparisonBeforeImage || originalImageUrl || '').startsWith('data:image/svg+xml') || 
                     (comparisonAfterImage || effectiveResultImageSrc || '').startsWith('data:image/svg+xml') 
                     ? 'contain' : 'cover'}
              />
            </div>
          </div>
        </div>

        {/* ========================================
            PANEL 3: GENERATIONS RAIL (Desktop right sidebar)
            ======================================== */}
        <div className="hidden lg:block lg:col-start-3 lg:row-start-1 relative z-0">
          {hasModalGenerations ? (
            <div className="sticky top-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 backdrop-blur p-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-black text-slate-900 dark:text-white">إبداعاتي ({modalGenerations?.length ?? 0})</div>
                </div>
                <div className="flex flex-col gap-1 max-h-[calc(100vh-120px)] overflow-y-auto pr-1">
                  {modalGenerations?.slice(0, 15).map((g) => {
                    const key = `${g.jobId}:${g.url}`;
                    return (
                      <div
                        key={key}
                        onClick={() => onModalGenerationOpen?.(g.url)}
                        className="group relative w-full aspect-[3/4] shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:opacity-95 cursor-pointer"
                        title="عرض الصورة"
                      >
                        <img
                          src={g.thumbnailUrl || g.url}
                          alt="Generation thumbnail"
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {Array.from({ length: placeholderCount }).map((_, idx) => (
                    <div
                      key={`gen-placeholder-${idx}`}
                      className="w-full aspect-[3/4] shrink-0 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40"
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ========================================
          PANEL 4: SLIDE-OVER DRAWER (PORTAL)
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
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">المقارنة</h3>
                    </div>
                    <ImageComparisonSlider
                      beforeImage={comparisonBeforeImage || originalImageUrl}
                      afterImage={comparisonAfterImage || resultImageSrc || originalImageUrl || ''}
                      beforeLabel={comparisonBeforeLabel || 'الأصل'}
                      afterLabel={comparisonAfterLabel || 'بعد القماش'}
                      animateReveal={false}
                    />
                  </div>

                  {hasModalGenerations ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">النتائج</h3>
                      </div>
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
export const TryOnResult = TryOnResultBase;
