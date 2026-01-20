import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Heart, MapPin, Play, Sparkles, Star, User, Mail, Phone, Instagram, Twitter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DemoShellOutletContext } from './DemoShellLayout';
import type { FabricMaterial, Product, Tailor } from '../../../types';
import { useThumbnail } from '../../hooks/useThumbnailCache';
import { useApp } from '../../../context/AppContext';

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

const DiscoverDesignerPromo = React.memo(function DiscoverDesignerPromo({ tiles }: { tiles: PromoTile[] }) {
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

const LocalFabricCard = React.memo(function LocalFabricCard({ material }: { material: FabricMaterial }) {
  const displaySrc = useThumbnail(material.image, { maxEntries: 100 });
  const priceLabel = typeof material.price === 'number' ? `${material.price} ر.ع` : undefined;

  return (
    <article className="snap-start min-w-[168px] sm:min-w-[190px] rounded-lg overflow-hidden bg-white border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="relative w-full aspect-square">
        <img
          src={displaySrc || material.image}
          alt={material.name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <h3 className="text-sm font-bold text-white line-clamp-2 drop-shadow-sm">{material.name}</h3>
          {priceLabel && <div className="mt-1 text-xs font-semibold text-white/90">{priceLabel}</div>}
        </div>
      </div>
    </article>
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

const LatestFabricsRail = React.memo(function LatestFabricsRail({ fabrics }: { fabrics: FabricMaterial[] }) {
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
        <div className="mt-4 flex items-center justify-center">
          <div className="text-center text-zinc-400">
            <div className="text-sm font-semibold text-zinc-200">{t('home:comingSoon')}</div>
            <div className="mt-1 text-xs">{t('home:fabricsComingSoon')}</div>
          </div>
        </div>
      )}
    </section>
  );
});

const AdVideoThumb = React.memo(function AdVideoThumb({
  src,
  poster,
}: {
  src: string;
  poster?: string;
}) {
  return (
    <div className="relative w-[152px] sm:w-[170px] aspect-square shrink-0 bg-zinc-900 overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover block transition-transform duration-500 ease-out group-hover/ad:scale-[1.06] group-hover/ad:rotate-[0.35deg]"
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
          <Play className="h-5 w-5 text-white fill-white" />
        </div>
      </div>
    </div>
  );
});

const HomeAdCard = React.memo(function HomeAdCard({
  title,
  description,
  to,
  media,
}: {
  title: string;
  description: string;
  to?: string;
  media: React.ReactNode;
}) {
  const { t } = useTranslation(['home']);
  const navigate = useNavigate();
  const Inner = (
    <div className="h-full rounded-lg overflow-hidden border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-950 to-purple-950/20 shadow-sm transition-transform duration-300 ease-out group-hover/ad:-translate-y-1 group-hover/ad:shadow-2xl group-hover/ad:border-purple-300/70">
      <div className="flex items-stretch">
        <div className="flex-1 min-w-0 p-4">
              <div className="text-base sm:text-lg font-extrabold text-zinc-100 leading-tight">{title}</div>
              <div className="mt-1 text-sm text-zinc-400 line-clamp-2">{description}</div>
          {to ? <div className="mt-3 text-xs font-semibold text-purple-300">{t('home:exploreArrow')}</div> : null}
        </div>

        <div className="relative shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-400/5 to-purple-300/15 opacity-0 group-hover/ad:opacity-100 transition-opacity duration-500" />
          {media}
        </div>
      </div>
    </div>
  );

  if (to) {
    return (
      <button
        type="button"
        onClick={() => navigate(to)}
        className="group/ad block text-left focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-lg"
      >
        {Inner}
      </button>
    );
  }

  return <div className="group/ad">{Inner}</div>;
});

const HomeAdsRow = React.memo(function HomeAdsRow() {
  const { t } = useTranslation(['home']);
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <HomeAdCard
        title={t('home:designer21Title')}
        description={t('home:designer21Desc')}
        media={<AdVideoThumb src="/videos/designer/Comparison_01.mp4" poster="/logo_big.png?v=4" />}
        to="/designer-v2-1"
      />

      <HomeAdCard
        title={t('home:inAppOffersTitle')}
        description={t('home:inAppOffersDesc')}
        media={<AdVideoThumb src="/videos/designer/0114.mp4" poster="/logo_big.png?v=4" />}
      />
    </section>
  );
});

const ProductCard = React.memo(function ProductCard({ product }: { product: Product }) {
  const { t } = useTranslation(['home']);
  const { user, toggleAuthModal } = useApp();
  const displaySrc = useThumbnail(product.image, { maxEntries: 100 });
  const priceLabel = typeof product.price === 'number' ? `${product.price} ر.ع` : undefined;
  // Generate random likes between 100-500 for demo
  const likesCount = React.useMemo(() => Math.floor(Math.random() * 400) + 100, []);
  const [isLiked, setIsLiked] = React.useState(false);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toggleAuthModal(true, 'login');
      return;
    }
    
    setIsLiked(!isLiked);
  };

  return (
    <article className="group/product rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 transition-shadow duration-250 ease-out shadow-sm hover:shadow-2xl hover:border-purple-300/70">
      <div className="relative w-full aspect-[3/4]">
        <img
          src={displaySrc || product.image}
          alt={product.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover/product:scale-[1.04]"
          loading="lazy"
          decoding="async"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        <button
          type="button"
          onClick={handleLikeClick}
          aria-label={isLiked ? t('home:unlike') : t('home:like')}
          className="group absolute bottom-2 left-2 z-50 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full text-sm font-semibold transition-all hover:bg-black/50 hover:scale-105 cursor-pointer active:scale-95"
        >
          <Heart 
            className={`h-4 w-4 transition-all pointer-events-none ${isLiked ? 'fill-red-500 text-red-500' : 'text-white group-hover:text-red-400'}`}
          />
          <span className="text-white pointer-events-none">{likesCount}</span>
        </button>

        <div className="absolute inset-x-0 bottom-0 p-2.5 pt-10">
          <h3 className="text-sm font-bold text-white line-clamp-2 drop-shadow-sm">{product.name}</h3>

          {priceLabel && (
            <div className="mt-1 text-xs font-semibold text-white/90">{priceLabel}</div>
          )}
        </div>
      </div>
    </article>
  );
});

const TailorPill = React.memo(function TailorPill({ tailor, regionName, isNew }: { tailor: Tailor; regionName?: string; isNew?: boolean }) {
  const { t } = useTranslation(['home']);
  const src = tailor.image || tailor.profileImage || null;
  const displaySrc = useThumbnail(src, { maxEntries: 100 });

  return (
    <article className="group/pill snap-start w-[180px] flex-shrink-0 rounded-2xl border border-zinc-950 bg-zinc-900/40 overflow-hidden flex flex-col h-[264px] relative transition-shadow duration-200 ease-out hover:shadow-xl hover:border-purple-300/70">
      {isNew && (
        <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-xs font-semibold px-2.5 py-1 rounded-sm shadow-lg">
          <span className="animate-pulse">{t('home:newBadge')}</span>
        </div>
      )}
      <div className="relative w-full h-[180px] shrink-0">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={tailor.name}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover/pill:scale-[1.06] group-hover/pill:-translate-y-0.5"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 border-b border-zinc-950">
            <User className="h-12 w-12 text-zinc-400" />
          </div>
        )}
      </div>

      <div className="relative px-3 pt-2 pb-3 flex-1 flex flex-col">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-6 bg-gradient-to-t from-black/25 via-black/5 to-transparent" />

        <div className="relative flex-1 flex flex-col">
          <h3 className="mt-auto mb-0.5 text-[13px] font-normal text-zinc-100 leading-snug line-clamp-1 text-right">{tailor.name}</h3>

          <div className="mt-1 h-px w-full bg-gradient-to-l from-transparent via-white/10 to-transparent" />

          <div className="mt-1 flex items-center justify-between gap-2">
            {(regionName || tailor.location) ? (
              <div className="min-w-0 flex items-center gap-1 text-[11px] text-zinc-400" dir="rtl">
                <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">{regionName || tailor.location}</span>
              </div>
            ) : (
              <div className="min-w-0" />
            )}

            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-200" dir="ltr">
              <Star className="h-3.5 w-3.5 fill-current text-purple-200" />
              {tailor.rating?.toFixed(1) ?? '—'}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});

