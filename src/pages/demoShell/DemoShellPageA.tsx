import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { MapPin, Play, Sparkles, Star, User } from 'lucide-react';
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
  const displaySrc = useThumbnail(tile.imageUrl || null, { maxEntries: 60 });

  return (
    <Link
      to={tile.href}
      className="group relative snap-start overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
    >
      <div className="relative h-[180px] w-[250px] sm:h-[210px] sm:w-[290px]">
        {displaySrc || tile.imageUrl ? (
          <img
            src={displaySrc || tile.imageUrl}
            alt={tile.title}
            className="absolute inset-0 h-full w-full object-cover"
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
      <div className="absolute inset-0 ring-1 ring-transparent group-hover:ring-white/10 transition" />
    </Link>
  );
});

const DiscoverDesignerPromo = React.memo(function DiscoverDesignerPromo({ tiles }: { tiles: PromoTile[] }) {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  const scrollByTiles = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <section className="relative rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-950 to-purple-950/35 shadow-sm overflow-hidden">
      <div className="relative p-5 lg:pr-[400px]">
        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto pb-2 snap-x scroll-smooth min-w-0"
          style={{ scrollbarGutter: 'stable' }}
        >
          {tiles.map((t) => (
            <PromoTileCard key={t.id} tile={t} />
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByTiles(-1)}
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-black/45 border border-white/10 text-white hover:bg-black/55 transition"
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => scrollByTiles(1)}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-black/45 border border-white/10 text-white hover:bg-black/55 transition lg:right-[400px]"
          aria-label="Next"
        >
          ›
        </button>
      </div>

      <div className="p-5 pt-0 lg:pt-5 lg:absolute lg:inset-y-0 lg:right-0 lg:w-[400px] lg:bg-black/20">
        <div className="h-full flex flex-col justify-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white">
            اكتشف أفضل المصممين المتاحين
            <span className="block text-purple-300 text-sm sm:text-base font-semibold">والمصممين الأكثر رواجاً</span>
          </h2>
          <p className="mt-2 text-sm text-zinc-300">ابدأ التصميم خلال دقائق.</p>

          <div className="mt-4">
            <Link
              to="/designer-v2-1"
              className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition shadow-lg shadow-purple-600/20"
            >
              استكشف المزيد
            </Link>
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
    <article className="snap-start min-w-[168px] sm:min-w-[190px] rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
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
            {priceLabel ? priceLabel : 'قماش'}
          </div>
        </div>
      </div>
    </article>
  );
});

const LatestFabricsRail = React.memo(function LatestFabricsRail({ fabrics }: { fabrics: FabricMaterial[] }) {
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
          <h2 className="text-sm sm:text-base font-extrabold">أحدث الأقمشة</h2>
        </div>

        <Link
          to="/tailor-materials"
          className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-purple-600 text-white font-bold hover:bg-purple-500 transition"
        >
          عرض الكل
        </Link>
      </div>

      {fabrics.length > 0 ? (
        <>
          <div
            ref={scrollerRef}
            className="mt-4 flex gap-3 overflow-x-auto pb-3 snap-x scroll-smooth"
            style={{ scrollbarGutter: 'stable' }}
          >
            {fabrics.map((material) => (
              <Link
                key={material.id}
                to="/tailor-materials"
                className="focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-xl"
              >
                <LatestFabricTile material={material} />
              </Link>
            ))}
          </div>

          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollByPx(-1)}
              className="h-7 w-7 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900 transition"
              aria-label="Scroll left"
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
              aria-label="Scroll right"
            >
              ›
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4">
          <div className="flex gap-3 overflow-x-auto pb-3 snap-x scroll-smooth" style={{ scrollbarGutter: 'stable' }}>
            <div className="snap-start w-[220px] sm:w-[240px]">
              <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/50">
                <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-zinc-800 via-zinc-900 to-purple-950/30">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-black/30 border border-white/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-purple-300" />
                    </div>
                  </div>
                </div>

                <div className="px-3 py-2">
                  <div className="text-xs font-bold text-zinc-100 truncate">قريبًا</div>
                  <div className="mt-0.5 text-[11px] text-zinc-400 truncate">سيتم إضافة الأقمشة قريبًا</div>
                </div>
              </div>
            </div>
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
    <div className="relative w-[152px] sm:w-[170px] aspect-square shrink-0 bg-zinc-900">
      <video
        className="absolute inset-0 h-full w-full object-cover block"
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
  const Inner = (
    <div className="h-full rounded-lg overflow-hidden border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-950 to-purple-950/20 shadow-sm">
      <div className="flex items-stretch">
        <div className="flex-1 min-w-0 p-4">
          <div className="text-sm font-extrabold text-zinc-100">{title}</div>
          <div className="mt-1 text-xs text-zinc-400 line-clamp-1">{description}</div>
          {to ? <div className="mt-3 text-xs font-semibold text-purple-300">استكشف ›</div> : null}
        </div>

        <div className="shrink-0">
          {media}
        </div>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-lg">
        {Inner}
      </Link>
    );
  }

  return Inner;
});

