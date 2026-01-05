import React from 'react';
import { useThumbnailCache } from '../../hooks/useThumbnailCache';

export type TemplatePickerItem = {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  disabled?: boolean;
  title?: string;
  isPremium?: boolean;
  isLocked?: boolean;
  metaLabel?: string;
  metaTone?: 'ok' | 'warn' | 'neutral';
};

export function TemplatePicker(props: {
  items: TemplatePickerItem[];
  selectedId: string | null;
  onSelect: (item: TemplatePickerItem) => void;
  onConfirm?: (item: TemplatePickerItem) => void;
  aspect?: 'portrait' | 'square';
  maxItemWidthPx?: number;
  preferThumbnailOnly?: boolean;
  showEndPlaceholders?: boolean;
}) {
  const {
    items,
    selectedId,
    onSelect,
    onConfirm,
    aspect = 'portrait',
    maxItemWidthPx = 108,
    preferThumbnailOnly = false,
    showEndPlaceholders = true,
  } = props;

  const GAP_PX = 2;
  const FIXED_HEIGHT_PX = 154;

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [cols, setCols] = React.useState(4);

  const { getThumbnailSrc, prefetchThumbnails } = useThumbnailCache({ maxEntries: 30 });

  React.useEffect(() => {
    prefetchThumbnails(items.map((t) => t.thumbnailUrl ?? t.imageUrl));
  }, [items, prefetchThumbnails]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const computeCols = () => {
      const width = el.clientWidth || 0;
      const denom = maxItemWidthPx + GAP_PX;
      const next = Math.max(1, Math.floor((width + GAP_PX) / denom));
      setCols(next);
    };

    computeCols();

    if (typeof ResizeObserver === 'undefined') {
      const onResize = () => computeCols();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }

    const ro = new ResizeObserver(() => computeCols());
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxItemWidthPx]);

  const placeholderCount = showEndPlaceholders
    ? (items.length === 0 ? cols : (cols - (items.length % cols)) % cols)
    : 0;

  return (
    <div
      ref={containerRef}
      className="grid justify-center"
      style={{
        gridTemplateColumns: `repeat(${cols}, ${maxItemWidthPx}px)`,
        gap: `${GAP_PX}px`,
      }}
    >
      {items.map((t) => {
        const isSelected = t.id === selectedId;
        const metaToneClass = t.metaTone === 'ok'
          ? 'bg-emerald-600 text-white'
          : t.metaTone === 'warn'
            ? 'bg-amber-600 text-white'
            : 'bg-slate-900/70 text-white';
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              if (t.disabled) return;
              onSelect(t);
            }}
            disabled={!!t.disabled}
            title={t.title}
            style={{
              width: maxItemWidthPx,
              flexBasis: maxItemWidthPx,
              maxHeight: `${FIXED_HEIGHT_PX}px`,
              // Reduce paint/reflow cost for offscreen cards while scrolling.
              // Works best in Chromium; harmless in browsers that ignore it.
              contentVisibility: 'auto',
              containIntrinsicSize: `${maxItemWidthPx}px ${FIXED_HEIGHT_PX}px`,
              contain: 'layout paint style',
            }}
            className={
              `group rounded-xl text-right transition-all flex flex-col items-stretch bg-transparent border-0 p-0 ` +
              (t.disabled ? ' opacity-60 cursor-not-allowed' : '')
            }
          >
            <div
              style={{
                width: `${maxItemWidthPx}px`,
                height: `${FIXED_HEIGHT_PX}px`,
              }}
              className={
                `relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 flex items-start justify-start ` +
                (isSelected
                  ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                  : 'ring-1 ring-slate-200/60 dark:ring-slate-700/60 hover:ring-slate-300/70 dark:hover:ring-slate-600/70')
              }
            >
              {(() => {
                const displaySrc = (t.thumbnailUrl || null) ?? null;
                const canFallbackToImageUrl = !preferThumbnailOnly;
                const fallbackSrc = canFallbackToImageUrl ? (t.imageUrl || null) : null;
                const src = displaySrc || fallbackSrc;
                if (!src) {
                  return (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                      لا توجد صورة
                    </div>
                  );
                }
                return (
                <>
                  <img
                    src={getThumbnailSrc(src as string)}
                    alt={t.name}
                    className={`h-full w-full object-cover object-top ${t.isLocked ? 'opacity-40 grayscale' : ''}`}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      // If optimized WebP fails, try original imageUrl as fallback
                      const img = e.currentTarget;
                      const originalUrl = t.imageUrl;
                      
                      // Only try fallback once (avoid infinite loop)
                      if (displaySrc && fallbackSrc && img.src !== fallbackSrc) {
                        console.log(`[Template Picker] WebP failed for ${t.name}, trying original URL`);
                        img.src = getThumbnailSrc(fallbackSrc);
                        return;
                      }
                      
                      // No fallback available or already tried - show error
                      img.style.display = 'none';
                      const fallbackDiv = img.nextElementSibling as HTMLElement | null;
                      if (fallbackDiv) fallbackDiv.style.display = 'flex';
                    }}
                  />
                  <div className="absolute inset-0 hidden items-center justify-center text-xs text-slate-400">
                    لا توجد صورة
                  </div>

                  {/* Bottom gradient shade (always visible) */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />

                  {/* Hover/focus overlay (title + button) */}
                  <div
                    className={
                      'absolute inset-x-0 bottom-0 p-2 transition-opacity ' +
                      'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 '
                    }
                  >
                    <div className="relative flex flex-col gap-1">
                      <div className="text-[11px] font-normal text-white text-center drop-shadow-md truncate">
                        {t.name}
                      </div>

                      <div
                        role={onConfirm ? 'button' : undefined}
                        tabIndex={onConfirm ? 0 : -1}
                        onClick={(e) => {
                          if (!onConfirm) return;
                          e.preventDefault();
                          e.stopPropagation();
                          if (t.disabled) return;
                          onConfirm(t);
                        }}
                        onKeyDown={(e) => {
                          if (!onConfirm) return;
                          if (e.key !== 'Enter' && e.key !== ' ') return;
                          e.preventDefault();
                          e.stopPropagation();
                          if (t.disabled) return;
                          onConfirm(t);
                        }}
                        className={
                          'w-full h-6 rounded-md text-[10px] font-normal flex items-center justify-center bg-black/60 text-gray-300 ' +
                          'transition-colors ' +
                          (onConfirm && !t.disabled ? 'cursor-pointer hover:bg-black/70' : 'cursor-default')
                        }
                        aria-label={onConfirm ? `استخدم القالب ${t.name}` : undefined}
                      >
                        استخدم القالب
                      </div>
                    </div>
                  </div>
                </>
                );
              })() || (
                <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                  لا توجد صورة
                </div>
              )}
              {t.metaLabel ? (
                <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm ${metaToneClass}`}>
                  {t.metaLabel}
                </div>
              ) : null}
              {t.isPremium && (
                <div className="absolute top-1 left-1 bg-amber-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm">
                  ⭐ Premium
                </div>
              )}
              {t.isLocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[1px]">
                  <svg className="w-6 h-6 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-white text-[10px] font-bold">اشترك</span>
                </div>
              )}
            </div>
          </button>
        );
      })}
      {Array.from({ length: placeholderCount }).map((_, idx) => (
        <div
          key={`placeholder-${idx}`}
          style={{ width: `${maxItemWidthPx}px`, height: `${FIXED_HEIGHT_PX}px` }}
          className="mx-0 rounded-xl border-0 p-0 opacity-60 overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-[11px] text-slate-400 ring-1 ring-dashed ring-slate-200 dark:ring-slate-700"
          aria-hidden
        >
          —
        </div>
      ))}
    </div>
  );
}
