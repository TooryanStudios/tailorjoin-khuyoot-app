import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Product, Tailor, Story, Shop } from '../../types';
import { firebaseService } from '../../services/firebase';
import { getStories, getFabricStores } from '../../services/mockService';
import { useApp } from '../../context/AppContext';
import { requestNotificationPermission, showLocalTestNotification, isNotificationSupported } from '../../utils/notifications';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getActiveAdvertisements, incrementAdClicks, incrementAdViews, type Advertisement } from '../../services/advertisementService';

// Import components
import { InstallButton } from './components/InstallButton';
import { NotificationButton } from './components/NotificationButton';
import { StoriesSection } from './components/StoriesSection';
import { SearchBar } from './components/SearchBar';
import { TailorsSection } from './components/TailorsSection';
import { FabricStoresSection } from './components/FabricStoresSection';
import { CategoriesFilter } from './components/CategoriesFilter';
import { ProductsGrid } from './components/ProductsGrid';
import { ContactFooter } from './components/ContactFooter';
import { PopularRegions } from './components/PopularRegions';
import { FilteredTailors } from './components/FilteredTailors';
import { usePWAInstall } from '@/src/hooks/usePWAInstall';

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

export const Home = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [fabricStores, setFabricStores] = useState<Shop[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [notificationStatus, setNotificationStatus] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const { user, appSettings, settingsLoaded } = useApp();
  const { showInstallButton, isInstalled, promptInstall } = usePWAInstall();

  // Consolidated hero carousel (hero + design + ads) to avoid competing banners.
  const bannerConfig = useMemo(() => (appSettings?.heroBanner || {}) as any, [appSettings?.heroBanner]);
  const homeBannerImages = useMemo(() => (appSettings?.homePageSettings?.bannerImages || {}) as any, [appSettings?.homePageSettings?.bannerImages]);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [hasTrackedAdView, setHasTrackedAdView] = useState(false);

  const currentAd: Advertisement | null = useMemo(() => {
    if (!ads.length) return null;
    return ads[Math.max(0, Math.min(currentAdIndex, ads.length - 1))] || null;
  }, [ads, currentAdIndex]);

  // Load active homepage ads for the hero carousel.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const activeAds = await getActiveAdvertisements();
        const homepageAds = (activeAds || []).filter((ad) => ad?.adLocation === 'homepage_main');
        if (cancelled) return;
        setAds(homepageAds);
        setCurrentAdIndex(0);
        setHasTrackedAdView(false);
      } catch {
        if (cancelled) return;
        setAds([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Track ad views once per displayed ad.
  useEffect(() => {
    if (!currentAd || hasTrackedAdView) return;
    incrementAdViews(currentAd.id);
    setHasTrackedAdView(true);
  }, [currentAd, hasTrackedAdView]);

  // Rotate ads if multiple and not pinned.
  useEffect(() => {
    if (!ads.length) return;
    if (ads.length <= 1) return;
    if (currentAd?.isPinned) return;

    const durationSeconds = Number(currentAd?.displayDuration || 5);
    const safeMs = Math.max(1, Math.min(60, Number.isFinite(durationSeconds) ? durationSeconds : 5)) * 1000;

    const t = window.setTimeout(() => {
      setCurrentAdIndex((prev) => {
        const next = (prev + 1) % ads.length;
        return next;
      });
      setHasTrackedAdView(false);
    }, safeMs);

    return () => window.clearTimeout(t);
  }, [ads, currentAd]);

  const heroSlides = useMemo(() => {
    const slides: Array<
      | { key: 'hero'; kind: 'hero' }
      | { key: 'design'; kind: 'design' }
      | { key: 'ads'; kind: 'ads' }
    > = [{ key: 'hero', kind: 'hero' }];

    // Only include design/ads when enabled in settings.
    const sections = (appSettings?.homeSections ?? {}) as Record<string, boolean | undefined>;
    const visibility = appSettings?.sectionVisibility ?? ({} as any);
    const canShow = (section: string) => {
      const v = visibility?.[section];
      if (v?.adminOnly && user?.role !== 'admin') return false;
      return sections[section] ?? true;
    };

    if (canShow('designSection')) slides.push({ key: 'design', kind: 'design' });
    if (canShow('adsSection')) slides.push({ key: 'ads', kind: 'ads' });
    return slides;
  }, [appSettings?.homeSections, appSettings?.sectionVisibility, user?.role]);

  useEffect(() => {
    if (carouselIndex >= heroSlides.length) setCarouselIndex(0);
  }, [carouselIndex, heroSlides.length]);

  const heroImageSrc = homeBannerImages.hero || bannerConfig.image || 'https://picsum.photos/1200/500?random=hero';
  const heroBadge = bannerConfig.badge || 'موسم مميز';
  const heroTitle = bannerConfig.title || 'تشكيلة العيد';
  const heroSubtitle = bannerConfig.subtitle || 'بين يديك';
  const heroDescription = bannerConfig.description || 'أرقى التصاميم العمانية والعصرية، مفصلة خصيصاً لك لتناسب ذوقك الرفيع.';
  const heroButtonText = bannerConfig.buttonText || 'استكشف';
  const heroButtonLink = bannerConfig.buttonLink || '/products';

  const designImage = homeBannerImages.design;
  const adsFallbackImage = homeBannerImages.ads || 'https://picsum.photos/1200/500?random=ads';
  const adImage = currentAd?.image || adsFallbackImage;

  // Debug rendering log removed

  useEffect(() => {
    firebaseService.getProducts(activeCategory).then(setProducts);
  }, [activeCategory]);

  useEffect(() => {
    if (!settingsLoaded) {
      return;
    }

    let isMounted = true;
    const isStoriesEnabled = Boolean(appSettings?.storiesEnabled);

    const fetchData = async () => {
      const tailorsPromise = firebaseService
        .getApprovedTailors()
        .catch(error => {
          console.error('Failed to load approved tailors', error);
          return [] as Tailor[];
        });

      const fabricStoresPromise = getFabricStores().catch(error => {
        console.error('Failed to load fabric stores', error);
        return [] as Shop[];
      });

      const storiesPromise: Promise<Story[]> = isStoriesEnabled
        ? getStories().catch(error => {
            console.error('Failed to load stories', error);
            return [] as Story[];
          })
        : Promise.resolve([] as Story[]);

      const [approvedTailors, approvedStores, fetchedStories] = await Promise.all([
        tailorsPromise,
        fabricStoresPromise,
        storiesPromise,
      ]);

      if (!isMounted) {
        return;
      }

      setTailors(approvedTailors);
      setFabricStores(approvedStores);
      setStories(isStoriesEnabled ? fetchedStories : []);
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [appSettings?.storiesEnabled, settingsLoaded]);

  const handleTestNotification = async () => {
    if (!isNotificationSupported()) {
      setNotificationStatus('❌ التنبيهات غير مدعومة في هذا المتصفح');
      setTimeout(() => setNotificationStatus(''), 3000);
      return;
    }

    const permission = await requestNotificationPermission();
    
    if (permission === 'granted') {
      showLocalTestNotification(
        'خيوط - Khuyoot',
        'تم تفعيل تنبيهات خيوط بنجاح! 🎉'
      );
      setNotificationStatus('✅ تم إرسال التنبيه بنجاح');
      setTimeout(() => setNotificationStatus(''), 3000);
    } else if (permission === 'denied') {
      setNotificationStatus('❌ تم رفض إذن التنبيهات. يرجى تفعيلها من إعدادات المتصفح');
      setTimeout(() => setNotificationStatus(''), 5000);
    } else {
      setNotificationStatus('⚠️ لم يتم منح إذن التنبيهات');
      setTimeout(() => setNotificationStatus(''), 3000);
    }
  };

  // Default to true if homeSections is not set
  const showSection = useCallback(
    (section: string) => {
      const sectionSettings = (appSettings?.homeSections ?? {}) as Record<string, boolean | undefined>;
      const visibility = appSettings?.sectionVisibility?.[section];

      if (visibility?.adminOnly && user?.role !== 'admin') {
        return false;
      }

      return sectionSettings[section] ?? true;
    },
    [appSettings?.homeSections, appSettings?.sectionVisibility, user?.role]
  );

  // Don't render anything until settings are loaded
  if (!settingsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 md:px-6 lg:px-8">
      {/* Install Button */}
      {showSection('installButton') && showInstallButton && (
        <InstallButton onInstallClick={promptInstall} isInstalled={isInstalled} />
      )}

      {/* Notification Button */}
      {showSection('notificationButton') && (
        <NotificationButton 
          onTestNotification={handleTestNotification} 
          notificationStatus={notificationStatus} 
        />
      )}

      {/* Stories Section */}
      {appSettings.storiesEnabled && showSection('stories') && (
        <StoriesSection stories={stories} userRole={user?.role} />
      )}

      {/* Search Bar */}
      {showSection('searchBar') && (
        <SearchBar />
      )}

      {/* Hero Carousel (single surface) */}
      {showSection('heroBanner') && (
        <div className="mb-4">
          <div className="relative w-full aspect-[3/1] md:aspect-[4/1] lg:aspect-[5/1] rounded-2xl overflow-hidden shadow-2xl border border-white/5">
            {heroSlides[carouselIndex]?.kind === 'hero' && (
              <>
                <img
                  src={heroImageSrc}
                  alt="Hero"
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center justify-between px-6 md:px-12">
                  <div className="flex flex-col gap-2">
                    <span className="text-amber-400 font-medium text-xs md:text-sm uppercase tracking-wider">
                      {heroBadge}
                    </span>
                    <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight">
                      {heroTitle} <br />
                      <span className="text-slate-200 font-light">{heroSubtitle}</span>
                    </h2>
                    <p className="text-slate-200 text-xs md:text-sm max-w-[280px]">
                      {heroDescription}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(heroButtonLink)}
                    className="bg-white text-black text-xs md:text-sm font-bold px-4 md:px-6 py-2 md:py-2.5 rounded-full hover:bg-slate-100 transition-colors shadow-lg"
                  >
                    {heroButtonText}
                  </button>
                </div>
              </>
            )}

            {heroSlides[carouselIndex]?.kind === 'design' && (
              <button
                type="button"
                onClick={() => navigate('/designer')}
                className="absolute inset-0 text-right"
              >
                <img
                  src={designImage || heroImageSrc}
                  alt="Design"
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end">
                  <div className="text-white font-black text-xl md:text-2xl">صمّم تشكيلة خاصة</div>
                  <div className="mt-1 text-blue-300 text-sm font-bold inline-flex items-center gap-2">
                    ابدأ التصميم الآن <ArrowLeft size={16} />
                  </div>
                </div>
              </button>
            )}

            {heroSlides[carouselIndex]?.kind === 'ads' && (
              <button
                type="button"
                onClick={() => {
                  if (currentAd) {
                    incrementAdClicks(currentAd.id);
                    if (currentAd.shopType === 'tailor') navigate(`/tailor/${currentAd.shopId}`);
                    else if (currentAd.shopType === 'boutique') navigate(`/boutique/${currentAd.shopId}`);
                    else navigate(`/shop/${currentAd.shopId}`);
                  } else {
                    navigate('/shops');
                  }
                }}
                className="absolute inset-0 text-right"
              >
                <img
                  src={adImage}
                  alt={currentAd?.title || 'Ad'}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg">إعلان</span>
                    {currentAd?.isPinned ? (
                      <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg">مثبت</span>
                    ) : null}
                  </div>
                  <div className="mt-2 text-white font-bold text-lg md:text-xl line-clamp-1">
                    {currentAd?.title || 'عروض خاصة'}
                  </div>
                  <div className="mt-1 text-slate-200 text-sm line-clamp-1">
                    {currentAd?.description || 'اكتشف أحدث العروض'}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-blue-300 text-sm font-bold inline-flex items-center gap-2">
                      {currentAd?.buttonText || 'تسوق الآن'} <ArrowLeft size={16} />
                    </div>
                    {(ads.length > 1 && !currentAd?.isPinned) ? (
                      <div className="flex gap-1">
                        {ads.map((_, idx) => (
                          <div
                            key={`ad-dot-${idx}`}
                            className={`${idx === currentAdIndex ? 'bg-white w-4' : 'bg-white/40 w-1.5'} h-1.5 rounded-full transition-all`}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </button>
            )}

            {/* Carousel dots */}
            {heroSlides.length > 1 && (
              <div className="absolute bottom-3 right-4 flex gap-1.5">
                {heroSlides.map((s, idx) => (
                  <button
                    key={s.key}
                    type="button"
                    aria-label={`carousel-dot-${idx}`}
                    onClick={() => setCarouselIndex(idx)}
                    className={`${idx === carouselIndex ? 'bg-white w-6' : 'bg-white/40 w-2'} h-2 rounded-full transition-all`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3-Button Action Row */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => navigate('/tailors')}
          className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold px-4 py-3 flex items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          احجز خياط
        </button>
        <button
          type="button"
          onClick={() => navigate('/shops')}
          className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold px-4 py-3 flex items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          تسوق
        </button>
        <button
          type="button"
          onClick={() => navigate('/account')}
          className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold px-4 py-3 flex items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          ملفي
        </button>
      </div>

      {/* Popular Regions Section */}
      <PopularRegions 
        onRegionSelect={setSelectedRegion}
        selectedRegion={selectedRegion}
        maxRegions={appSettings.homePageSettings?.maxRegions ?? 5}
      />

      {/* Filtered Tailors by Region - Always show when region selection is active */}
      <FilteredTailors region={selectedRegion} />

      {/* Popular Fabric Stores - Top 6 Highest Rated */}
      <FabricStoresSection stores={[...fabricStores].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6)} />

      {/* Featured Tailors - Hide when FilteredTailors is showing */}
      {false && showSection('featuredTailors') && (
        <TailorsSection 
          tailors={tailors.slice(0, appSettings.homePageSettings?.featuredTailorsCount || 6)} 
        />
      )}

      {/* Categories Filter */}
      {showSection('categoriesFilter') && (
        <CategoriesFilter 
              categories={[
                { id: 'all', name: 'الكل' },
                ...((appSettings.productCategories || []).map((c: any) => ({ id: c.id, name: c.name })) || DEFAULT_CATEGORIES.slice(1))
              ]}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      )}

      {/* Products Grid */}
      {showSection('productsGrid') && (
        <ProductsGrid 
          products={products}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onDeleted={(deletedId) => setProducts((prev) => prev.filter((p) => p.id !== deletedId))}
        />
      )}

      {/* Contact Footer */}
      {showSection('contactFooter') && (
        <ContactFooter />
      )}

    </div>
  );
};
