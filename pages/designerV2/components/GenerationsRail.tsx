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


interface GenerationCardProps {
  generation: GenerationItem;
  menuOpen: boolean;
  onToggleMenu: (key: string) => void;
  onOpenImage: (url: string) => void;
  onSetBefore?: (url: string) => void;
  onSetAfter?: (url: string) => void;
  formatTime: (ts: number) => string;
  formatDims: (w?: number | null, h?: number | null) => string;
}

const GenerationCard = React.memo(({
  generation: g,
  menuOpen,
  onToggleMenu,
  onOpenImage,
  onSetBefore,
  onSetAfter,
  formatTime,
  formatDims
}: GenerationCardProps) => {
  const key = `${g.jobId}:${g.url}`;
  
  return (
    <div
      onClick={() => onToggleMenu(key)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleMenu(key);
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
            (menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none') +
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
                  onToggleMenu(key);
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
                  onToggleMenu(key);
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
                onToggleMenu(key);
              }}
            >
              <ZoomIn size={12} />
            </button>
          </div>
        </div>
    </div>
  );
});

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
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Scroll to top/start when a new generation is added (first item changes)
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || generations.length === 0) return;
    
    // Reset scroll position cleanly
    container.scrollTop = 0;
    container.scrollLeft = 0;
  }, [generations[0]?.jobId]);

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

  const handleToggleMenu = React.useCallback((key: string) => {
    setMenuKey((prev) => (prev === key ? null : key));
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
        {generations.map((g) => {
          // Use jobId as primary key for stability
          const key = g.jobId || `${g.url}`; 
          const stableKey = `${g.jobId}:${g.url}`; // Used for menu state toggle
          
          return (
            <GenerationCard
              key={key}
              generation={g}
              menuOpen={menuKey === stableKey}
              onToggleMenu={handleToggleMenu}
              onOpenImage={onOpenImage}
              onSetBefore={onSetBefore}
              onSetAfter={onSetAfter}
              formatTime={formatTime}
              formatDims={formatDims}
            />
          );
        })}

        {Array.from({ length: Math.max(0, 8 - generations.length) }).map((_, idx) => (
          <div
            key={`gen-placeholder-${idx}`}
            className="w-[92px] sm:w-[92px] aspect-[3/4] flex-shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 animate-pulse"
            aria-hidden="true"
          />
        ))}
      </div>
      
    </AdminAnchor>
    
  );
});
