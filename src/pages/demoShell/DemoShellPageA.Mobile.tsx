import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Mail, Phone, Instagram, Twitter, BadgeCheck, Sparkles, User2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DemoShellOutletContext } from './DemoShellLayout';
import type { FabricMaterial, Product, Tailor } from '../../../types';
import { useThumbnail } from '../../hooks/useThumbnailCache';
import { useApp } from '../../../context/AppContext';
import { TailorPill } from './DemoShellTopTailors';
import { HomeAdsRow, LatestFabricsRail } from './DemoShellPageA';
import { HomeHeader } from '../../components/HomeHeader';

const getRegionName = (tailor: Tailor, regions: any[]) => {
  // Tailor.region is a STRING (like "Muscat"), match against region.name
  const tailorRegionName = (tailor as any).region || (tailor as any).location || '';
  
  if (!tailorRegionName) return 'Unknown';
  
  const matchedRegion = regions.find((r) => r.name === tailorRegionName);
  return matchedRegion?.name || tailorRegionName || 'Unknown';
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

const TailorCard = React.memo(function TailorCard({ 
  tailor, 
  regionName, 
  isSpecial, 
  onClick 
}: { 
  tailor: Tailor; 
  regionName: string; 
  isSpecial: boolean; 
  onClick: () => void;
}) {
  const displaySrc = useThumbnail(tailor.profileImage || tailor.image, { maxEntries: 100 });

  return (
    <button
      type="button"
      onClick={onClick}
      className="snap-start min-w-[220px] group focus:outline-none rounded-3xl overflow-hidden"
    >
      <div className="relative h-[280px] w-[220px] overflow-hidden rounded-3xl">
        {/* Background Image */}
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={tailor.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-slate-950" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        {/* Special Badge */}
        {isSpecial && (
          <div className="absolute top-4 right-4 flex items-center justify-center h-8 w-8 text-emerald-500">
            <BadgeCheck size={16} />
          </div>
        )}

        {/* Content - Professional RTL Layout */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          {/* Bottom Section: Region and Icon on left, Name on right */}
          <div className="flex justify-between items-end">
            {/* Region and Gender Icon stacked on left */}
            <div className="flex flex-col items-start gap-1">
              {/* Region above icon */}
              <p className="text-xs text-white/85">
                {regionName}
              </p>
              
              {/* Gender Icon below region */}
              <div className="text-white/70">
                <User2 size={18} strokeWidth={1.5} />
              </div>
            </div>

            {/* Tailor Name on right */}
            <h3 className="text-base text-white text-right">
              {tailor.name}
            </h3>
          </div>
        </div>
      </div>
    </button>
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
    <div className="space-y-6 pb-24 px-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
      {/* Header with User Info and Search */}
      <HomeHeader />

      {/* Region Filter Chips - Above the section */}
      <div className="flex gap-2 overflow-x-auto pb-2 snap-x scrollbar-hide -mx-4 px-4">
        <button
          type="button"
          onClick={() => setSelectedRegionId(null)}
          className={`snap-start px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            selectedRegionId === null
              ? 'bg-slate-600 text-white'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
          }`}
        >
          {t('home:all')}
        </button>

        {(dbRegions || []).filter((r: any) => r && r.id && r.name).map((region: any) => (
          <button
            key={region.id}
            type="button"
            onClick={() => setSelectedRegionId(region.id)}
            className={`snap-start px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedRegionId === region.id
                ? 'bg-slate-600 text-white'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            {region.name}
          </button>
        ))}
      </div>

      {/* Top Tailors Section - Card Design */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base text-white">{t('home:topTailorsByRegion')}</h2>
          <button
            type="button"
            onClick={() => navigate('/tailors')}
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            {t('home:seeAll')}
          </button>
        </div>

        {isTailorsLoading && (!dbTailors || dbTailors.length === 0) ? (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-hide -mx-4 px-6">
            {[1, 2].map((i) => (
              <div
                key={`tailor-skeleton-${i}`}
                className="snap-start min-w-[220px] h-[280px] rounded-3xl bg-slate-800/60 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-hide -mx-4 px-6">
            {filteredTailors.slice(0, 8).map((tailor, index) => {
              const regionName = getRegionName(tailor, (dbRegions || []) as any);
              const isSpecial = index === 0;

              return (
                <TailorCard
                  key={tailor.id}
                  tailor={tailor}
                  regionName={regionName}
                  isSpecial={isSpecial}
                  onClick={() => navigate(`/tailor/${tailor.id}`)}
                />
              );
            })}

            {!isTailorsLoading && filteredTailors.length === 0 && (
              <>
                {[1, 2].map((i) => (
                  <div
                    key={`no-results-${i}`}
                    className="snap-start min-w-[220px] rounded-3xl overflow-hidden bg-slate-800/30"
                  >
                    <div className="relative h-[280px] w-[220px] flex items-center justify-center">
                      <div className="text-center px-6">
                        <p className="text-base font-semibold text-slate-300">{t('home:noResultsRegionTitle')}</p>
                        <p className="mt-2 text-sm text-slate-500">{t('home:noResultsRegionSubtitle')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
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
