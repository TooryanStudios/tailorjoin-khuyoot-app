import React, { useEffect, useState, useCallback } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { useHomeTailors, useFabricStores, useStories, useHomeProducts } from '../../src/hooks/useHomeData';
import { useAppStore } from '../../src/store/useAppStore';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { PerformanceDebugPanel, trackComponentRender } from '../../src/pages/demoShell/PerformanceDebugger';

// Import components
import { StoriesSection } from './components/StoriesSection';
import { SearchBar } from './components/SearchBar';
import { HeroBanner } from './components/HeroBanner';
import { DesignSection, AdsSection } from './components/DesignAndAds';
import { BrowseShopsButton } from './components/BrowseShopsButton';
import { TailorsSection } from './components/TailorsSection';
import { FabricStoresSection } from './components/FabricStoresSection';
import { CategoriesFilter } from './components/CategoriesFilter';
import { ProductsGrid } from './components/ProductsGrid';
import { ContactFooter } from './components/ContactFooter';
import { PopularRegions } from './components/PopularRegions';
import { FilteredTailors } from './components/FilteredTailors';
import V2BlocksRenderer from './components/V2BlocksRenderer';
import { StandardContainer } from '@/src/components/layout/StandardContainer';
import { HomepageOrchestrator as HomepageV2Orchestrator } from '../../src/modules/homepage-v2';

// Categories are driven by global appSettings.productCategories
// Fallback to sensible defaults if settings not yet loaded
const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'الكل' },
  { id: 'dishdasha', name: 'الدشاديش' },
  { id: 'jacket', name: 'الجاكيت' },
  { id: 'abaya', name: 'العبايات' },
  { id: 'kids', name: 'الأطفال' },
  { id: 'shoes', name: 'الأحذية' },
];

const DesignerV2_1Card: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative h-[160px] p-4 bg-slate-900 border border-[color:var(--theme-secondary)]/60 rounded-2xl hover:scale-[1.02] transition-transform text-right overflow-hidden"
    >
      <span className="absolute -top-2 -left-2 bg-[color:var(--theme-secondary)] text-[10px] px-2 py-1 rounded-full text-black font-black">
        NEW V2.1
      </span>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[color:var(--theme-secondary)]/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[color:var(--theme-primary)]/10 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col justify-center h-full">
        <div className="text-lg font-black text-white">Designer V2.1 (Beta)</div>
        <p className="text-slate-400 text-xs mt-1">Leonardo-style creative refinement</p>
        <div className="mt-3 text-[color:var(--theme-secondary)] text-xs font-bold">Open Upscaler </div>
      </div>
    </button>
  );
};

// Add forceClassic prop to bypass V2.1 check
interface HomeProps {
  forceClassic?: boolean;
}

