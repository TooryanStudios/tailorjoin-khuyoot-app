import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Mail, Phone, Instagram, Twitter, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DemoShellOutletContext } from './DemoShellLayout';
import type { FabricMaterial, Product, Tailor } from '../../../types';
import { useThumbnail } from '../../hooks/useThumbnailCache';
import { useApp } from '../../../context/AppContext';
import { TailorPill } from './DemoShellTopTailors';
import { HomeAdsRow, LatestFabricsRail } from './DemoShellPageA';

const getRegionName = (tailor: Tailor, regions: any[]) => {
  const reg = regions.find((r) => r.id === (tailor as any).regionId);
  return reg?.name || 'Unknown';
};

const ProductCard = React.memo(function ProductCard({ product }: { product: Product }) {
  const displaySrc = useThumbnail(product.image, { maxEntries: 100 });

  return (
    <article className="group rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900/50 transition hover:shadow-lg hover:border-zinc-700">
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
          <span className="absolute top-2 left-2 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white">
            جديد
          </span>
        )}
      </div>
      
      <div className="p-2">
        <h3 className="text-xs font-semibold text-white truncate">
          {product.name}
        </h3>
        {product.price !== undefined && product.price !== null && (
          <p className="mt-1 text-[11px] font-bold text-purple-400">
            {product.price} ر.ع
          </p>
        )}
      </div>
    </article>
  );
});

