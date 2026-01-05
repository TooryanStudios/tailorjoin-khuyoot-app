import React from 'react';
import { useThumbnailCache } from '../../hooks/useThumbnailCache';

export const TemplateCard = React.memo(function TemplateCard({
  template,
  isActive,
  onSelect,
  onHover,
  isLocked = false,
  onLockedClick,
}) {
  const { getThumbnailSrc, prefetchThumbnails } = useThumbnailCache({ maxEntries: 30 });

  const previewSrc = template?.thumbnailUrl || template?.imageUrl || null;
  const subtitle = template?.meta?.label || template?.meta?.source || '';

  React.useEffect(() => {
    if (!previewSrc) return;
    prefetchThumbnails([previewSrc]);
  }, [previewSrc, prefetchThumbnails]);

  return (
    <button
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
            src={getThumbnailSrc(previewSrc)}
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
