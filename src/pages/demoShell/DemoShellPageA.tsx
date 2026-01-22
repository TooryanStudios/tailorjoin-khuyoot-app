import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FabricMaterial, Product } from '../../../types';
import { useThumbnail } from '../../hooks/useThumbnailCache';
import { useMobileDetection } from '../../modules/designer/mobile';
import { DemoShellPageAMobile } from './DemoShellPageA.Mobile';
import { DemoShellPageADesktop } from './DemoShellPageA.Desktop';

// ========== MAIN WRAPPER COMPONENT ==========
export function DemoShellPageA() {
  const isMobile = useMobileDetection();
  
  return (
    <>
      {isMobile ? <DemoShellPageAMobile /> : <DemoShellPageADesktop />}
    </>
  );
}

// ========== SHARED COMPONENTS FOR BOTH VERSIONS ==========

type PromoTile = {
  id: string;
  title: string;
  imageUrl?: string;
  href: string;
};

const PromoTileCard = React.memo(function PromoTileCard({ tile }: { tile: PromoTile }) {
  const navigate = useNavigate();
  const displaySrc = useThumbnail(tile.imageUrl || null, { maxEntries: 60 });

  return (
    <button
      type="button"
      onClick={() => navigate(tile.href)}
      className="group/promo relative snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-shadow duration-200 ease-out hover:shadow-xl hover:border-purple-300/70 dark:border-white/10 dark:bg-zinc-900/60"
    >
      <div className="relative h-[180px] w-[250px] sm:h-[210px] sm:w-[290px]">
        {displaySrc || tile.imageUrl ? (
          <img
            src={displaySrc || tile.imageUrl}
            alt={tile.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover/promo:scale-[1.05] group-hover/promo:-translate-y-0.5"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-purple-950/50" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="text-sm font-bold text-white drop-shadow-sm line-clamp-1">{tile.title}</div>
        </div>
      </div>
      <div className="absolute inset-0 ring-1 ring-transparent group-hover/promo:ring-white/10 transition" />
    </button>
  );
});

export const DiscoverDesignerPromo = React.memo(function DiscoverDesignerPromo({ tiles }: { tiles: PromoTile[] }) {
  const { t } = useTranslation(['home']);
  const navigate = useNavigate();
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  const scrollByTiles = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <section className="relative rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-purple-100 shadow-sm overflow-hidden group dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-purple-950/35">
      <div className="relative p-5 lg:pr-[400px]">
        <div
          ref={scrollerRef}
          className="flex gap-[4px] overflow-x-auto pb-2 snap-x scroll-smooth min-w-0"
          style={{ scrollbarGutter: 'stable' }}
        >
          {tiles.map((t) => (
            <PromoTileCard key={t.id} tile={t} />
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByTiles(-1)}
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-slate-200 text-slate-600 hover:bg-slate-50 transition opacity-0 group-hover:opacity-100 dark:bg-zinc-900/90 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label={t('home:scrollLeft')}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => scrollByTiles(1)}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-slate-200 text-slate-600 hover:bg-slate-50 transition lg:right-[400px] opacity-0 group-hover:opacity-100 dark:bg-zinc-900/90 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label={t('home:scrollRight')}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="p-5 pt-0 lg:pt-5 lg:absolute lg:inset-y-0 lg:right-0 lg:w-[400px] lg:bg-black/5 dark:lg:bg-black/20">
        <div className="h-full flex flex-col justify-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-slate-900 dark:text-white">
            {t('home:discoverDesignersTitle')}
            <span className="block text-purple-700 dark:text-purple-300 text-sm sm:text-base font-semibold">{t('home:discoverDesignersSubtitle')}</span>
          </h2>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate('/designer-v2-1')}
              className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition shadow-lg shadow-purple-600/20"
            >
              {t('home:exploreMore')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});

const LatestFabricTile = React.memo(function LatestFabricTile({ material }: { material: FabricMaterial }) {
  const { t } = useTranslation(['home']);
  const displaySrc = useThumbnail(material.image, { maxEntries: 100 });
  const priceLabel = typeof material.price === 'number' ? `${material.price} ر.ع` : undefined;

  return (
    <article className="snap-start w-[220px] sm:w-[240px]">
      <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/50">
        <div className="relative w-full aspect-[16/9] bg-zinc-900">
          {displaySrc ? (
            <img
              src={displaySrc}
              alt={material.name}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-purple-950/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        </div>

        <div className="px-3 py-2">
          <div className="text-xs font-bold text-zinc-100 truncate">{material.name}</div>
          <div className="mt-0.5 text-[11px] text-zinc-400 truncate">
            {priceLabel ? priceLabel : t('home:fabricLabel')}
          </div>
        </div>
      </div>
    </article>
  );
});

export const LatestFabricsRail = React.memo(function LatestFabricsRail({ fabrics }: { fabrics: FabricMaterial[] }) {
  const { t } = useTranslation(['home']);
  const navigate = useNavigate();
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const [metrics, setMetrics] = React.useState({
    scrollLeft: 0,
    scrollWidth: 0,
    clientWidth: 0,
  });

  const syncMetrics = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setMetrics({
      scrollLeft: el.scrollLeft,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    });
  }, []);

  React.useEffect(() => {
    syncMetrics();
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        syncMetrics();
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(() => syncMetrics());
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', onScroll as any);
      ro.disconnect();
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [syncMetrics]);

  const maxScroll = Math.max(0, metrics.scrollWidth - metrics.clientWidth);
  const progress = maxScroll > 0 ? Math.min(1, Math.max(0, metrics.scrollLeft / maxScroll)) : 0;
  const thumbPct = metrics.scrollWidth > 0 ? Math.max(12, Math.round((metrics.clientWidth / metrics.scrollWidth) * 100)) : 100;
  const thumbLeftPct = Math.round(progress * (100 - thumbPct));

  const scrollByPx = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  const onTrackClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;

    const track = event.currentTarget;
    const rect = track.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const ratio = rect.width > 0 ? x / rect.width : 0;
    el.scrollTo({ left: ratio * maxScroll, behavior: 'smooth' });
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-950 to-purple-950/20 p-5 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-zinc-100 text-right">
          <Sparkles className="h-4 w-4 text-purple-300" />
          <h2 className="text-sm sm:text-base font-extrabold">{t('home:latestFabrics')}</h2>
        </div>

        <button
          type="button"
          onClick={() => navigate('/tailor-materials')}
          className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          {t('home:viewAll')}
        </button>
      </div>

      {fabrics.length > 0 ? (
        <>
          <div
            ref={scrollerRef}
            className="mt-4 flex gap-3 overflow-x-auto pb-3 snap-x scroll-smooth"
            style={{ scrollbarGutter: 'stable' }}
          >
            {fabrics.map((material) => (
              <button
                key={material.id}
                type="button"
                onClick={() => navigate('/tailor-materials')}
                className="focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-xl"
              >
                <LatestFabricTile material={material} />
              </button>
            ))}
          </div>

          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollByPx(-1)}
              className="h-7 w-7 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900 transition"
              aria-label={t('home:scrollLeft')}
            >
              ‹
            </button>

            <div
              className="relative h-2 flex-1 rounded-full bg-zinc-800/60 border border-white/5 cursor-pointer"
              onClick={onTrackClick}
              role="presentation"
            >
              <div
                className="absolute top-0 h-full rounded-full bg-zinc-500/80"
                style={{ width: `${thumbPct}%`, left: `${thumbLeftPct}%` }}
              />
            </div>

            <button
              type="button"
              onClick={() => scrollByPx(1)}
              className="h-7 w-7 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900 transition"
              aria-label={t('home:scrollRight')}
            >
              ›
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4 text-center text-sm text-zinc-400">{t('home:comingSoon')}</div>
      )}
    </section>
  );
});

export const HomeAdsRow = React.memo(function HomeAdsRow() {
  const { t } = useTranslation(['home']);

  return (
    <section className="rounded-2xl border border-zinc-950 bg-gradient-to-br from-zinc-950/50 via-zinc-950/30 to-transparent p-5 shadow-sm">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-bold text-zinc-100">{t('home:inAppOffersTitle')}</h2>
        <p className="text-sm text-zinc-400">{t('home:inAppOffersDesc')}</p>
      </div>
    </section>
  );
});