function getRegionName(tailor: Tailor, regions: Array<{ id: string; name: string }>) {
  if ((tailor as any).regionId) {
    const region = regions.find((r) => r.id === (tailor as any).regionId);
    if (region) return region.name;
  }
  if (tailor.region) return String(tailor.region);
  return undefined;
}

export function DemoShellPageA() {
  const { user, togglePrivacyModal, toggleTermsModal, toggleReturnPolicyModal } = useApp();
  const { t } = useTranslation(['home']);
  const navigate = useNavigate();
  const {
    dbProducts,
    isDbLoading,
    dbTailors,
    isTailorsLoading,
    dbRegions,
    isRegionsLoading,
  } = useOutletContext<DemoShellOutletContext>();

  const [selectedRegionId, setSelectedRegionId] = React.useState<string | null>(null);

  const filteredTailors: Tailor[] = React.useMemo(() => {
    if (!selectedRegionId) return (dbTailors || []) as Tailor[];
    return ((dbTailors || []) as Tailor[]).filter((t) => (t as any).regionId === selectedRegionId);
  }, [selectedRegionId, dbTailors]);

  const recentFabrics = React.useMemo(() => {
    if (!user?.id) return [] as FabricMaterial[];

    try {
      const raw = window.localStorage.getItem(`materials_${user.id}`);
      if (!raw) return [] as FabricMaterial[];
      const parsed = JSON.parse(raw);
      const list: FabricMaterial[] = Array.isArray(parsed) ? (parsed as FabricMaterial[]) : [];

      return list
        .filter((m) => m && (m as any).type === 'fabric')
        .sort((a, b) => {
          const aTs = Date.parse((a as any).updatedAt || (a as any).createdAt || '') || 0;
          const bTs = Date.parse((b as any).updatedAt || (b as any).createdAt || '') || 0;
          return bTs - aTs;
        })
        .slice(0, 10);
    } catch {
      return [] as FabricMaterial[];
    }
  }, [user?.id]);

  const promoTiles = React.useMemo(() => {
    const products = (dbProducts || []) as Product[];
    const fromProducts: PromoTile[] = products.slice(0, 3).map((p) => ({
      id: `product-${p.id}`,
      title: p.name,
      imageUrl: p.image,
      href: `/product/${p.id}`,
    }));

    if (fromProducts.length >= 3) return fromProducts;

    const fallback: PromoTile[] = [
      { id: 'promo-1', title: t('home:promoFastDesign'), href: '/designer-v2-1' },
      { id: 'promo-2', title: t('home:promoTemplates'), href: '/designer-v2-1' },
      { id: 'promo-3', title: t('home:promoRealistic'), href: '/designer-v2-1' },
    ];

    return [...fromProducts, ...fallback].slice(0, 3);
  }, [dbProducts, t]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 shadow-sm overflow-hidden">
        <div className="relative w-full h-[140px] sm:h-[180px] bg-zinc-900">
          <img
            src="/images/Khyuoot_Bannar.png"
            alt="Khuyoot"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-950 bg-zinc-900/30 p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3 px-2">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">{t('home:topTailorsByRegion')}</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/tailors')}
            className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
          >
            {t('home:allTailors')}
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 snap-x px-2">
          <button
            type="button"
            onClick={() => setSelectedRegionId(null)}
            className={`snap-start px-4 py-2 rounded-lg border text-sm font-normal whitespace-nowrap transition-colors ${
              selectedRegionId === null
                ? 'border-purple-500 bg-purple-500 text-white'
                : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900'
            }`}
          >
            {t('home:all')}
          </button>

          {(dbRegions || []).map((region: any) => (
            <button
              key={region.id}
              type="button"
              onClick={() => setSelectedRegionId(region.id)}
              className={`snap-start px-4 py-2 rounded-lg border text-sm font-normal whitespace-nowrap transition-colors ${
                selectedRegionId === region.id
                  ? 'border-purple-500 bg-purple-500 text-white'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              {region.name}
            </button>
          ))}

          {isRegionsLoading && (
            <div className="snap-start px-4 py-2 rounded-full border border-zinc-800 bg-zinc-950 text-sm font-semibold text-zinc-400">
              {t('home:loading')}
            </div>
          )}
        </div>

        {isTailorsLoading && (!dbTailors || dbTailors.length === 0) ? (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 px-2 scrollbar-hide">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={`tailor-skeleton-${i}`}
                className="min-w-[200px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative group/rail">
            <button
              type="button"
              onClick={(e) => {
                const container = e.currentTarget.nextElementSibling as HTMLElement;
                container?.scrollBy({ left: -300, behavior: 'smooth' });
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-zinc-900/90 border border-zinc-700 flex items-center justify-center opacity-0 group-hover/rail:opacity-100 transition-opacity hover:bg-zinc-800"
              aria-label={t('home:scrollLeft')}
            >
              <svg className="h-5 w-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 snap-x px-2 scrollbar-hide">
              {filteredTailors.slice(0, 12).map((tailor, index) => (
                <button
                  key={tailor.id}
                  type="button"
                  onClick={() => navigate(`/tailor/${tailor.id}`)}
                  className="focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-2xl"
                >
                  <TailorPill tailor={tailor} regionName={getRegionName(tailor, (dbRegions || []) as any)} isNew={index === 0} />
                </button>
              ))}

            {!isTailorsLoading && filteredTailors.length === 0 && (
              <div className="w-full py-10 text-center text-slate-600 dark:text-slate-400">
                <p className="text-sm font-semibold">{t('home:noResultsRegionTitle')}</p>
                <p className="mt-1 text-xs">{t('home:noResultsRegionSubtitle')}</p>
              </div>
            )}
          </div>          <button
            type="button"
            onClick={(e) => {
              const container = e.currentTarget.previousElementSibling as HTMLElement;
              container?.scrollBy({ left: 300, behavior: 'smooth' });
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-zinc-900/90 border border-zinc-700 flex items-center justify-center opacity-0 group-hover/rail:opacity-100 transition-opacity hover:bg-zinc-800"
            aria-label={t('home:scrollRight')}
          >
            <svg className="h-5 w-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>        )}
      </section>

      <DiscoverDesignerPromo tiles={promoTiles} />

      <HomeAdsRow />

      <section className="rounded-lg border border-zinc-950 bg-zinc-900/30 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">{t('home:selectedProducts')}</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/collections')}
            className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
          >
            {t('home:viewAll')}
          </button>
        </div>

        {isDbLoading && (!dbProducts || dbProducts.length === 0) ? (
          <div className="mt-4 grid gap-1.5 grid-cols-2 sm:[grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={`product-skeleton-${i}`}
                className="rounded-lg overflow-hidden bg-zinc-900"
              >
                <div className="w-full aspect-[3/4] bg-zinc-800 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 grid gap-1.5 grid-cols-2 sm:[grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
            {(dbProducts as Product[]).slice(0, 12).map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  navigate(`/product/${product.id}`);
                }}
                className="focus:outline-none focus:ring-2 focus:ring-purple-500/60 rounded-lg cursor-pointer"
              >
                <ProductCard product={product} />
              </div>
            ))}
            {(!dbProducts || dbProducts.length === 0) && (
              <div className="col-span-full py-10 text-center text-zinc-400">
                <p className="text-sm font-semibold">{t('home:noProductsTitle')}</p>
                <p className="mt-1 text-xs">{t('home:noProductsSubtitle')}</p>
              </div>
            )}
          </div>
        )}
      </section>

      <LatestFabricsRail fabrics={recentFabrics} />

      <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-950 to-purple-950/35 p-6 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.10),transparent_42%),radial-gradient(circle_at_75%_0%,rgba(124,58,237,0.06),transparent_38%)]" />
        <div className="relative text-center space-y-1">
          <h2 className="text-xl font-extrabold text-white">{t('home:contactUs')}</h2>
          <p className="text-sm text-zinc-300">{t('home:contactSubtitle')}</p>
        </div>

        <div className="relative mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="group/contact flex h-12 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-100 transition hover:border-purple-300/70 hover:bg-white/10"
          >
            <span>{t('home:settings')}</span>
            <Mail className="h-4 w-4 text-purple-200 transition-transform group-hover/contact:scale-110" />
          </button>
          <button
            onClick={() => togglePrivacyModal(true)}
            className="group/contact flex h-12 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-100 transition hover:border-purple-300/70 hover:bg-white/10 cursor-pointer"
          >
            <span>{t('home:privacyPolicy')}</span>
            <Sparkles className="h-4 w-4 text-purple-200 transition-transform group-hover/contact:scale-110" />
          </button>
          <button
            onClick={() => toggleTermsModal(true)}
            className="group/contact flex h-12 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-100 transition hover:border-purple-300/70 hover:bg-white/10 cursor-pointer"
          >
            <span>{t('home:terms')}</span>
            <Sparkles className="h-4 w-4 text-purple-200 transition-transform group-hover/contact:scale-110" />
          </button>
          <button
            onClick={() => toggleReturnPolicyModal(true)}
            className="group/contact flex h-12 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-100 transition hover:border-purple-300/70 hover:bg-white/10 cursor-pointer"
          >
            <span>{t('home:returnPolicy')}</span>
            <Sparkles className="h-4 w-4 text-purple-200 transition-transform group-hover/contact:scale-110" />
          </button>
        </div>

        <div className="relative mt-4 flex flex-wrap gap-3 justify-center text-[12px] text-zinc-200 w-full" dir="rtl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <Mail className="h-4 w-4 text-purple-200" />
            <span className="font-semibold text-zinc-100">info@khuyoot.com</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <Phone className="h-4 w-4 text-purple-200" />
            <span className="font-semibold text-zinc-100" dir="ltr">+965 1234 5678</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <Instagram className="h-4 w-4 text-purple-200" />
            <span className="font-semibold text-zinc-100" dir="ltr">@khuyoot</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <Twitter className="h-4 w-4 text-purple-200" />
            <span className="font-semibold text-zinc-100" dir="ltr">@khuyoot</span>
          </div>
        </div>

        <div className="relative mt-3 flex flex-wrap gap-2 justify-center text-[11px] text-zinc-400 w-full" dir="rtl">
          <button
            type="button"
            onClick={() => navigate('/privacy')}
            className="text-zinc-300 hover:text-white transition underline text-right"
          >
            {t('home:readFullPagePrivacy')}
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => navigate('/terms')}
            className="text-zinc-300 hover:text-white transition underline text-right"
          >
            {t('home:readFullPageTerms')}
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => navigate('/return-policy')}
            className="text-zinc-300 hover:text-white transition underline text-right"
          >
            {t('home:readFullPageReturn')}
          </button>
        </div>
      </section>

      <div className="py-3 text-center text-xs text-zinc-400" dir="rtl">
        {t('home:copyright')}
      </div>
    </div>
  );
}

