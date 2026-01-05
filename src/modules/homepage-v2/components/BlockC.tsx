import React from 'react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLayoutStore } from '../store/useLayoutStore';
import { usePopularRegions, useFilteredTailors } from '../../../hooks/useHomeData';
import { useAppStore } from '../../../store/useAppStore';
import { useApp } from '../../../../context/AppContext';
import styles from './homepageV2.module.css';

const ACCENT = '#D4AF37';

type RegionTab = { id: string; name: string; value: string | null };

export default function BlockC() {
  const navigate = useNavigate();
  const { appSettings } = useApp();

  const selectedRegion = useAppStore((s) => s.homeCache.selectedRegion);
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

  const cardsRef = React.useRef<HTMLDivElement | null>(null);
  const cardScrollStep = width + cardGapPx;
  const scrollCards = React.useCallback((dir: -1 | 1) => {
    cardsRef.current?.scrollBy({ left: dir * cardScrollStep, behavior: 'smooth' });
  }, [cardScrollStep]);

  return (
    <section className="py-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} color={ACCENT} />
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">{title}</h2>
          </div>
          <p className="mt-1 text-sm text-white/60">
            Big-budget visual effects, from explosions to surreal transformations.
          </p>
        </div>

        <div className="relative w-full lg:max-w-[820px]">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/40 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/40 to-transparent" />

            <button
              type="button"
              aria-label="Scroll tabs left"
              onClick={() => scrollTabs(1)}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <ChevronLeft size={18} className="mx-auto" />
            </button>

            <button
              type="button"
              aria-label="Scroll tabs right"
              onClick={() => scrollTabs(-1)}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <ChevronRight size={18} className="mx-auto" />
            </button>

            <div ref={tabsRef} className={`overflow-x-auto ${styles.hideScrollbar} px-12`}>
              <div className="flex gap-2 min-w-max py-1">
                {tabs.map((tab) => {
                  const isSelected = tab.value === regionDriver;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedRegion(tab.value)}
                      className={`px-3 py-2 rounded-lg border transition text-xs whitespace-nowrap ${
                        isSelected
                          ? 'border-white/20 bg-white/10 text-white'
                          : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
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

      <div className="relative group">
        <button
          type="button"
          aria-label="Scroll cards left"
          onClick={() => scrollCards(1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
        >
          <ChevronLeft size={18} className="mx-auto" />
        </button>

        <button
          type="button"
          aria-label="Scroll cards right"
          onClick={() => scrollCards(-1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
        >
          <ChevronRight size={18} className="mx-auto" />
        </button>

        <div ref={cardsRef} className={`overflow-x-auto ${styles.hideScrollbar}`}>
          <div
            className="grid pb-2 min-w-max"
            style={{
              gridAutoFlow: 'column',
              gridAutoColumns: `${width}px`,
              gridTemplateRows: `repeat(${maxRows}, ${gridRowHeight}px)`,
              gap: cardGapPx,
            }}
          >
            {(isTailorsLoading && tailors.length === 0 ? Array.from({ length: maxItems }) : tailors).map((tailor: any, i: number) => {
              if (!tailor) {
                return (
                  <article
                    key={`tailor-skeleton-${i}`}
                    className="relative overflow-hidden rounded-lg bg-white/5 border border-white/10"
                    style={{ height: gridRowHeight, borderRadius: cardRadiusPx }}
                  />
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
                  className="group relative cursor-pointer"
                  onClick={() => navigate(`/tailor/${encodeURIComponent(id)}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate(`/tailor/${encodeURIComponent(id)}`);
                  }}
                >
                  <div
                    className="relative overflow-hidden rounded-lg bg-slate-900 border border-white/5 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                    style={{ height, borderRadius: cardRadiusPx }}
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-2xl">🧵</div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    <div className="absolute top-2 left-2 text-[10px] font-black px-2 py-1 rounded-full bg-black/70 border border-white/10 text-white">
                      {rating ? `★ ${rating.toFixed(1)}` : 'خياط'}
                    </div>

                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="absolute inset-0 bg-black/35" />
                      <div className="absolute bottom-2 left-2 right-2 space-y-1">
                        {specialization ? (
                          <div className="text-[12px] font-semibold text-white/95 line-clamp-1">{specialization}</div>
                        ) : null}
                        {experience ? (
                          <div className="text-[11px] text-white/75 line-clamp-1">{experience}</div>
                        ) : null}
                        {regionLabel ? <div className="text-[11px] text-white/75 line-clamp-1">{regionLabel}</div> : null}
                        {typeof reviewsCount === 'number' ? (
                          <div className="text-[10px] text-white/70">{reviewsCount} تقييمات</div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 min-h-[32px]">
                    <div className="text-[12px] font-semibold text-white/80 leading-tight line-clamp-1">{name}</div>
                    {regionLabel ? <div className="mt-0.5 text-[11px] text-white/45 leading-tight line-clamp-1">{regionLabel}</div> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
