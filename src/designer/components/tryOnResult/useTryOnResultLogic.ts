import React from 'react';
import type { TryOnResponse } from '../../../types/tryon';
import type { GenerationItem } from '../../../../pages/designerV2/components/GenerationsRail';
import { showToast } from '../../../../utils/notifications';

const LOG_STORAGE_KEY = 'tryon_generation_logs_v1';
const MAX_LOGS = 50;

export interface GenerationLog {
  id: string;
  startedAt: number;
  finishedAt?: number;
  inputDims?: string | null;
  outputDims?: string | null;
  fabricDims?: string | null;
}

interface UseTryOnResultLogicProps {
  result: TryOnResponse | null;
  loading: boolean;
  progress?: number;
  originalImageUrl?: string;
  fabricThumbnailUrl?: string | null;
  onRetry?: () => void;
}

export function useTryOnResultLogic({
  result,
  loading,
  progress,
  originalImageUrl,
  fabricThumbnailUrl,
  onRetry,
}: UseTryOnResultLogicProps) {
  // UI State
  const [showDrawer, setShowDrawer] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const [showThumbnailBar, setShowThumbnailBar] = React.useState(true);
  const [sliderPosition, setSliderPosition] = React.useState<number | undefined>(undefined);
  const [showDevUi, setShowDevUi] = React.useState(false);
  
  // Testing mode state
  const [testingMode, setTestingMode] = React.useState(false);
  const [mockLoading, setMockLoading] = React.useState(false);
  const [mockProgress, setMockProgress] = React.useState(0);
  const [mockResult, setMockResult] = React.useState<TryOnResponse | null>(null);

  // Generation logs
  const [generationLogs, setGenerationLogs] = React.useState<GenerationLog[]>(() => {
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

  // Refs
  const comparisonPanelRef = React.useRef<HTMLDivElement | null>(null);
  const prevLoadingRef = React.useRef<boolean>(loading || mockLoading);
  const lastAutoScrollKeyRef = React.useRef<string | null>(null);
  const dimsCacheRef = React.useRef<Map<string, string>>(new Map());
  const activeLogIdRef = React.useRef<string | null>(null);
  const lastErrorRef = React.useRef<string | null>(null);
  const menuRootRef = React.useRef<HTMLDivElement | null>(null);

  // Computed values
  const effectiveLoading = React.useMemo(
    () => (testingMode ? mockLoading : loading),
    [testingMode, mockLoading, loading]
  );
  
  const effectiveProgress = React.useMemo(
    () => (testingMode ? mockProgress : progress),
    [testingMode, mockProgress, progress]
  );
  
  const effectiveResult = React.useMemo(
    () => (testingMode ? mockResult : result),
    [testingMode, mockResult, result]
  );
  
  const effectiveResultImageSrc = React.useMemo(
    () =>
      effectiveResult?.status !== 'failed'
        ? (effectiveResult?.resultImageUrl || effectiveResult?.resultImageDataUrl)
        : null,
    [effectiveResult]
  );

  const canOpenDrawer = React.useMemo(
    () => !effectiveLoading && !!effectiveResultImageSrc,
    [effectiveLoading, effectiveResultImageSrc]
  );

  const canUseResultImageActions = React.useMemo(
    () => !effectiveLoading && !!effectiveResultImageSrc,
    [effectiveLoading, effectiveResultImageSrc]
  );

  // Warn user before leaving if generation is in progress
  React.useEffect(() => {
    if (!effectiveLoading) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [effectiveLoading]);

  const placeholderCount = React.useMemo(
    () => Math.max(0, 8 - (0)),
    []
  );

  // Helper: Get image dimensions safely
  const getImageDimsSafe = React.useCallback((url?: string | null): string | null => {
    if (!url) return null;
    const cached = dimsCacheRef.current.get(url);
    if (cached) return cached;
    return null;
  }, []);

  // Mock generation simulation
  const simulateMockGeneration = React.useCallback(() => {
    if (mockLoading) return;
    setMockLoading(true);
    setMockProgress(0);
    setMockResult(null);

    const progressInterval = setInterval(() => {
      setMockProgress((prev) => {
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

      const canvas = document.createElement('canvas');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
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

  // Scroll helper
  const scrollComparisonPanelToViewportTop = React.useCallback(() => {
    const target = comparisonPanelRef.current;
    if (!target) return;

    const findScrollContainer = (node: HTMLElement): HTMLElement | null => {
      let current: HTMLElement | null = node.parentElement;
      while (current) {
        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY;
        const isScrollable =
          (overflowY === 'auto' || overflowY === 'scroll') &&
          current.scrollHeight > current.clientHeight;
        if (isScrollable) return current;
        current = current.parentElement;
      }
      return null;
    };

    const container = findScrollContainer(target);
    const offset = -16;

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

  // Scroll to comparison panel when generation actually starts (mobile only)
  React.useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    const nowLoading = effectiveLoading;
    prevLoadingRef.current = nowLoading;

    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;

    if (!wasLoading && nowLoading && isMobile) {
      scrollComparisonPanelToViewportTop();
    }
  }, [effectiveLoading, scrollComparisonPanelToViewportTop]);

  // Retry handler
  const handleRetry = React.useCallback(() => {
    if (effectiveLoading) return;

    if (testingMode) {
      simulateMockGeneration();
    } else {
      onRetry?.();
    }
  }, [testingMode, simulateMockGeneration, onRetry, effectiveLoading]);

  // Download handler
  const handleDownload = React.useCallback(async (href: string, filename: string) => {
    try {
      const response = await fetch(href);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download:', error);
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // Format helpers
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

  // Effect: Close menu on outside click
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

  // Effect: Track generation logs
  React.useEffect(() => {
    const prev = prevLoadingRef.current;

    if (!prev && effectiveLoading && !activeLogIdRef.current) {
      const startedAt = Date.now();
      const id = `gen-${startedAt}`;
      const currentOriginalUrl = originalImageUrl;
      const currentFabricUrl = fabricThumbnailUrl || undefined;
      const imgDims = getImageDimsSafe(currentOriginalUrl);
      const fabricDims = getImageDimsSafe(currentFabricUrl);
      activeLogIdRef.current = id;
      setGenerationLogs((prevLogs) =>
        [...prevLogs, { id, startedAt, inputDims: imgDims, fabricDims }].slice(-MAX_LOGS)
      );
    }

    if (prev && !effectiveLoading && activeLogIdRef.current) {
      const finishedAt = Date.now();
      const activeId = activeLogIdRef.current;
      const currentResultUrl = effectiveResultImageSrc;
      setGenerationLogs((prevLogs) =>
        prevLogs.map((log) =>
          log.id === activeId && !log.finishedAt
            ? { ...log, finishedAt, outputDims: getImageDimsSafe(currentResultUrl) }
            : log
        )
      );
      activeLogIdRef.current = null;
    }

    prevLoadingRef.current = effectiveLoading;
  }, [effectiveLoading, originalImageUrl, fabricThumbnailUrl, effectiveResultImageSrc, getImageDimsSafe]);

  // Effect: Show error toast
  React.useEffect(() => {
    if (effectiveResult?.status !== 'failed') return;
    const message = effectiveResult.error || 'حدث خطأ غير معروف';
    if (lastErrorRef.current === message) return;
    lastErrorRef.current = message;
    showToast('خطأ في إنشاء الصورة', message, 'error');
  }, [effectiveResult?.status, effectiveResult?.error]);

  // Effect: Handle drawer scroll lock
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
    document.body.style.overflow = 'hidden';
    document.body.style.overflowY = 'scroll';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

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

  // Effect: Persist logs to localStorage
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(generationLogs));
    } catch (error) {
      console.warn('Failed to persist generation logs', error);
    }
  }, [generationLogs]);

  return {
    // State
    showDrawer,
    setShowDrawer,
    showMenu,
    setShowMenu,
    showThumbnailBar,
    setShowThumbnailBar,
    sliderPosition,
    setSliderPosition,
    testingMode,
    setTestingMode,
    showDevUi,
    setShowDevUi,
    mockLoading,
    mockProgress,
    mockResult,
    generationLogs,
    
    // Refs
    comparisonPanelRef,
    menuRootRef,
    
    // Computed values
    effectiveLoading,
    effectiveProgress,
    effectiveResult,
    effectiveResultImageSrc,
    canOpenDrawer,
    canUseResultImageActions,
    placeholderCount,
    
    // Handlers
    handleRetry,
    handleDownload,
    formatTime,
    formatDuration,
    scrollComparisonPanelToViewportTop,
  };
}
