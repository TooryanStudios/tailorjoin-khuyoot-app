import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Heart, MapPin, Play, Sparkles, Star, User, Mail, Phone, Instagram, Twitter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DemoShellOutletContext } from './DemoShellLayout';
import type { FabricMaterial, Product, Tailor } from '../../../types';
import { useThumbnail } from '../../hooks/useThumbnailCache';
import { useApp } from '../../../context/AppContext';
import { TailorPill } from './DemoShellTopTailors';
import { HomeAdsRow, LatestFabricsRail, DiscoverDesignerPromo } from './DemoShellPageA';

type PromoTile = {
  id: string;
  title: string;
  imageUrl?: string;
  href: string;
};

const getRegionName = (tailor: Tailor, regions: any[]) => {
  const reg = regions.find((r) => r.id === (tailor as any).regionId);
  return reg?.name || 'Unknown';
};

const ProductCard = React.memo(function ProductCard({ product }: { product: Product }) {
  const displaySrc = useThumbnail(product.image, { maxEntries: 100 });

  return (
    <article className="group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/50 transition hover:shadow-lg hover:border-zinc-700">
      <div className="relative w-full aspect-[3/4] bg-zinc-900">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-purple-950/30" />
        )}
        {product.isNew && (
          <span className="absolute top-2 left-2 rounded-full bg-purple-600 px-2.5 py-1 text-xs font-bold text-white">
            جديد
          </span>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="text-sm font-semibold text-white truncate">
          {product.name}
        </h3>
        {product.price !== undefined && product.price !== null && (
          <p className="mt-1 text-xs font-bold text-purple-400">
            {product.price} ر.ع
          </p>
        )}
      </div>
    </article>
  );
});

export function DemoShellPageADesktop() {
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
            </div>
            <button
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
          </div>
        )}
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
