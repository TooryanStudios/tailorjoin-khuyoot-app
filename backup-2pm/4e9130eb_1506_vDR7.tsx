import React from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { AdminAnchor } from './AdminAnchor';

export interface GenerationItem {
  jobId: string;
  url: string;
  thumbnailUrl?: string | null;
  createdAt: number;
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

export const GenerationsRail: React.FC<GenerationsRailProps> = ({
  anchorId,
  showAdminLabels,
  generations,
  onOpenImage,
  onSetBefore,
  onSetAfter,
  placeholderCount = 10,
}) => {
  const [menuKey, setMenuKey] = React.useState<string | null>(null);

  return (
    
    <AdminAnchor
      anchorId={anchorId}
      visible={showAdminLabels}
      label="section-generations"
      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 backdrop-blur p-2"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-black text-slate-900 dark:text-white">إبد55اعاتي ({generations.length})</div>
      </div>

      <div className="flex flex-nowrap items-start gap-1 overflow-x-auto pb-1 -mx-2 px-2" style={{ scrollbarGutter: 'stable both-edges' }}>
        {generations.slice(0, 15).map((g) => {
          const key = `${g.jobId}:${g.url}`;
          return (
            <div
              key={key}
              onClick={() => setMenuKey((prev) => (prev === key ? null : key))}
              className="group relative w-[84px] aspect-[3/4] shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:opacity-95 cursor-pointer"
              title="خيارات"
            >
              <img
                src={g.thumbnailUrl || g.url}
                alt="Generation thumbnail"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
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

        {Array.from({ length: placeholderCount }).map((_, idx) => (
          <div
            key={`gen-placeholder-${idx}`}
            className="w-[84px] aspect-[3/4] shrink-0 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40"
            aria-hidden="true"
          />
        ))}
      </div>
      
    </AdminAnchor>
    
  );
};
