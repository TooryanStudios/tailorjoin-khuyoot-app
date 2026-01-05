import React from 'react';
import { createPortal } from 'react-dom';
import { Anchor, HelpCircle, Menu, Save, X, Download, Wand2 } from 'lucide-react';
import type { TryOnResponse } from '../../types/tryon';
import { ImageComparisonSlider } from './ImageComparisonSlider';
import { GenerationsRail, type GenerationItem } from '../../../pages/designerV2/components/GenerationsRail';
import { showToast } from '../../../utils/notifications';

// Dark theme placeholders
const PLACEHOLDER_BEFORE = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22600%22 viewBox=%220 0 400 600%22%3E%3Cdefs%3E%3ClinearGradient id=%22grad1%22 x1=%220%25%22 y1=%220%25%22 x2=%220%25%22 y2=%22100%25%22%3E%3Cstop offset=%220%25%22 style=%22stop-color:%231e293b;stop-opacity:1%22 /%3E%3Cstop offset=%22100%25%22 style=%22stop-color:%230f172a;stop-opacity:1%22 /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=%22url(%23grad1)%22 width=%22400%22 height=%22600%22/%3E%3Crect x=%2220%22 y=%2220%22 width=%22360%22 height=%22560%22 fill=%22none%22 stroke=%22%23475569%22 stroke-width=%221%22 stroke-dasharray=%228,6%22 rx=%2212%22/%3E%3Cg transform=%22translate(200,280)%22%3E%3Ccircle cx=%220%22 cy=%220%22 r=%2230%22 fill=%22%23334155%22 opacity=%220.9%22/%3E%3Cpath d=%22M-13,-6 L-13,9 L13,9 L13,-6 Z M-9,-9 L-6,-13 L6,-13 L9,-9 Z%22 fill=%22none%22 stroke=%2364748b%22 stroke-width=%221.8%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3Ccircle cx=%22-4.5%22 cy=%22-0.5%22 r=%222.2%22 fill=%2264748b%22/%3E%3Cpath d=%22M-13,4 L-4.5,0 L4.5,4 L13,0%22 fill=%22none%22 stroke=%2264748b%22 stroke-width=%221.8%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/g%3E%3Ctext x=%2250%25%22 y=%2272%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22-apple-system,BlinkMacSystemFont,Segoe UI,Arial%22 font-size=%2215%22 font-weight=%22600%22 fill=%22%23cbd5e1%22%3E%D8%A7%D8%AE%D8%AA%D8%B1 %D8%B5%D9%88%D8%B1%D8%A9 %D9%82%D8%A8%D9%84%3C/text%3E%3Ctext x=%2250%25%22 y=%2278%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22-apple-system,BlinkMacSystemFont,Segoe UI,Arial%22 font-size=%2211%22 fill=%2364748b%22%3E%D8%A7%D8%B6%D8%BA%D8%B7 %D8%B9%D9%84%D9%89 %D8%A7%D9%84%D8%B2%D8%B1%3C/text%3E%3C/svg%3E';

