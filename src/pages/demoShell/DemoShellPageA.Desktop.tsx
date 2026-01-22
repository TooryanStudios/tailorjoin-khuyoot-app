import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Heart, MapPin, Play, BadgeCheck, Sparkles, Star, User, Mail, Phone, Instagram, Twitter, User2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DemoShellOutletContext } from './DemoShellLayout';
import type { FabricMaterial, Product, Tailor } from '../../../types';
import { useThumbnail } from '../../hooks/useThumbnailCache';
import { useApp } from '../../../context/AppContext';
import { TailorPill } from './DemoShellTopTailors';
import { HomeAdsRow, LatestFabricsRail, DiscoverDesignerPromo } from './DemoShellPageA';
import { HomeHeader } from '../../components/HomeHeader';

type PromoTile = {
  id: string;
  title: string;
  imageUrl?: string;
  href: string;
};

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

const TailorCardDesktop = React.memo(function TailorCardDesktop({ 
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
      className="snap-start min-w-[260px] group focus:outline-none rounded-3xl overflow-hidden"
    >
      <div className="relative h-[300px] w-[260px] overflow-hidden rounded-3xl">
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
          <div className="absolute top-5 right-5 flex items-center justify-center h-9 w-9 text-emerald-500">
            <BadgeCheck size={18} />
          </div>
        )}

        {/* Content - Professional RTL Layout */}
        <div className="absolute inset-0 p-5 flex flex-col justify-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          {/* Bottom Section: Region and Icon on left, Name on right */}
          <div className="flex justify-between items-end">
            {/* Region and Gender Icon stacked on left */}
            <div className="flex flex-col items-start gap-1">
              {/* Region above icon */}
              <p className="text-sm text-white/85">
                {regionName}
              </p>
              
              {/* Gender Icon below region */}
              <div className="text-white/70">
                <User2 size={20} strokeWidth={1.5} />
              </div>
            </div>

            {/* Tailor Name on right */}
            <h3 className="text-lg text-white text-right">
              {tailor.name}
            </h3>
          </div>
        </div>
      </div>
    </button>
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

  // Debug: Log regions data
  React.useEffect(() => {
    console.log('🔍 Desktop - dbRegions:', dbRegions);
    console.log('🔍 Desktop - isRegionsLoading:', isRegionsLoading);
    console.log('🔍 Desktop - Filtered regions:', (dbRegions || []).filter((r: any) => r && r.id && r.name));
  }, [dbRegions, isRegionsLoading]);

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
    <div className="space-y-6 px-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
      {/* Header with User Info and Search */}
      <HomeHeader />

      {/* Region Filter Chips - Above the section */}
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide -mx-4 px-4">
        <button
          type="button"
          onClick={() => setSelectedRegionId(null)}
          className={`snap-start px-5 py-2.5 rounded-full text-base font-medium whitespace-nowrap transition-all ${
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
            className={`snap-start px-5 py-2.5 rounded-full text-base font-medium whitespace-nowrap transition-all ${
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
      <section className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg text-white">{t('home:topTailorsByRegion')}</h2>
          <button
            type="button"
            onClick={() => navigate('/tailors')}
            className="text-base font-semibold text-slate-300 hover:text-white transition-colors"
          >
            {t('home:seeAll')}
          </button>
        </div>

        {isTailorsLoading && (!dbTailors || dbTailors.length === 0) ? (
          <div className="flex gap-5 overflow-x-auto pb-2 snap-x scrollbar-hide -mx-4 px-6">
            {[1, 2, 3].map((i) => (
              <div
                key={`tailor-skeleton-${i}`}
                className="snap-start min-w-[260px] h-[300px] rounded-3xl bg-slate-800/60 animate-pulse"
              />
            ))}
          </div>
        ) : filteredTailors.length > 0 ? (
          <div className="relative group">
            {/* Left Arrow - Always visible */}
            <button
              type="button"
              className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Cards Container */}
            <div className="flex gap-5 overflow-x-auto pb-2 snap-x scrollbar-hide">
              {filteredTailors.slice(0, 8).map((tailor, index) => {
                const regionName = getRegionName(tailor, (dbRegions || []) as any);
                const isSpecial = index === 0;

                return (
                  <TailorCardDesktop
                    key={tailor.id}
                    tailor={tailor}
                    regionName={regionName}
                    isSpecial={isSpecial}
                    onClick={() => navigate(`/tailor/${tailor.id}`)}
                  />
                );
              })}
            </div>

            {/* Right Arrow - Always visible */}
            <button
              type="button"
              className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-2 snap-x scrollbar-hide -mx-4 px-6">
            {[1, 2, 3].map((i) => (
              <div
                key={`no-results-${i}`}
                className="snap-start min-w-[260px] rounded-3xl overflow-hidden bg-slate-800/30"
              >
                <div className="relative h-[300px] w-[260px] flex items-center justify-center">
                  <div className="text-center px-6">
                    <p className="text-lg font-semibold text-slate-300">{t('home:noResultsRegionTitle')}</p>
                    <p className="mt-2 text-base text-slate-500">{t('home:noResultsRegionSubtitle')}</p>
                  </div>
                </div>
              </div>
            ))}
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