// SPA Optimization: Image URLs to preload
const PRELOAD_IMAGE_URLS = [
  '/logo.png',
  '/og-image.png',
  '/auth-panel.jpg',
  '/og/khuyoot-og.jpg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

export const Home: React.FC<HomeProps> = ({ forceClassic = false }) => {
  // SPA: Track renders and mount time
  const renderCountRef = React.useRef(0);
  const mountedAtRef = React.useRef(new Date().toISOString());
  const imageLoadedMapRef = React.useRef<Record<string, boolean>>({});
  const [imageLoadedCount, setImageLoadedCount] = useState(0);

  React.useEffect(() => {
    renderCountRef.current++;
    trackComponentRender('Home', mountedAtRef.current);
    console.log(`[Home SPA] Render #${renderCountRef.current}`);
  });

  const markImageLoaded = useCallback((url: string) => {
    if (!imageLoadedMapRef.current[url]) {
      imageLoadedMapRef.current[url] = true;
      setImageLoadedCount(Object.values(imageLoadedMapRef.current).filter(Boolean).length);
    }
  }, []);

  // SPA: Monitor online/offline state
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ✅ Use React Query hooks with cache-first pattern
  const { user, appSettings, settingsLoaded } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Compute section permissions early so hooks can be gated (no extra network/chunk loads).
  const canShowSection = (section: string) => {
    const sectionSettings = (appSettings?.homeSections ?? {}) as Record<string, boolean | undefined>;
    const visibility = appSettings?.sectionVisibility?.[section];
    if (visibility?.adminOnly && user?.role !== 'admin') return false;
    return sectionSettings[section] ?? true;
  };

  const shouldLoadFabricStores = canShowSection('fabricStores');
  const shouldLoadStories = Boolean(appSettings?.storiesEnabled) && canShowSection('stories');
  const shouldLoadAds = canShowSection('adsSection');
  const shouldShowV2Blocks = (appSettings?.homePageSettings as any)?.enableV2Blocks ?? true;
  
  // ✅ React Query hooks - use cached data immediately, refetch in background
  const { data: tailors = [], isPending: isTailorsLoading } = useHomeTailors();
  const { data: fabricStores = [], isPending: isFabricStoresLoading } = useFabricStores(shouldLoadFabricStores);
  const { data: stories = [], isPending: isStoriesLoading } = useStories(shouldLoadStories);
  
  // Local state
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tempNote, setTempNote] = useState(''); // SPA Persistence Test
  
  // ✅ Use Zustand for selected region (persistent across navigation)
  const selectedRegion = useAppStore((state) => state.selectedRegion);
  const setSelectedRegion = useAppStore((state) => state.setSelectedRegion);
  
  // ✅ Products query depends on category
  const { data: products = [], isPending: isProductsLoading } = useHomeProducts(activeCategory);

  // Default to true if homeSections is not set
  const showSection = useCallback(
    (section: string) => canShowSection(section),
    [appSettings?.homeSections, appSettings?.sectionVisibility, user?.role]
  );

  // Don't render anything until settings are loaded
  if (!settingsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--theme-primary)]"></div>
      </div>
    );
  }

  const forceClassicEnv = import.meta.env.VITE_FORCE_CLASSIC_HOME === '1';
  const disableHomepageV2Env = import.meta.env.VITE_DISABLE_HOMEPAGE_V2 === '1';
  const forceClassicQuery = React.useMemo(() => {
    try {
      return new URLSearchParams(location.search).get('forceClassic') === '1';
    } catch {
      return false;
    }
  }, [location.search]);
  const forceClassicEffective = forceClassic || forceClassicEnv || forceClassicQuery;

  const shouldUseHomepageV2 =
    !forceClassicEffective &&
    !disableHomepageV2Env &&
    Boolean(appSettings?.homePageSettings?.enableHomepageV2);

  // Homepage V2 (Omani Boutique) mode - unless forceClassicEffective/disableHomepageV2Env is true
  if (shouldUseHomepageV2) {
    return <HomepageV2Orchestrator />;
  }

  // ✅ Only show skeleton if we have NO data AND it's still loading (first visit)
  const showTailorsSkeleton = isTailorsLoading && tailors.length === 0;
  const showStoresSkeleton = isFabricStoresLoading && fabricStores.length === 0;
  const showStoriesSkeleton = isStoriesLoading && stories.length === 0;
  const showProductsSkeleton = isProductsLoading && products.length === 0;

  return (
    <div className="pb-24">
      {/* SPA: Preload and cache all images while user navigates */}
      <div className="sr-only" aria-hidden="true">
        {PRELOAD_IMAGE_URLS.map((url) => (
          <img
            key={url}
            src={url}
            alt=""
            decoding="async"
            loading="eager"
            onLoad={() => markImageLoaded(url)}
          />
        ))}
      </div>

      {/* SPA Status Bar (dev mode) */}
      {import.meta.env.DEV && (
        <div className="sticky top-0 z-40 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center justify-between gap-4">
            <span>📊 SPA Home • Renders: {renderCountRef.current} • Images cached: {imageLoadedCount}/{PRELOAD_IMAGE_URLS.length}</span>
            <span className={`px-2 py-1 rounded font-semibold ${
              isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {isOnline ? '🌐 Online' : '📴 Offline'}
            </span>
          </div>
        </div>
      )}

      {/* Stories Section */}
      {shouldLoadStories && (
        <StandardContainer>
          {showStoriesSkeleton ? (
            <div className="mb-6 h-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          ) : (
            <StoriesSection stories={stories} userRole={user?.role} />
          )}
        </StandardContainer>
      )}

      {/* Search Bar */}
      {showSection('searchBar') && (
        <StandardContainer>
          <SearchBar />
        </StandardContainer>
      )}

      {/* V2 Blocks (Dynamic Hero, Action Cards, Discovery Grid, Terms/Privacy, etc.) */}
      {shouldShowV2Blocks && (
        <StandardContainer>
          <V2BlocksRenderer
            products={products}
            productsLoading={isProductsLoading}
            onProductSelect={(product) => navigate(`/product/${product.id}`)}
          />
        </StandardContainer>
      )}

      {/* Hero Banner */}
      {showSection('heroBanner') && (
        <StandardContainer>
          <HeroBanner />
        </StandardContainer>
      )}

      {/* Design & Ads Sections */}
      {(showSection('designSection') || shouldLoadAds) && (
        <StandardContainer>
          <div className={`mb-8 grid gap-4 ${
            showSection('designSection') && shouldLoadAds ? 'grid-cols-2' : 'grid-cols-1'
          }`}>
            {showSection('designSection') && (
              <div className="grid gap-4">
                <DesignSection />
                <DesignerV2_1Card onClick={() => navigate('/designer-v2-1')} />
              </div>
            )}
            {shouldLoadAds && <AdsSection />}
          </div>
        </StandardContainer>
      )}

      {/* Popular Regions Section */}
      {showSection('popularRegions') && (
        <StandardContainer>
          <PopularRegions 
            onRegionSelect={setSelectedRegion}
            selectedRegion={selectedRegion}
            maxRegions={appSettings.homePageSettings?.maxRegions ?? 5}
          />
        </StandardContainer>
      )}

      {/* Filtered Tailors by Region - Always show when region selection is active */}
      {showSection('filteredTailors') && (
        <StandardContainer>
          <FilteredTailors region={selectedRegion} />
        </StandardContainer>
      )}

      {/* Popular Fabric Stores - Top 6 Highest Rated */}
      {shouldLoadFabricStores && (
        <StandardContainer>
          {showStoresSkeleton ? (
            <div className="my-8 space-y-4">
              <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <FabricStoresSection stores={[...fabricStores].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6)} />
          )}
        </StandardContainer>
      )}

      {/* Browse Shops Button */}
      {showSection('browseShopsButton') && (
        <StandardContainer>
          <BrowseShopsButton />
        </StandardContainer>
      )}

      {/* Featured Tailors - Hide when FilteredTailors is showing */}
      {false && showSection('featuredTailors') && (
        <StandardContainer>
          <TailorsSection 
            tailors={tailors.slice(0, appSettings.homePageSettings?.featuredTailorsCount || 6)} 
          />
        </StandardContainer>
      )}

      {/* Categories Filter */}
      {showSection('categoriesFilter') && (
        <StandardContainer>
          <CategoriesFilter 
                categories={[
                  { id: 'all', name: 'الكل' },
                  ...((appSettings.productCategories || []).map((c: any) => ({ id: c.id, name: c.name })) || DEFAULT_CATEGORIES.slice(1))
                ]}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </StandardContainer>
      )}

      {/* Products Grid */}
      {showSection('productsGrid') && (
        <StandardContainer>
          {showProductsSkeleton ? (
            <div className="space-y-4">
              <div className="h-10 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <ProductsGrid 
              products={products}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          )}
        </StandardContainer>
      )}

      {/* Contact Footer */}
      {showSection('contactFooter') && (
        <StandardContainer>
          <ContactFooter />
        </StandardContainer>
      )}

      {/* SPA: Performance debugging panel (dev mode only) */}
      {import.meta.env.DEV && <PerformanceDebugPanel />}
    </div>
  );
};
