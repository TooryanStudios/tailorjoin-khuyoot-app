import React from 'react';
import { Sparkles, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { usePopularRegions, useFilteredTailors } from '../../../src/hooks/useHomeData';
import { useAppStore } from '../../../src/store/useAppStore';

const ACCENT = 'var(--theme-secondary)';

type RegionTab = { id: string; name: string; value: string | null };

const TailorLikeButton = ({ initialLikes = 0 }: { initialLikes?: number }) => {
  const [liked, setLiked] = React.useState(false);
  const [count, setCount] = React.useState(initialLikes || Math.floor(Math.random() * 200) + 50);
  
  return (
    <div className="flex flex-col items-center">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setLiked(!liked);
          setCount(prev => liked ? prev - 1 : prev + 1);
        }}
        className="transition-all duration-300 active:scale-150"
      >
        <Heart 
          size={22} 
          className={`transition-colors duration-300 ${liked ? 'fill-rose-500 text-rose-500' : 'text-white/20 hover:text-white/40'}`} 
        />
      </button>
      <span className={`text-[11px] mt-0.5 transition-colors duration-300 ${liked ? 'text-rose-500' : 'text-white/20'}`}>
        {count}
      </span>
    </div>
  );
};

export const V2BlockC: React.FC = React.memo(function V2BlockC() {
  const navigate = useNavigate();
  const { appSettings } = useApp();

  const selectedRegion = useAppStore((s) => s.selectedRegion);
  const setSelectedRegion = useAppStore((s) => s.setSelectedRegion);

  const regionDriver = React.useMemo(() => {
    if (!selectedRegion) return null;
    const trimmed = selectedRegion.trim();
    return trimmed.length ? trimmed : null;
  }, [selectedRegion]);

  const cfg = (appSettings as any)?.homePageV2Layout?.blockConfig?.blockC;
  const maxColumns = Math.max(1, cfg?.maxColumns || 6);
  const maxRows = Math.max(1, cfg?.maxRows || 1);
  const maxItems = Math.max(1, maxColumns * maxRows);
  const title = cfg?.title || 'خياطون مميزون';
  const cardRadiusPx = cfg?.cardRadiusPx ?? 12;
  const cardGapPx = cfg?.cardGapPx ?? 12;
  const cardWidthPx = Math.max(120, Number(cfg?.cardWidth ?? 200));
  const cardImageHeightPx = Math.max(120, Number(cfg?.cardHeight ?? 240));

  const maxRegions = appSettings?.homePageSettings?.maxRegions ?? 8;
  const { data: regions = [] } = usePopularRegions(maxRegions);
  const { data: tailors = [], isPending: isTailorsLoading } = useFilteredTailors(regionDriver, maxItems);

  const tabs: RegionTab[] = React.useMemo(() => {
    const base: RegionTab[] = [{ id: 'all', name: 'الكل', value: null }];
    for (const r of regions) {
      if (!r?.id || !r?.name) continue;
      const name = String(r.name);
      const value = name.trim();
      base.push({ id: String(r.id), name, value: value.length ? value : null });
    }
    return base;
  }, [regions]);

  const tabsRef = React.useRef<HTMLDivElement | null>(null);
  const scrollTabs = React.useCallback((dir: -1 | 1) => {
    tabsRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  }, []);

  return (
    <section className="py-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
              <Sparkles size={18} color={ACCENT} />
            </div>
            <h2 className="text-2xl md:text-3xl tracking-tight text-white uppercase">{title}</h2>
          </div>
          <p className="text-sm md:text-base text-white/50 leading-relaxed">
            اكتشف نخبة الخياطين والمصممين في منطقتك، تصفح أعمالهم واختر الأنسب لذوقك.
          </p>
        </div>

        <div className="relative w-full lg:max-w-[600px]">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/40 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/40 to-transparent z-10" />

            <button
              type="button"
              aria-label="Scroll tabs left"
              onClick={() => scrollTabs(1)}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <ChevronLeft size={16} className="mx-auto" />
            </button>

            <button
              type="button"
              aria-label="Scroll tabs right"
              onClick={() => scrollTabs(-1)}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <ChevronRight size={16} className="mx-auto" />
            </button>

            <div ref={tabsRef} className="overflow-x-auto no-scrollbar px-10">
              <div className="flex gap-2 min-w-max py-1">
                {tabs.map((tab) => {
                  const isSelected = tab.value === regionDriver;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedRegion(tab.value)}
                      className={`px-4 py-2 rounded-xl border transition-all duration-300 text-xs whitespace-nowrap ${
                        isSelected
                          ? 'border-white/20 bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                          : 'border-white/5 bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {tab.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="grid"
        style={{
          gap: `${cardGapPx}px`,
          gridTemplateColumns: `repeat(auto-fill, ${cardWidthPx}px)`,
          justifyContent: 'center',
        }}
      >
        {(isTailorsLoading && tailors.length === 0 ? Array.from({ length: maxItems }) : tailors).map((tailor: any, i: number) => {
          if (!tailor) {
            return (
              <div
                key={`tailor-skeleton-${i}`}
                className="flex flex-col bg-slate-900 border border-white/10 shadow-2xl p-3 gap-4"
                style={{ borderRadius: `${cardRadiusPx}px` }}
              >
                <div 
                  className="bg-white/5 border border-white/10 animate-pulse"
                  style={{
                    height: `${cardImageHeightPx}px`,
                    borderRadius: `${Math.max(0, cardRadiusPx - 8)}px`,
                  }}
                />
                <div className="space-y-2">
                  <div className="h-5 w-3/4 rounded-lg bg-white/5 animate-pulse" />
                  <div className="h-4 w-1/2 rounded-lg bg-white/5 animate-pulse" />
                </div>
              </div>
            );
          }

          const id = String(tailor.id ?? tailor.uid ?? tailor.userId ?? `tailor-${i}`);
          const name = String(tailor.name ?? 'Tailor');
          const image = tailor.image as string | undefined;
          const specialization = typeof tailor.specialization === 'string' ? tailor.specialization : '';
          const location = typeof tailor.location === 'string' ? tailor.location : '';
          const tailorRegion = typeof tailor.region === 'string' ? tailor.region : '';

          const regionLabel = (tailorRegion || location || regionDriver || '').trim();

          return (
            <article
              key={id}
              className="group cursor-pointer"
              onClick={() => navigate(`/tailor/${encodeURIComponent(id)}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate(`/tailor/${encodeURIComponent(id)}`);
              }}
            >
              <div 
                className="flex h-full flex-col bg-slate-900 border border-white/10 shadow-2xl p-3 transition-colors duration-300 group-hover:border-white/20"
                style={{ borderRadius: `${cardRadiusPx}px` }}
              >
                {/* Image Container */}
                <div 
                  className="relative overflow-hidden border border-white/5 bg-slate-900 shadow-xl transition-transform duration-500 group-hover:-translate-y-1"
                  style={{
                    height: `${cardImageHeightPx}px`,
                    borderRadius: `${Math.max(0, cardRadiusPx - 8)}px`,
                  }}
                >
                  {image ? (
                    <img
                      src={image}
                      alt={name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-4xl">🧵</div>
                  )}

                  {/* NEW Badge */}
                  <div className="absolute top-5 left-5 z-10">
                    <div className="px-3 py-1 rounded-xl bg-white text-black text-[11px] italic tracking-tighter shadow-2xl">
                      جديد
                    </div>
                  </div>

                  {/* Subtle Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Content Row */}
                <div className="flex items-start justify-between px-1 pt-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-lg text-white truncate group-hover:text-blue-400 transition-colors duration-300">
                      {name}
                    </div>
                    <div className="text-sm text-white/60 truncate mt-0.5">
                      {specialization || regionLabel || 'خياط محترف'}
                    </div>
                  </div>

                  <div className="ml-3">
                    <TailorLikeButton />
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {/* "Show All" Card */}
        <button
          onClick={() => navigate('/tailors')}
          className="group flex flex-col items-center justify-center bg-gradient-to-br from-white/10 to-white/5 border border-white/20 hover:border-[color:var(--theme-secondary)]/50 hover:bg-white/15 transition-all cursor-pointer h-full"
          style={{
            borderRadius: `${cardRadiusPx}px`,
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[color:var(--theme-secondary)]/20 flex items-center justify-center transition-all hover:scale-110">
              <ChevronLeft size={28} className="text-[color:var(--theme-secondary)]" />
            </div>
            <span className="text-sm font-bold text-white">عرض الكل</span>
          </div>
        </button>
      </div>
    </section>
  );
});
