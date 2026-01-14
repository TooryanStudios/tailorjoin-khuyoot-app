import React from 'react';
import { Sparkles, ChevronLeft, ChevronRight, Star, MapPin, ArrowRight, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLayoutStore } from '../store/useLayoutStore';
import { usePopularRegions, useFilteredTailors } from '../../../hooks/useHomeData';
import { useAppStore } from '../../../store/useAppStore';
import { useApp } from '../../../../context/AppContext';
import styles from './homepageV2.module.css';

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
      <span className={`text-[11px] font-bold mt-0.5 transition-colors duration-300 ${liked ? 'text-rose-500' : 'text-white/20'}`}>
        {count}
      </span>
    </div>
  );
};

export default function BlockC() {
  const navigate = useNavigate();
  const { appSettings } = useApp();

  const selectedRegion = useAppStore((s) => s.selectedRegion);
  const setSelectedRegion = useAppStore((s) => s.setSelectedRegion);

  const regionDriver = React.useMemo(() => {
    if (!selectedRegion) return null;
    const trimmed = selectedRegion.trim();
    return trimmed.length ? trimmed : null;
  }, [selectedRegion]);

  const cfg = useLayoutStore((s) => s.blockConfig.blockC);
  const maxColumns = Math.max(1, cfg?.maxColumns || 1);
  const maxRows = Math.max(1, cfg?.maxRows || 1);
  const maxItems = Math.max(1, maxColumns * maxRows);
  const width = cfg?.cardWidth || 180;
  const height = cfg?.cardHeight || 110;
  const cardGapPx = cfg?.cardGapPx ?? 12;
  const cardRadiusPx = cfg?.cardRadiusPx ?? 8;
  const title = cfg?.title || 'AI MAGIC & EFFECTS';

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

  // Account for the caption line under the image.
  const gridRowHeight = height + 44;

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
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">{title}</h2>
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

            <div ref={tabsRef} className={`overflow-x-auto ${styles.hideScrollbar} px-10`}>
              <div className="flex gap-2 min-w-max py-1">
                {tabs.map((tab) => {
                  const isSelected = tab.value === regionDriver;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedRegion(tab.value)}
                      className={`px-4 py-2 rounded-xl border transition-all duration-300 text-xs font-bold whitespace-nowrap ${
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {(isTailorsLoading && tailors.length === 0 ? Array.from({ length: maxItems }) : tailors).map((tailor: any, i: number) => {
          if (!tailor) {
            return (
              <div
                key={`tailor-skeleton-${i}`}
                className="flex flex-col rounded-3xl bg-[#0b111b] border border-white/10 shadow-2xl p-3 gap-4"
              >
                <div className={`aspect-[4/5] rounded-[2.5rem] bg-white/5 border border-white/10 ${styles.shimmer}`} />
                <div className="space-y-2">
                  <div className={`h-5 w-3/4 rounded-lg bg-white/5 ${styles.shimmer}`} />
                  <div className={`h-4 w-1/2 rounded-lg bg-white/5 ${styles.shimmer}`} />
                </div>
              </div>
            );
          }

          const id = String(tailor.id ?? tailor.uid ?? tailor.userId ?? `tailor-${i}`);
          const name = String(tailor.name ?? 'Tailor');
          const image = tailor.image as string | undefined;
          const rating = typeof tailor.rating === 'number' ? tailor.rating : null;
          const specialization = typeof tailor.specialization === 'string' ? tailor.specialization : '';
          const experience = typeof tailor.experience === 'string' ? tailor.experience : '';
          const location = typeof tailor.location === 'string' ? tailor.location : '';
          const tailorRegion = typeof tailor.region === 'string' ? tailor.region : '';
          const reviewsCount = typeof tailor.reviewsCount === 'number' ? tailor.reviewsCount : null;

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
              <div className="flex h-full flex-col rounded-3xl bg-[#0b111b] border border-white/10 shadow-2xl p-3 transition-colors duration-300 group-hover:border-white/20">
                {/* Image Container */}
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900 shadow-xl transition-transform duration-500 group-hover:-translate-y-1">
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
                    <div className="px-3 py-1 rounded-xl bg-white text-black text-[11px] font-black italic tracking-tighter shadow-2xl">
                      NEW
                    </div>
                  </div>

                  {/* Subtle Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Content Row */}
                <div className="flex items-start justify-between px-1 pt-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-bold text-white truncate group-hover:text-blue-400 transition-colors duration-300">
                      {name}
                    </div>
                    <div className="text-sm text-white/60 truncate mt-0.5 font-medium">
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
      </div>

      {tailors.length >= maxItems && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => navigate('/tailors')}
            className="group flex items-center gap-3 px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            <span>عرض جميع الخياطين</span>
            <div className="p-1 rounded-full bg-white/10 group-hover:bg-blue-500 transition-colors">
              <ChevronRight size={16} />
            </div>
          </button>
        </div>
      )}
    </section>
  );
}