const HomeAdsRow = React.memo(function HomeAdsRow() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <HomeAdCard
        title="المصمم 2.1"
        description="تجربة تصميم أسرع ونتائج أفضل."
        media={<AdVideoThumb src="/videos/designer/0114.mp4" poster="/logo.png" />}
        to="/designer-v2-1"
      />

      <HomeAdCard
        title="عروض داخل التطبيق"
        description="مساحة الإعلانات والعروض — قريبًا."
        media={<AdVideoThumb src="/videos/designer/Comparison_01.mp4" poster="/logo.png" />}
      />
    </section>
  );
});

const ProductCard = React.memo(function ProductCard({ product }: { product: Product }) {
  const displaySrc = useThumbnail(product.image, { maxEntries: 100 });
  const priceLabel = typeof product.price === 'number' ? `${product.price} ر.ع` : undefined;
  const ratingLabel = product.rating != null ? product.rating.toFixed(1) : undefined;

  return (
    <article className="rounded-lg overflow-hidden bg-zinc-900">
      <div className="relative w-full aspect-[3/4]">
        <img
          src={displaySrc || product.image}
          alt={product.name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <div className="flex items-end justify-between gap-2">
            <h3 className="text-sm font-bold text-white line-clamp-2 drop-shadow-sm">{product.name}</h3>
            {ratingLabel && (
              <span className="flex items-center gap-1 rounded-md bg-black/45 px-2 py-1 text-xs font-semibold text-white shrink-0 border border-white/10">
                <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                {ratingLabel}
              </span>
            )}
          </div>

          {priceLabel && (
            <div className="mt-1 text-xs font-semibold text-white/90">{priceLabel}</div>
          )}
        </div>
      </div>
    </article>
  );
});

const TailorPill = React.memo(function TailorPill({ tailor, regionName }: { tailor: Tailor; regionName?: string }) {
  const src = tailor.image || tailor.profileImage || null;
  const displaySrc = useThumbnail(src, { maxEntries: 100 });

  return (
    <article className="snap-start min-w-[200px] rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 min-h-[104px]">
      <div className="flex items-start gap-3">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={tailor.name}
            className="h-14 w-14 rounded-xl object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800">
            <User className="h-6 w-6 text-zinc-400" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-zinc-100 truncate">{tailor.name}</h3>
            <span className="flex items-center gap-1 text-xs font-semibold text-purple-300 shrink-0">
              <Star className="h-3.5 w-3.5 fill-current" />
              {tailor.rating?.toFixed(1) ?? '—'}
            </span>
          </div>

          {(regionName || tailor.location) && (
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
              <MapPin className="h-3.5 w-3.5 text-zinc-500" />
              <span className="truncate">{regionName || tailor.location}</span>
            </div>
          )}

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
  const { user } = useApp();
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
      { id: 'promo-1', title: 'تصميم سريع', href: '/designer-v2-1' },
      { id: 'promo-2', title: 'قوالب جاهزة', href: '/designer-v2-1' },
      { id: 'promo-3', title: 'نتائج واقعية', href: '/designer-v2-1' },
    ];

    return [...fromProducts, ...fallback].slice(0, 3);
  }, [dbProducts]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 shadow-sm overflow-hidden">
        <div className="relative w-full h-[140px] sm:h-[180px] bg-zinc-900">
          <img
            src="/og/khuyoot-og.jpg"
            alt="Khuyoot"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">أشهر الخياطين حسب المنطقة</h2>
          </div>
          <Link to="/tailors" className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors">
            كل الخياطين
          </Link>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 snap-x">
          <button
            type="button"
            onClick={() => setSelectedRegionId(null)}
            className={`snap-start px-4 py-2 rounded-2xl border text-sm font-normal whitespace-nowrap transition-colors ${
              selectedRegionId === null
                ? 'border-purple-500 bg-purple-500 text-white'
                : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900'
            }`}
          >
            الكل
          </button>

          {(dbRegions || []).map((region: any) => (
            <button
              key={region.id}
              type="button"
              onClick={() => setSelectedRegionId(region.id)}
              className={`snap-start px-4 py-2 rounded-2xl border text-sm font-normal whitespace-nowrap transition-colors ${
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
              جاري التحميل...
            </div>
          )}
        </div>

        {isTailorsLoading && (!dbTailors || dbTailors.length === 0) ? (
          <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
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
          <div className="mt-5 flex gap-4 overflow-x-auto pb-2 snap-x">
            {filteredTailors.slice(0, 12).map((tailor) => (
              <Link
                key={tailor.id}
                to={`/tailor/${tailor.id}`}
                className="focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-2xl"
              >
                <TailorPill tailor={tailor} regionName={getRegionName(tailor, (dbRegions || []) as any)} />
              </Link>
            ))}

            {!isTailorsLoading && filteredTailors.length === 0 && (
              <div className="w-full py-10 text-center text-slate-600 dark:text-slate-400">
                <p className="text-sm font-semibold">لا توجد نتائج لهذه المنطقة.</p>
                <p className="mt-1 text-xs">جرّب منطقة أخرى أو اختر “الكل”.</p>
              </div>
            )}
          </div>
        )}
      </section>

      <DiscoverDesignerPromo tiles={promoTiles} />

      <HomeAdsRow />

      <section className="rounded-lg border border-zinc-950 bg-zinc-900/30 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">منتجات مختارة</h2>
          </div>
          <Link to="/collections" className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors">
            عرض الكل
          </Link>
        </div>

        {isDbLoading && (!dbProducts || dbProducts.length === 0) ? (
          <div className="mt-4 grid gap-1.5 grid-cols-2 sm:[grid-template-columns:repeat(2,240px)] md:[grid-template-columns:repeat(3,240px)] lg:[grid-template-columns:repeat(4,240px)] justify-center">
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
          <div className="mt-4 grid gap-1.5 grid-cols-2 sm:[grid-template-columns:repeat(2,240px)] md:[grid-template-columns:repeat(3,240px)] lg:[grid-template-columns:repeat(4,240px)] justify-center">
            {(dbProducts as Product[]).slice(0, 12).map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="focus:outline-none focus:ring-2 focus:ring-purple-500/60 rounded-lg"
              >
                <ProductCard product={product} />
              </Link>
            ))}
            {(!dbProducts || dbProducts.length === 0) && (
              <div className="col-span-full py-10 text-center text-zinc-400">
                <p className="text-sm font-semibold">لا توجد منتجات متاحة حالياً.</p>
                <p className="mt-1 text-xs">جرّب مرة أخرى لاحقاً.</p>
              </div>
            )}
          </div>
        )}
      </section>

      <LatestFabricsRail fabrics={recentFabrics} />

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">تواصل معنا</h2>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <Link
            to="/settings"
            className="h-11 w-[190px] rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-200 font-semibold flex items-center justify-center hover:bg-zinc-900 transition"
          >
            الإعدادات
          </Link>
          <Link
            to="/privacy"
            className="h-11 w-[190px] rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-200 font-semibold flex items-center justify-center hover:bg-zinc-900 transition"
          >
            سياسة الخصوصية
          </Link>
          <Link
            to="/terms"
            className="h-11 w-[190px] rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-200 font-semibold flex items-center justify-center hover:bg-zinc-900 transition"
          >
            الشروط والأحكام
          </Link>
        </div>
      </section>

      <div className="py-3 text-center text-base text-zinc-300">
        © 2026 Studios. All rights reserved. This website is developed by Studios.
      </div>
    </div>
  );
}

