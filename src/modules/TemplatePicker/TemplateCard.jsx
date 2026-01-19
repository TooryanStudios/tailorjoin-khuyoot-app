import React from 'react';
import { useThumbnailCache } from '../../hooks/useThumbnailCache';

export const TemplateCard = React.memo(function TemplateCard({
  template,
  isActive,
  onSelect,
  onHover,
  isLocked = false,
  onLockedClick,
  isLoading = false,
}) {
  // Lazy-load thumbnails only when visible using IntersectionObserver
  const [isVisible, setIsVisible] = React.useState(false);
  // Use plain ref in .jsx to avoid TS generic syntax
  const cardRef = React.useRef(null);

  React.useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Once visible, we can unobserve to avoid repeated callbacks
            observer.unobserve(entry.target);
          }
        }
      },
      { root: null, rootMargin: '200px', threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Increase thumbnail cache to reduce evictions when switching tabs
  const { getThumbnailSrc, prefetchThumbnails } = useThumbnailCache({ maxEntries: 100, enabled: isVisible || Boolean(isActive) });

  const previewSrc =
    template?.meta?.source === 'closet'
      ? (template?.imageUrl || template?.thumbnailUrl || null)
      : (template?.thumbnailUrl || template?.imageUrl || null);
  const subtitle = template?.meta?.label || template?.meta?.source || '';

  // Prefetch only when visible (or active)
  React.useEffect(() => {
    if (!previewSrc) return;
    if (!isVisible && !isActive) return;
    prefetchThumbnails([previewSrc]);
  }, [previewSrc, prefetchThumbnails, isVisible, isActive]);

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={() => {
        if (isLocked) {
          onLockedClick?.(template);
          return;
        }
        onSelect(template);
      }}
      onMouseEnter={() => onHover?.(template)}
      className={`group relative w-full overflow-hidden rounded-xl border text-left transition-colors ${
        isActive && !isLocked
          ? 'border-purple-500/70 bg-purple-500/10'
          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
      } ${isLocked ? 'hover:border-purple-500/40' : ''}`}
    >
      <div className="relative w-full aspect-[3/4] bg-zinc-900">
        {previewSrc ? (
          <img
            src={isVisible || isActive ? getThumbnailSrc(previewSrc) : previewSrc}
            alt={template?.name || 'Template'}
            className={`absolute inset-0 h-full w-full object-cover ${
              isLocked ? 'grayscale brightness-75 contrast-125' : ''
            }`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
            No preview
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              <span className="text-[10px] text-purple-300 font-medium">Loading...</span>
            </div>
          </div>
        )}

        {isLocked && (
          <>
            <div className="absolute inset-0 bg-zinc-950/55" />
            <div className="absolute left-2 top-2 rounded-md border border-purple-500/50 bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-100">
              Premium
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-lg border border-zinc-700/60 bg-zinc-950/70 px-3 py-2 text-center">
                <div className="text-[11px] font-semibold text-zinc-100">Locked</div>
                <div className="mt-0.5 text-[10px] text-zinc-300">Tap to upgrade</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="p-2">
        <div className="text-xs font-semibold text-zinc-200 truncate">
          {template?.name || 'Template'}
        </div>
        <div className="text-[10px] text-zinc-500 truncate">{subtitle}</div>
      </div>

      {isActive && (
        <div className="absolute top-2 right-2 rounded-md border border-purple-500/60 bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-200">
          Active
        </div>
      )}
    </button>
  );
});
