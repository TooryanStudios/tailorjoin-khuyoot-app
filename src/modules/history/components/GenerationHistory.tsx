import * as React from 'react';
import { History as HistoryIcon, Clock, Loader2 } from 'lucide-react';

export type GenerationHistoryProps = {
  items?: any[];
  isLoading?: boolean;
  activeId?: string | null;
  onSelect?: (item: any) => void;
};

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({
  items = [],
  isLoading = false,
  activeId = null,
  onSelect,
}) => {
  return (
    <div className="space-y-3 px-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
          <Clock size={14} className="text-zinc-500" />
          التصاميم السابقة
        </h3>
        <span className="text-[10px] text-zinc-500 font-bold">
          {items.length}/20
        </span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-2 hide-scrollbar snap-x">
        {isLoading && items.length === 0 && (
          [1, 2, 3].map((i) => (
            <div 
              key={`skeleton-${i}`}
              className="aspect-[3/4] w-24 shrink-0 rounded-lg bg-zinc-100 border border-zinc-200 animate-pulse"
            />
          ))
        )}

        {items.map((item, idx) => {
          const isPending = item.isPending;
          const isActive = activeId === (item.jobId ?? item.clientId);
          const thumbUrl = item.thumbnailUrl || item.fullImageUrl;

          return (
            <button
              key={item.jobId ?? item.clientId ?? idx}
              onClick={() => !isPending && onSelect?.(item)}
              disabled={isPending}
              className={`relative aspect-[3/4] w-24 shrink-0 rounded-lg bg-white border-2 overflow-hidden transition-all snap-start ${
                isActive 
                  ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)]' 
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
            >
              {thumbUrl ? (
                <img 
                  src={thumbUrl} 
                  alt="Generation" 
                  className={`w-full h-full object-cover ${isPending ? 'opacity-40 grayscale' : ''}`}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-100 to-white flex items-center justify-center">
                  <HistoryIcon size={18} className="text-zinc-400" />
                </div>
              )}

              {isPending && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={16} className="text-zinc-700 animate-spin" />
                </div>
              )}
            </button>
          );
        })}

        {!isLoading && items.length === 0 && (
          <div className="w-full py-4 text-center">
            <p className="text-[9px] text-zinc-500 font-medium italic">
              سيتم عرض تصاميمك الأخيرة هنا بمجرد البدء في التوليد
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
