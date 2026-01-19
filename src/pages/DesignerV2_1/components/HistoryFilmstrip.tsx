import React from 'react';
import { X, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { type GenerationRecord } from '../../../services/fabricSwapService';
import { type HistoryItem } from '../hooks/useGenerationHistory';
import { useThumbnailCache } from '../../../hooks/useThumbnailCache';

const prefetched = new Set<string>();

function prefetch(url: string | undefined) {
  if (!url) return;
  if (prefetched.has(url)) return;
  prefetched.add(url);
  const img = new Image();
  img.src = url;
}

interface HistoryFilmstripProps {
  history: HistoryItem[];
  isLoading: boolean;
  activeId: string | null;
  onSelect: (item: GenerationRecord) => void;
  onDelete: (jobId: string, e: React.MouseEvent) => void;
  onSetBefore: (item: GenerationRecord) => void;
  onSetAfter: (item: GenerationRecord) => void;
  deletingItemId?: string | null;
  maxSlots?: number;
}

export const HistoryFilmstrip: React.FC<HistoryFilmstripProps> = ({
  history,
  isLoading,
  activeId,
  onSelect,
  onDelete,
  onSetBefore,
  onSetAfter,
  deletingItemId,
  maxSlots = 20,
}) => {
  const placeholders = Math.max(0, Math.min(5, maxSlots - history.length));

  const { getThumbnailSrc, prefetchThumbnails } = useThumbnailCache({ maxEntries: 30 });

  React.useEffect(() => {
    // Warm visible thumbnails (LRU). This avoids repeated decode/network churn when the filmstrip re-renders.
    const thumbnailUrls = history
      .map((item) => ('thumbnailUrl' in item ? item.thumbnailUrl : undefined))
      .filter(Boolean);
    
    prefetchThumbnails(thumbnailUrls);

    // Also prefetch the full images for visible thumbnails in the background
    const fullImageUrls = history
      .map((item) => (item as GenerationRecord).fullImageUrl)
      .filter(Boolean);
    
    if (fullImageUrls.length > 0) {
      fullImageUrls.forEach((url) => {
        if (url && !prefetched.has(url)) {
          prefetched.add(url);
          const img = new Image();
          img.src = url;
          // Preload without blocking UI
          img.loading = 'lazy';
        }
      });
    }
  }, [history, prefetchThumbnails]);

  return (
    <div className="h-36 border-t border-zinc-800 bg-zinc-950 px-4">
      <div className="custom-scrollbar h-full flex items-stretch gap-3 overflow-x-auto py-3">
        {isLoading && history.length === 0 && [1, 2, 3].map((i) => (
          <div key={`history-skeleton-${i}`} className="h-full w-32 shrink-0 rounded-lg bg-zinc-900 animate-pulse" />
        ))}

        {!isLoading && history.length === 0 && (
          <div className="text-xs text-zinc-500 self-center">No generations yet. Create your first design!</div>
        )}

        {history.map((item, idx) => {
          const itemActiveId = item.jobId ?? item.clientId;
          const isActive = activeId === itemActiveId;
          const isPending = 'isPending' in item && item.isPending;
          const isDeleting = deletingItemId === item.jobId;

          const stableKey =
            item.jobId ??
            item.clientId ??
            // Fallbacks for extra safety (should be rare)
            ('thumbnailUrl' in item ? item.thumbnailUrl : undefined) ??
            ('fullImageUrl' in item ? item.fullImageUrl : undefined) ??
            `unknown-${idx}`;
          
          return (
            <div
              key={stableKey}
              className={`relative h-full w-32 shrink-0 group transition-all duration-300 ${
                isDeleting ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
              }`}
              onMouseEnter={() => {
                if (!isPending) prefetch((item as GenerationRecord).fullImageUrl);
              }}
            >
              <button
                className={`w-full h-full rounded-lg bg-zinc-900 border-2 overflow-hidden transition-all ${
                  isActive
                    ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                    : 'border-zinc-800 hover:border-purple-500/60'
                }`}
                onClick={() => !isPending && onSelect(item as GenerationRecord)}
                disabled={isPending}
              >
                {isPending ? (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <div className="relative w-16 h-16">
                      {/* Outer ring background */}
                      <div className="absolute inset-0 rounded-full border-4 border-zinc-700" />
                      {/* Animated spinning ring */}
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-purple-400 animate-spin" />
                    </div>
                  </div>
                ) : 'thumbnailUrl' in item && item.thumbnailUrl ? (
                  <img
                    src={getThumbnailSrc(item.thumbnailUrl)}
                    alt={item.jobId}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">
                    No thumbnail
                  </div>
                )}
              </button>

              {!isPending && (
                <>
                  <button
                    type="button"
                    title="Set as Before"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetBefore(item as GenerationRecord);
                    }}
                    className="absolute bottom-1 left-1 p-1 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <ArrowLeft className="w-3 h-3 text-zinc-100" />
                  </button>
                  <button
                    type="button"
                    title="Set as After"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetAfter(item as GenerationRecord);
                    }}
                    className="absolute bottom-1 right-1 p-1 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <ArrowRight className="w-3 h-3 text-zinc-100" />
                  </button>
                </>
              )}

              {!isPending && (
                <button
                  onClick={(e) => onDelete((item as GenerationRecord).jobId, e)}
                  className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Delete"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          );
        })}

        {placeholders > 0 && Array.from({ length: placeholders }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="h-full w-32 shrink-0 rounded-lg bg-zinc-900/50 border-2 border-dashed border-zinc-700 overflow-hidden hover:border-purple-500/60 transition-colors flex items-center justify-center"
            title="Upload template to create new generation"
          >
            <Plus className="w-8 h-8 text-zinc-600" />
          </div>
        ))}
      </div>
    </div>
  );
};
