import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, ArrowLeft, ArrowRight, PanelLeftClose, PanelLeftOpen, History as HistoryIcon, AlertCircle, Trash2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const HistoryFilmstrip: React.FC<HistoryFilmstripProps> = React.memo(({
  history,
  isLoading,
  activeId,
  onSelect,
  onDelete,
  onSetBefore,
  onSetAfter,
  deletingItemId,
  maxSlots = 20,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { t } = useTranslation(['designer']);
  const placeholders = Math.max(0, Math.min(5, maxSlots - history.length));
  const { getThumbnailSrc } = useThumbnailCache({ maxEntries: 30 });

  // Note: Eager prefetching of all thumbnails removed for performance.
  // Browser will handle lazy loading via loading="lazy" attribute.

  return (
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 52 : 100 }}
      className="h-full bg-white/95 border-r border-zinc-200 backdrop-blur-md flex flex-col overflow-hidden relative"
    >
      {/* 🚀 Header & Toggle */}
      <div className="flex flex-col items-center py-4 border-b border-zinc-100 mb-2">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-purple-600 transition-all active:scale-90 border border-zinc-100 shadow-sm"
          title={isCollapsed ? "توسيع السجل" : "طي السجل"}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
        
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-1.5 px-2"
          >
            <HistoryIcon size={10} className="text-zinc-400 font-bold" />
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] whitespace-nowrap">
              السجل
            </span>
          </motion.div>
        )}
      </div>

      {/* 🚀 Generations List */}
      <div className="flex-1 custom-scrollbar overflow-y-auto overflow-x-hidden flex flex-col items-center gap-3 px-2 pb-6">
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 w-full"
            >
              {isLoading && history.length === 0 && [1, 2, 3].map((i) => (
                <div key={`history-skeleton-${i}`} className="w-full aspect-[3/4] shrink-0 rounded-lg bg-zinc-50 animate-pulse border border-zinc-100" />
              ))}

              {!isLoading && history.length === 0 && (
                <div className="text-[10px] text-zinc-400 text-center leading-tight mt-4 italic opacity-70 px-2 font-medium">
                  لا توجد نتائج حتى الآن.
                </div>
              )}

              {history.map((item, idx) => {
                const itemActiveId = item.jobId ?? item.clientId;
                const isActive = activeId === itemActiveId;
                const isPending = 'isPending' in item && item.isPending;
                const isError = isPending && (item as any).isError;
                const errorMsg = isPending ? (item as any).error : null;
                const isDeleting = deletingItemId === item.jobId;

                const stableKey =
                  item.jobId ??
                  item.clientId ??
                  idx;
                
                return (
                  <div
                    key={stableKey}
                    className={`relative w-full aspect-[3/4] shrink-0 group transition-all duration-300 ${
                      isDeleting ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
                    }`}
                    onMouseEnter={() => {
                      if (!isPending) prefetch((item as GenerationRecord).fullImageUrl);
                    }}
                  >
                    <div
                      className={`w-full h-full rounded-lg bg-zinc-50 border-2 overflow-hidden transition-all ${
                        isActive
                          ? 'border-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.15)] bg-purple-50'
                          : isError
                            ? 'border-red-500/50 bg-red-500/5'
                            : 'border-zinc-100 hover:border-purple-300'
                      }`}
                    >
                      <button
                        className="w-full h-full"
                        onClick={() => !isPending && onSelect(item as GenerationRecord)}
                        disabled={isPending && !isError}
                      >
                        {isError ? (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center gap-1.5">
                            <AlertCircle size={16} className="text-red-500" />
                            <span className="text-[8px] font-bold text-red-400 uppercase leading-tight line-clamp-3">
                              {errorMsg || 'فشل التحميل'}
                            </span>
                          </div>
                        ) : isPending ? (
                          <div className="w-full h-full bg-zinc-50 flex items-center justify-center">
                            <div className="relative w-10 h-10">
                              <div className="absolute inset-0 rounded-full border-2 border-zinc-200" />
                              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-600 animate-spin" />
                            </div>
                          </div>
                        ) : 'thumbnailUrl' in item && item.thumbnailUrl ? (
                          <img
                            src={getThumbnailSrc(item.thumbnailUrl)}
                            alt={item.jobId}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              const full = (item as GenerationRecord).fullImageUrl;
                              if (full && e.currentTarget.src !== full) {
                                e.currentTarget.src = full;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-50 flex items-center justify-center text-[10px] text-zinc-400 font-bold">
                            ...
                          </div>
                        )}
                      </button>
                    </div>

                    {(isError || !isPending) && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 rounded-lg backdrop-blur-[2px]">
                        {!isError && (
                          <>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                title={t('setAsBefore')}
                                onClick={(e) => { e.stopPropagation(); onSetBefore(item as GenerationRecord); }}
                                className="p-1.5 bg-white shadow-sm hover:bg-purple-600 hover:text-white border border-zinc-200 rounded-lg active:scale-90 transition-all text-zinc-400"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                title={t('setAsAfter')}
                                onClick={(e) => { e.stopPropagation(); onSetAfter(item as GenerationRecord); }}
                                className="p-1.5 bg-white shadow-sm hover:bg-purple-600 hover:text-white border border-zinc-200 rounded-lg active:scale-90 transition-all text-zinc-400"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              type="button"
                              title={t('fullComparison')}
                              onClick={(e) => { e.stopPropagation(); onSelect(item as GenerationRecord); }}
                              className="p-1.5 bg-white/80 hover:bg-purple-600 hover:text-white border border-zinc-200 rounded-full active:scale-90 transition-all mt-1 text-zinc-500"
                            >
                              <Maximize2 size={12} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Pass jobId or clientId to handle both real jobs and pending/error state
                            onDelete(item.jobId || item.clientId, e);
                          }}
                          className="p-1.5 bg-red-600/80 hover:bg-red-700 rounded-full text-white mt-1 shadow-sm transition-all active:scale-90"
                          title={t('delete')}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {placeholders > 0 && Array.from({ length: placeholders }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-full aspect-[3/4] shrink-0 rounded-lg bg-zinc-50 border-2 border-dashed border-zinc-100 overflow-hidden flex items-center justify-center grayscale opacity-30"
                >
                  <Plus className="w-4 h-4 text-zinc-300" />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
