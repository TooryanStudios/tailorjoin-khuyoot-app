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
      className="group/promo relative snap-start overflow-hidden rounded-2xl border border-[var(--studio-card-border)] bg-[var(--studio-card)] text-left studio-card-hover"
    >
      <div className="relative h-[200px] w-[280px]">
        {displaySrc || tile.imageUrl ? (
          <img
            src={displaySrc || tile.imageUrl}
            alt={tile.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover/promo:scale-110"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-indigo-950/40" />
        )}

        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
          <div className="text-xs font-normal text-blue-400 uppercase tracking-widest mb-1 italic">Discover</div>
          <div className="text-sm font-normal text-white line-clamp-1">{tile.title}</div>
        </div>
      </div>
    </button>
  );
});

export const DiscoverDesignerPromo = React.memo(function DiscoverDesignerPromo({ tiles }: { tiles: PromoTile[] }) {
  const { t } = useTranslation(['home']);
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <section className="relative rounded-3xl border border-[var(--studio-card-border)] bg-[var(--studio-card)] overflow-hidden group">
      <div className="p-8">
        <div className="mb-6 flex flex-col gap-2">
          <h3 className="text-2xl tracking-tight text-[var(--studio-text)]">Create Your Signature Look</h3>
          <p className="text-sm text-[var(--studio-text-muted)] max-w-lg font-normal">Our interactive workshop allows you to bring your envision to life with our master tailors.</p>
        </div>

        <div
          ref={scrollerRef}
          className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide no-scrollbar -mx-2 px-2"
        >
          {tiles.map((t) => (
            <PromoTileCard key={t.id} tile={t} />
          ))}
        </div>
      </div>
      
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[120px] pointer-events-none" />
    </section>
  );
});

const LatestFabricTile = React.memo(function LatestFabricTile({ material }: { material: FabricMaterial }) {
  const { t } = useTranslation(['home']);
  const displaySrc = useThumbnail(material.image, { maxEntries: 100 });
  const priceLabel = typeof material.price === 'number' ? `${material.price} ر.ع` : undefined;

  return (
    <article className="snap-start w-[220px] sm:w-[240px]">
      <div className="rounded-xl overflow-hidden border border-[var(--studio-card-border)] bg-[var(--studio-card)]">
        <div className="relative w-full aspect-[16/9] bg-[var(--studio-card)]">
          {displaySrc ? (
            <img
              src={displaySrc}
              alt={material.name}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 bg-blue-600/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        </div>

        <div className="px-3 py-2">
          <div className="text-xs text-[var(--studio-text)] truncate">{material.name}</div>
          <div className="mt-0.5 text-[11px] text-[var(--studio-text-muted)] truncate">
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
          <h2 className="text-sm sm:text-base">{t('home:latestFabrics')}</h2>
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
        <h2 className="text-lg text-zinc-100">{t('home:inAppOffersTitle')}</h2>
        <p className="text-sm text-zinc-400 font-normal">{t('home:inAppOffersDesc')}</p>
      </div>
    </section>
  );
});
