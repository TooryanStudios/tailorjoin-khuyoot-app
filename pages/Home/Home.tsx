import React, { useEffect, useState, useCallback } from 'react';
import { Product, Tailor, Story, Shop } from '../../types';
import { firebaseService } from '../../services/firebase';
import { getStories, getFabricStores } from '../../services/mockService';
import { useApp } from '../../context/AppContext';
import { requestNotificationPermission, showLocalTestNotification, isNotificationSupported } from '../../utils/notifications';

// Import components
import { InstallButton } from './components/InstallButton';
import { NotificationButton } from './components/NotificationButton';
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

  console.log('🏠 Home rendering, user:', user?.name, 'role:', user?.role);

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

      {/* Hero Banner */}
      {showSection('heroBanner') && (
        <HeroBanner />
      )}

      {/* Design & Ads Sections */}
      {(showSection('designSection') || showSection('adsSection')) && (
        <div className={`mb-8 grid grid-cols-1 gap-4 md:gap-6 ${
          showSection('designSection') && showSection('adsSection') ? 'md:grid-cols-2' : ''
        }`}>
          {showSection('designSection') && <DesignSection />}
          {showSection('adsSection') && <AdsSection />}
        </div>
      )}

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

      {/* Browse Shops Button */}
      {showSection('browseShopsButton') && (
        <BrowseShopsButton />
      )}

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
        />
      )}

      {/* Contact Footer */}
      {showSection('contactFooter') && (
        <ContactFooter />
      )}

    </div>
  );
};