export function DemoShellPageAMobile() {
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

  return (
    <div className="space-y-4 pb-24">
      {/* Mobile Banner */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 shadow-sm overflow-hidden">
        <div className="relative w-full h-[120px] bg-zinc-900">
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

      {/* Top Tailors Section - Mobile Optimized */}
      <section className="rounded-2xl border border-zinc-950 bg-zinc-900/30 p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3 px-2">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">{t('home:topTailorsByRegion')}</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/tailors')}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
          >
            {t('home:allTailors')}
          </button>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 snap-x px-2">
          <button
            type="button"
            onClick={() => setSelectedRegionId(null)}
            className={`snap-start px-3 py-2 rounded-lg border text-xs font-normal whitespace-nowrap transition-colors ${
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
              className={`snap-start px-3 py-2 rounded-lg border text-xs font-normal whitespace-nowrap transition-colors ${
                selectedRegionId === region.id
                  ? 'border-purple-500 bg-purple-500 text-white'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              {region.name}
            </button>
          ))}

          {isRegionsLoading && (
            <div className="snap-start px-3 py-2 rounded-full border border-zinc-800 bg-zinc-950 text-xs font-semibold text-zinc-400">
              {t('home:loading')}
            </div>
          )}
        </div>

        {isTailorsLoading && (!dbTailors || dbTailors.length === 0) ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 px-2 scrollbar-hide">
            {[1, 2, 3].map((i) => (
              <div
                key={`tailor-skeleton-${i}`}
                className="min-w-[160px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"
              >
                <div className="flex items-start gap-2">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="h-2.5 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 snap-x px-2 scrollbar-hide">
            {filteredTailors.slice(0, 8).map((tailor, index) => (
              <button
                key={tailor.id}
                type="button"
                onClick={() => navigate(`/tailor/${tailor.id}`)}
                className="focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-2xl snap-start"
              >
                <TailorPill tailor={tailor} regionName={getRegionName(tailor, (dbRegions || []) as any)} isNew={index === 0} />
              </button>
            ))}

            {!isTailorsLoading && filteredTailors.length === 0 && (
              <div className="w-full py-6 text-center text-slate-600 dark:text-slate-400">
                <p className="text-xs font-semibold">{t('home:noResultsRegionTitle')}</p>
                <p className="mt-1 text-[11px]">{t('home:noResultsRegionSubtitle')}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Ads Section */}
      <HomeAdsRow />

      {/* Selected Products Section - Mobile Grid */}
      <section className="rounded-lg border border-zinc-950 bg-zinc-900/30 p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">{t('home:selectedProducts')}</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/collections')}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
          >
            {t('home:viewAll')}
          </button>
        </div>

        {isDbLoading && (!dbProducts || dbProducts.length === 0) ? (
          <div className="mt-3 grid gap-1 grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={`product-skeleton-${i}`}
                className="rounded-lg overflow-hidden bg-zinc-900"
              >
                <div className="w-full aspect-[3/4] bg-zinc-800 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 grid gap-1 grid-cols-2">
            {(dbProducts as Product[]).slice(0, 8).map((product) => (
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
              <div className="col-span-2 py-6 text-center text-zinc-400">
                <p className="text-xs font-semibold">{t('home:noProductsTitle')}</p>
                <p className="mt-1 text-[11px]">{t('home:noProductsSubtitle')}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Recent Fabrics */}
      <LatestFabricsRail fabrics={recentFabrics} />

      {/* Contact Section - Mobile Optimized */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-950 to-purple-950/35 p-4 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.10),transparent_42%),radial-gradient(circle_at_75%_0%,rgba(124,58,237,0.06),transparent_38%)]" />
        <div className="relative text-center space-y-0.5">
          <h2 className="text-base font-extrabold text-white">{t('home:contactUs')}</h2>
          <p className="text-xs text-zinc-300">{t('home:contactSubtitle')}</p>
        </div>

        {/* Mobile: Stack buttons vertically */}
        <div className="relative mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="group/contact flex h-10 items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-100 transition hover:border-purple-300/70 hover:bg-white/10"
          >
            <span>{t('home:settings')}</span>
            <Mail className="h-3.5 w-3.5 text-purple-200 transition-transform group-hover/contact:scale-110" />
          </button>
          <button
            onClick={() => togglePrivacyModal(true)}
            className="group/contact flex h-10 items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-100 transition hover:border-purple-300/70 hover:bg-white/10 cursor-pointer"
          >
            <span>{t('home:privacyPolicy')}</span>
            <Sparkles className="h-3.5 w-3.5 text-purple-200 transition-transform group-hover/contact:scale-110" />
          </button>
          <button
            onClick={() => toggleTermsModal(true)}
            className="group/contact flex h-10 items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-100 transition hover:border-purple-300/70 hover:bg-white/10 cursor-pointer"
          >
            <span>{t('home:terms')}</span>
            <Sparkles className="h-3.5 w-3.5 text-purple-200 transition-transform group-hover/contact:scale-110" />
          </button>
          <button
            onClick={() => toggleReturnPolicyModal(true)}
            className="group/contact flex h-10 items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-100 transition hover:border-purple-300/70 hover:bg-white/10 cursor-pointer"
          >
            <span>{t('home:returnPolicy')}</span>
            <Sparkles className="h-3.5 w-3.5 text-purple-200 transition-transform group-hover/contact:scale-110" />
          </button>
        </div>

        {/* Contact Info - Mobile */}
        <div className="relative mt-3 flex flex-col gap-2 text-[11px] text-zinc-200 w-full" dir="rtl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
            <Mail className="h-3.5 w-3.5 text-purple-200" />
            <span className="font-semibold text-zinc-100 text-[10px]">info@khuyoot.com</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
            <Phone className="h-3.5 w-3.5 text-purple-200" />
            <span className="font-semibold text-zinc-100 text-[10px]" dir="ltr">+965 1234 5678</span>
          </div>
        </div>

        {/* Footer Links - Mobile */}
        <div className="relative mt-2 flex flex-col gap-1.5 text-[10px] text-zinc-400 w-full" dir="rtl">
          <button
            type="button"
            onClick={() => navigate('/privacy')}
            className="text-zinc-300 hover:text-white transition underline text-right"
          >
            {t('home:readFullPagePrivacy')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/terms')}
            className="text-zinc-300 hover:text-white transition underline text-right"
          >
            {t('home:readFullPageTerms')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/return-policy')}
            className="text-zinc-300 hover:text-white transition underline text-right"
          >
            {t('home:readFullPageReturn')}
          </button>
        </div>
      </section>

      <div className="py-2 text-center text-[10px] text-zinc-400" dir="rtl">
        {t('home:copyright')}
      </div>
    </div>
  );
}