const PLACEHOLDER_AFTER = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22600%22 viewBox=%220 0 400 600%22%3E%3Cdefs%3E%3ClinearGradient id=%22grad2%22 x1=%220%25%22 y1=%220%25%22 x2=%220%25%22 y2=%22100%25%22%3E%3Cstop offset=%220%25%22 style=%22stop-color:%232d1b4e;stop-opacity:1%22 /%3E%3Cstop offset=%22100%25%22 style=%22stop-color:%231e1534;stop-opacity:1%22 /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=%22url(%23grad2)%22 width=%22400%22 height=%22600%22/%3E%3Crect x=%2220%22 y=%2220%22 width=%22360%22 height=%22560%22 fill=%22none%22 stroke=%22%236b21a8%22 stroke-width=%221%22 stroke-dasharray=%228,6%22 rx=%2212%22/%3E%3Cg transform=%22translate(200,280)%22%3E%3Ccircle cx=%220%22 cy=%220%22 r=%2230%22 fill=%22%23581c87%22 opacity=%220.95%22/%3E%3Cpath d=%22M-13,-6 L-13,9 L13,9 L13,-6 Z M-9,-9 L-6,-13 L6,-13 L9,-9 Z%22 fill=%22none%22 stroke=%22%23c084fc%22 stroke-width=%221.8%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3Ccircle cx=%22-4.5%22 cy=%22-0.5%22 r=%222.2%22 fill=%22%23c084fc%22/%3E%3Cpath d=%22M-13,4 L-4.5,0 L4.5,4 L13,0%22 fill=%22none%22 stroke=%22%23c084fc%22 stroke-width=%221.8%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/g%3E%3Ctext x=%2250%25%22 y=%2272%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22-apple-system,BlinkMacSystemFont,Segoe UI,Arial%22 font-size=%2215%22 font-weight=%22600%22 fill=%22%23e9d5ff%22%3E%D8%A7%D8%AE%D8%AA%D8%B1 %D8%B5%D9%88%D8%B1%D8%A9 %D8%A8%D8%B9%D8%AF%3C/text%3E%3Ctext x=%2250%25%22 y=%2278%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22-apple-system,BlinkMacSystemFont,Segoe UI,Arial%22 font-size=%2211%22 fill=%22%23c084fc%22%3E%D9%86%D8%AA%D9%8A%D8%AC%D8%A9 %D8%A7%D9%84%D8%AA%D8%AC%D8%B1%D8%A8%D8%A9%3C/text%3E%3C/svg%3E';

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

  applyMask?: boolean;
  onApplyMaskChange?: (value: boolean) => void;

  modalGenerations?: GenerationItem[];
  modalGenerationsPlaceholderCount?: number;
  onModalGenerationOpen?: (url: string) => void;
  onModalGenerationSetBefore?: (url: string) => void;
  onModalGenerationSetAfter?: (url: string) => void;

  onOpenTemplatePicker?: () => void;
  onOpenFabricPicker?: () => void;
  onOpenFabricTiling?: () => void;
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
    applyMask = true,
    onApplyMaskChange,
    modalGenerations,
    modalGenerationsPlaceholderCount,
    onModalGenerationOpen,
    onModalGenerationSetBefore,
    onModalGenerationSetAfter,
    onOpenTemplatePicker,
    onOpenFabricPicker,
    onOpenFabricTiling,
  } = props;

  const [showDrawer, setShowDrawer] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const [showThumbnailBar, setShowThumbnailBar] = React.useState(true);
  const [sliderPosition, setSliderPosition] = React.useState<number | undefined>(undefined);
  const [testingMode, setTestingMode] = React.useState(false); // Default: real generation
  const [mockLoading, setMockLoading] = React.useState(false);
  const [mockProgress, setMockProgress] = React.useState(0);
  const [mockResult, setMockResult] = React.useState<TryOnResponse | null>(null);

  const LOG_STORAGE_KEY = 'tryon_generation_logs_v1';
  const MAX_LOGS = 50;

  const [generationLogs, setGenerationLogs] = React.useState<Array<{
    id: string;
    startedAt: number;
    finishedAt?: number;
    inputDims?: string | null;
    outputDims?: string | null;
    fabricDims?: string | null;
  }>>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(LOG_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((l) => l && typeof l.startedAt === 'number' && typeof l.id === 'string')
        .map((l) => ({
          id: l.id,
          startedAt: l.startedAt,
          finishedAt: l.finishedAt,
          inputDims: l.inputDims ?? null,
          outputDims: l.outputDims ?? null,
          fabricDims: l.fabricDims ?? null,
        }))
        .slice(-MAX_LOGS);
    } catch {
      return [];
    }
  });
  const activeLogIdRef = React.useRef<string | null>(null);

  const comparisonPanelRef = React.useRef<HTMLDivElement | null>(null);
  const prevLoadingRef = React.useRef<boolean>(loading || mockLoading);
  const lastAutoScrollKeyRef = React.useRef<string | null>(null);
  const dimsCacheRef = React.useRef<Map<string, string>>(new Map());

  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  const lastErrorRef = React.useRef<string | null>(null);
  const menuRootRef = React.useRef<HTMLDivElement | null>(null);

  // Effective state values resolved once and reused to avoid TDZ issues in callbacks
  // Memoized to prevent unnecessary effect re-runs
  const effectiveLoading = React.useMemo(() => testingMode ? mockLoading : loading, [testingMode, mockLoading, loading]);
  const effectiveProgress = React.useMemo(() => testingMode ? mockProgress : progress, [testingMode, mockProgress, progress]);
  const effectiveResult = React.useMemo(() => testingMode ? mockResult : result, [testingMode, mockResult, result]);
  const effectiveResultImageSrc = React.useMemo(() => 
    effectiveResult?.status !== 'failed'
      ? (effectiveResult?.resultImageUrl || effectiveResult?.resultImageDataUrl)
      : null,
    [effectiveResult]
  );

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
    if (effectiveLoading) return; // Don't click while loading
    
    // Scroll to comparison panel
    scrollComparisonPanelToViewportTop();
    
    // Call the retry/generate function
    if (testingMode) {
      simulateMockGeneration();
    } else {
      onRetry?.();
    }
  }, [testingMode, simulateMockGeneration, onRetry, scrollComparisonPanelToViewportTop, effectiveLoading]);

  React.useEffect(() => {
    const prev = prevLoadingRef.current;

    // If loading starts, create log entry
    if (!prev && effectiveLoading && !activeLogIdRef.current) {
      const startedAt = Date.now();
      const id = `gen-${startedAt}`;
      const currentOriginalUrl = originalImageUrl;
      const currentFabricUrl = fabricThumbnailUrl || undefined;
      const imgDims = getImageDimsSafe(currentOriginalUrl);
      const fabricDims = getImageDimsSafe(currentFabricUrl);
      activeLogIdRef.current = id;
      setGenerationLogs((prevLogs) => [...prevLogs, { id, startedAt, inputDims: imgDims, fabricDims }].slice(-MAX_LOGS));
    }

    // When loading finishes, update log entry
    if (prev && !effectiveLoading && activeLogIdRef.current) {
      const finishedAt = Date.now();
      const activeId = activeLogIdRef.current;
      const currentResultUrl = effectiveResultImageSrc;
      setGenerationLogs((prevLogs) => prevLogs.map((log) => (log.id === activeId && !log.finishedAt ? { ...log, finishedAt, outputDims: getImageDimsSafe(currentResultUrl) } : log)));
      activeLogIdRef.current = null;
    }

    prevLoadingRef.current = effectiveLoading;
  }, [effectiveLoading]);

  const formatTime = React.useCallback((ts?: number) => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return '—';
    }
  }, []);

  const formatDuration = React.useCallback((start?: number, end?: number) => {
    if (!start || !end) return '...';
    const seconds = Math.max(0, (end - start) / 1000);
    return `${seconds.toFixed(1)}s`;
  }, []);

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

  const getImageDimsSafe = React.useCallback((src?: string | null) => {
    if (!src) return null;
    const cached = dimsCacheRef.current.get(src);
    if (cached) return cached;
    try {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          const value = `${img.naturalWidth}x${img.naturalHeight}`;
          dimsCacheRef.current.set(src, value);
        }
      };
      img.src = src;
      if (img.naturalWidth && img.naturalHeight) {
        const value = `${img.naturalWidth}x${img.naturalHeight}`;
        dimsCacheRef.current.set(src, value);
        return value;
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  // Persist logs to localStorage
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(generationLogs.slice(-MAX_LOGS)));
    } catch {
      // ignore
    }
  }, [generationLogs]);

  // Control slider position based on loading state
  const prevEffectiveLoadingRef = React.useRef(effectiveLoading);
  const prevEffectiveResultRef = React.useRef(effectiveResultImageSrc);
  const sliderAnimationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const sliderReleaseTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  React.useEffect(() => {
    const loadingChanged = prevEffectiveLoadingRef.current !== effectiveLoading;
    const resultChanged = prevEffectiveResultRef.current !== effectiveResultImageSrc;
    
    if (loadingChanged && effectiveLoading) {
      // When generation starts, move slider to show only before image (100%)
      // Clear any pending timeouts
      if (sliderAnimationTimeoutRef.current) clearTimeout(sliderAnimationTimeoutRef.current);
      if (sliderReleaseTimeoutRef.current) clearTimeout(sliderReleaseTimeoutRef.current);
      
      setSliderPosition(100);
    } else if (resultChanged && !effectiveLoading && effectiveResultImageSrc) {
      // When result arrives, move slider to reveal after image (0%)
      sliderAnimationTimeoutRef.current = setTimeout(() => {
        setSliderPosition(0);
        // After animation completes, release control to allow free sliding
        sliderReleaseTimeoutRef.current = setTimeout(() => {
          setSliderPosition(undefined);
        }, 1000);
      }, 300);
    }
    
    prevEffectiveLoadingRef.current = effectiveLoading;
    prevEffectiveResultRef.current = effectiveResultImageSrc;
    
    return () => {
      if (sliderAnimationTimeoutRef.current) clearTimeout(sliderAnimationTimeoutRef.current);
      if (sliderReleaseTimeoutRef.current) clearTimeout(sliderReleaseTimeoutRef.current);
    };
  }, [effectiveLoading, effectiveResultImageSrc]);

  const hasModalGenerations = Array.isArray(modalGenerations) && modalGenerations.length > 0;
  const safeModalGenerations = Array.isArray(modalGenerations) ? modalGenerations : [];
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
      <div className="grid grid-cols-1 gap-3 items-start justify-items-center lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-0 max-w-6xl mx-auto">
        {/* ========================================
            PANEL 1: CONTROLS (Mobile: top, Desktop: left sidebar)
            ======================================== */}
        <div className="lg:col-start-1 lg:row-start-1 relative z-10 w-full max-w-[320px]">
          <div className="space-y-3">
            {/* CTA: always rendered (no mount-swap). Desktop: keep near bottom of sidebar. */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 lg:sticky lg:bottom-3 space-y-1">
              <div className="text-xs text-slate-500 dark:text-slate-400 px-2 pt-1">معاينة القالب والقماش (Template & Fabric Previews)</div>
              {/* Top row previews (Mobile + Desktop) */}
              {/* Top row previews (Mobile + Desktop) */}
              <div className="mx-auto w-full max-w-[300px]">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      console.log('[TryOnResult] Template picker button clicked', { onOpenTemplatePicker });
                      onOpenTemplatePicker?.();
                    }}
                    disabled={!onOpenTemplatePicker}
                    className="rounded-xl text-right transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-label="اختيار القالب"
                    title="اختيار القالب"
                  >
                    <div className="relative w-full h-36 lg:h-[200px] overflow-hidden rounded-xl">
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-[9px] px-2 py-1 rounded-full font- z-10">
                       (Template)
                      </div>
      
                      {originalImageUrl ? (
                        <>
                          <img
                            src={originalImageUrl}
                            alt="القالب"
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                          <div className="absolute inset-x-0 bottom-0 p-2 pointer-events-none">

                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 animate-pulse bg-slate-200/70 dark:bg-slate-700/60" />
                      )}
                    </div>
                  </button>

                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        console.log('[TryOnResult] Fabric picker button clicked', { onOpenFabricPicker });
                        onOpenFabricPicker?.();
                      }}
                      disabled={!onOpenFabricPicker}
                      className="rounded-xl text-right transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      aria-label="اختيار القماش"
                      title="اختيار القماش"
                    >
                      <div className="relative w-full h-36 lg:h-[200px] overflow-hidden rounded-xl">
                        <div className="absolute top-2 left-2 bg-purple-600 text-white text-[9px] px-2 py-1 rounded-full font z-10">
                          القماش (Fabric)
                        </div>

                        {fabricThumbnailUrl ? (
                          <>
                            <img
                              src={fabricThumbnailUrl}
                              alt="القماش"
                              className="absolute inset-0 h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                            <div className="absolute inset-x-0 bottom-0 p-2 pointer-events-none">

                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 animate-pulse bg-slate-200/70 dark:bg-slate-700/60" />
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenFabricTiling?.();
                      }}
                      disabled={!fabricThumbnailUrl || !onOpenFabricTiling}
                      className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      aria-label="تكرار القماش"
                      title="تكرار القماش"
                    >
                      تكرار القماش
                    </button>
                  </div>
                </div>
              </div>



              <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={(!testingMode && !onRetry) || effectiveLoading}
                    className="w-full h-12 relative overflow-hidden rounded-xl bg-violet-600 text-white px-4 text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                    {effectiveLoading && typeof effectiveProgress === 'number' && effectiveProgress > 0 && (
                      <div
                        className="absolute inset-0 bg-violet-500/30 transition-all duration-300 ease-out"
                        style={{ width: `${effectiveProgress}%` }}
                      />
                    )}

                    <div className="relative z-10 flex items-center gap-2">
                      {effectiveLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                          <span>
                            {effectiveProgress && effectiveProgress > 0 ? `جارِ التوليد... ${Math.round(effectiveProgress)}%` : 'جارِ التوليد...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Wand2 size={18} />
                          <span>ابدأ التجربة</span>
                        </>
                      )}
                    </div>
                  </button>

                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 px-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-violet-600 cursor-pointer"
                    checked={applyMask}
                    onChange={(e) => onApplyMaskChange?.(e.target.checked)}
                  />
                  <span>تفعيل القناع (حماية الخلفية)</span>
                </label>

                <button
                  type="button"
                  onClick={() => setTestingMode((v) => !v)}
                  className={`w-full h-10 px-3 rounded-xl border text-sm font-bold transition-colors ${
                    testingMode
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                  title={testingMode ? 'وضع الاختبار' : 'وضع حقيقي'}
                >
                  {testingMode ? 'تجربة' : 'حقيقي'}
                </button>

                <div className="flex items-center justify-end gap-2">
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

                </div>
              </div>

            </div>
          </div>

          <div className="w-full mt-3 overflow-x-auto">
            <div className="min-w-[880px] rounded-xl border border-amber-500/40 bg-slate-900 text-amber-100 p-3 shadow-md">
              <div className="text-sm font-extrabold mb-2">Debug: زمن التوليد</div>
              <div className="grid grid-cols-7 gap-2 text-[11px] md:text-xs font-mono text-amber-200/80 pb-2 border-b border-amber-500/30">
                <div>#</div>
                <div>Start</div>
                <div>Finish</div>
                <div>Seconds</div>
                <div>Input</div>
                <div>Output</div>
                <div>Fabric</div>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                    {generationLogs.length === 0 ? (
                  <div className="text-[11px] md:text-xs text-amber-200/70 font-mono">لا يوجد توليد بعد</div>
                ) : (
                      generationLogs.slice().reverse().map((log, idx) => (
                    <div
                      key={log.id}
                      className="grid grid-cols-7 gap-2 text-[11px] md:text-xs font-mono rounded-lg px-2 py-1 bg-amber-500/10 border border-amber-500/20"
                    >
                      <div className="font-bold">{idx + 1}</div>
                      <div>{formatTime(log.startedAt)}</div>
                      <div>{formatTime(log.finishedAt)}</div>
                      <div className="font-semibold">{formatDuration(log.startedAt, log.finishedAt)}</div>
                      <div>{log.inputDims || '...'}</div>
                      <div>{log.outputDims || '...'}</div>
                      <div>{log.fabricDims || '...'}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>  
        {/* ========================================
            PANEL 2: COMPARISON (Mobile: below controls, Desktop: right)
            ======================================== */}
        <div className="lg:col-start-2 lg:row-start-1 relative z-0">
          <div ref={comparisonPanelRef} className="w-full max-w-[420px] mx-auto space-y-3">




            <div className="w-full aspect-[20/27] lg:aspect-[40/27]">

              <ImageComparisonSlider
                className="h-full w-full"
                beforeImage={comparisonBeforeImage || originalImageUrl || PLACEHOLDER_BEFORE}
                afterImage={comparisonAfterImage || effectiveResultImageSrc || PLACEHOLDER_AFTER}
                beforeLabel={comparisonBeforeLabel || 'القماش'}
                afterLabel={comparisonAfterLabel || 'النتيجة'}
                heightScale={0.9}
                animateReveal={false}
                controlledPosition={sliderPosition}
                isLoading={effectiveLoading}
                fit={(comparisonBeforeImage || originalImageUrl || '').startsWith('data:image/svg+xml') || 
                     (comparisonAfterImage || effectiveResultImageSrc || '').startsWith('data:image/svg+xml') 
                     ? 'contain' : 'cover'}
              />
            </div>
            {/* Generations rail (single instance, all viewports) */}
            <div>
              <GenerationsRail
                generations={safeModalGenerations}
                onOpenImage={onModalGenerationOpen ?? (() => {})}
                onSetBefore={onModalGenerationSetBefore}
                onSetAfter={onModalGenerationSetAfter}
                placeholderCount={placeholderCount}
              />
            </div>
          </div>
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
                      heightScale={0.9}
                      animateReveal={false}
                    />
                  </div>
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
