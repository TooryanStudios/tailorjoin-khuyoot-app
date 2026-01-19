import React from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { AdminAnchor } from './AdminAnchor';
import { StableImage } from '../../../components/StableImage';

export interface GenerationItem {
  jobId: string;
  url: string;
  thumbnailUrl?: string | null;
  createdAt: number;

  // Optional metadata for hover details
  width?: number | null;
  height?: number | null;
  fabricId?: string | null;
}

interface GenerationsRailProps {
  anchorId?: string;
  showAdminLabels?: boolean;
  generations: GenerationItem[];
  onOpenImage: (url: string) => void;
  onSetBefore?: (url: string) => void;
  onSetAfter?: (url: string) => void;
  placeholderCount?: number;
}

export const GenerationsRail: React.FC<GenerationsRailProps> = React.memo(
  ({
    anchorId,
    showAdminLabels,
    generations,
    onOpenImage,
    onSetBefore,
    onSetAfter,
    placeholderCount = 10,
  }) => {
  const [menuKey, setMenuKey] = React.useState<string | null>(null);
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 15 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const ITEM_HEIGHT = 96; // Height of each generation item (w-[92px] aspect-[3/4] = ~123px actual)
  const BUFFER = 5; // Number of items to render above/below visible area

  // Update visible range based on scroll position for virtual scrolling
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      
      const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
      const endIndex = Math.min(
        generations.length,
        Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER
      );
      
      setVisibleRange({ start: startIndex, end: endIndex });
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [generations.length]);

  // Auto-scroll to top when a new generation is added
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || generations.length === 0) return;
    
    // Scroll to top to show the latest generation
    container.scrollTop = 0;
  }, [generations[0]?.jobId]); // Only trigger when the first (latest) generation changes

  const formatTime = React.useCallback((ts: number) => {
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return '';
    }
  }, []);

  const formatDims = React.useCallback((w?: number | null, h?: number | null) => {
    if (!w || !h) return '—';
    return `${w}×${h}`;
  }, []);

  return (
    
    <AdminAnchor
      anchorId={anchorId}
      visible={showAdminLabels}
      label="section-generations"
      className="w-full sm:w-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 backdrop-blur p-2 flex flex-col h-[150px] sm:h-[400px] md:h-[600px] overflow-hidden"
    >
      <div 
        ref={containerRef}
        className="flex flex-row sm:flex-col items-center gap-1 flex-1 overflow-x-auto sm:overflow-y-auto overflow-y-hidden pb-2 sm:pb-0" 
        style={{ scrollbarGutter: 'stable' }}
      >
        {/* Spacer for items above visible range */}
        {visibleRange.start > 0 && (
          <div style={{ height: `${visibleRange.start * ITEM_HEIGHT}px`, flexShrink: 0 }} />
        )}
        
        {/* Only render visible items */}
        {generations.slice(visibleRange.start, visibleRange.end).map((g) => {
          const key = `${g.jobId}:${g.url}`;
          return (
            <div
              key={key}
              onClick={() => setMenuKey((prev) => (prev === key ? null : key))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setMenuKey((prev) => (prev === key ? null : key));
                }
              }}
              className="group relative w-[92px] sm:w-[92px] aspect-[3/4] flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:opacity-95"
              title="خيارات"
              role="button"
              tabIndex={0}
              aria-label="خيارات"
            >
              <StableImage
                src={g.thumbnailUrl || g.url}
                alt="Generation thumbnail"
                aspectClass="h-full"
                className="absolute inset-0"
              />

              <div
                  className={
                    `absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-2 p-2 transition-opacity ` +
                    (menuKey === key ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none') +
                    ' md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto'
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <div className="w-full rounded-md bg-black/70 px-2 py-2 text-[11px] leading-5 text-white text-right">
                    <div className="flex items-center justify-between gap-2">
                      <span className="opacity-90">الوقت</span>
                      <span className="font-bold">{formatTime(g.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="opacity-90">الأبعاد</span>
                      <span className="font-bold">{formatDims(g.width, g.height)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="opacity-90">القماش</span>
                      <span
                        className="font-bold truncate max-w-[64px]"
                        title={g.fabricId ?? ''}
                      >
                        {g.fabricId || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-1.5">
                    {onSetBefore ? (
                      <button
                        type="button"
                        title="تعيين كـ قبل"
                        aria-label="تعيين كـ قبل"
                        className="w-5 h-5 rounded bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onSetBefore(g.url);
                          setMenuKey(null);
                        }}
                      >
                        <ChevronLeft size={12} />
                      </button>
                    ) : null}

                    {onSetAfter ? (
                      <button
                        type="button"
                        title="تعيين كـ بعد"
                        aria-label="تعيين كـ بعد"
                        className="w-5 h-5 rounded bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onSetAfter(g.url);
                          setMenuKey(null);
                        }}
                      >
                        <ChevronRight size={12} />
                      </button>
                    ) : null}

                    <button
                      type="button"
                      title="عرض الصورة"
                      aria-label="عرض الصورة"
                      className="w-5 h-5 rounded bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpenImage(g.url);
                        setMenuKey(null);
                      }}
                    >
                      <ZoomIn size={12} />
                    </button>
                  </div>
                </div>
            </div>
          );
        })}
        
        {/* Spacer for items below visible range */}
        {visibleRange.end < generations.length && (
          <div style={{ height: `${(generations.length - visibleRange.end) * ITEM_HEIGHT}px`, flexShrink: 0 }} />
        )}

        {Array.from({ length: Math.max(0, 8 - generations.length) }).map((_, idx) => (
          <div
            key={`gen-placeholder-${idx}`}
            className="w-[92px] aspect-[3/4] flex-shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 animate-pulse"
            aria-hidden="true"
          />
        ))}
      </div>
      
    </AdminAnchor>
    
  );
});
