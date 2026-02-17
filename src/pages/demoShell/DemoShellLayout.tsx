import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, History as HistoryIcon, Sparkles, Crown, HelpCircle, ChevronDown, User2, Bell, Search, PanelLeftClose, PanelLeftOpen, MapPin, SquareSplitHorizontal, Tag } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import TryOn from '../TryOn';
import { useMobileDetection } from '../../modules/designer/mobile';
import { useHomeProducts, useHomeTailors, usePopularRegions, useProductCategories } from '../../hooks/useHomeData';
import { useThumbnailCache, useThumbnail } from '../../hooks/useThumbnailCache';
import { Footer } from '../../client/components/Footer';
import { getUserOrders } from '../../../services/orderService';
import { Order } from '../../../types';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export type DemoShellOutletContext = {
  pageCounters: { a: number; b: number };
  setPageCounter: (page: 'a' | 'b', value: number | ((prev: number) => number)) => void;
  imageUrls: { a: string[]; b: string[] };
  imageLoadedMap: Record<string, boolean>;
  dbProducts: any[];
  isDbLoading: boolean;
  dbTailors: any[];
  isTailorsLoading: boolean;
  dbRegions: any[];
  isRegionsLoading: boolean;
  dbCategories: any[];
  isCategoriesLoading: boolean;
  isMasterSidebarCollapsed: boolean;
  setMasterSidebarCollapsed: (collapsed: boolean) => void;
  landingConfig: any;
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
};

const COUNTERS_STORAGE_KEY = 'demo-shell-page-counters';

/**
 * 🚀 PREWARM COMPONENT:
 * Separated to prevent Layout from re-running ref callbacks on every render.
 */
const PrewarmImage = React.memo((props: { url: string; onLoaded: (url: string) => void }) => {
  const { url, onLoaded } = props;
  const src = useThumbnail(url, { maxEntries: 100 });
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (imgRef.current?.complete) {
      onLoaded(url);
    }
  }, [url, onLoaded]);

  return (
    <img
      ref={imgRef}
      src={src || url}
      alt=""
      decoding="async"
      loading="eager"
      onLoad={() => onLoaded(url)}
      className="w-1 h-1 opacity-0 absolute pointer-events-none"
    />
  );
});

const DesignerKeepAlive = React.memo(TryOn);

export function DemoShellLayout() {
  const { prefetchThumbnails } = useThumbnailCache({ maxEntries: 100 });
  const { user, theme, appSettings } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPath = pathParts[0] || 'home';
  const isMobile = useMobileDetection();
  
  // Track designer visits - keep it mounted once visited
  const [designerMounted, setDesignerMounted] = React.useState(false);
  const isDesignerRoute = ['designer', 'designer-v2-1', 'tryon'].includes(currentPath);
  
  React.useEffect(() => {
    if (isDesignerRoute && !designerMounted) {
      setDesignerMounted(true);
    }
  }, [isDesignerRoute, designerMounted]);

  const [pageCounters, setPageCounters] = React.useState<{ a: number; b: number }>(() => {
    if (typeof window === 'undefined') {
      return { a: 0, b: 0 };
    }
    try {
      const stored = window.localStorage.getItem(COUNTERS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as { a: number; b: number };
      }
    } catch (error) {
      console.warn('Unable to read demo shell counters:', error);
    }
    return { a: 0, b: 0 };
  });
  const [imageLoadedMap, setImageLoadedMap] = React.useState<Record<string, boolean>>({});

  // 💾 PERSISTENCE LAYER: Try to get products from LocalStorage before fetching from DB
  const DB_PRODUCTS_CACHE_KEY = 'demo-db-products-cache';
  const DB_TAILORS_CACHE_KEY = 'demo-db-tailors-cache';
  const DB_REGIONS_CACHE_KEY = 'demo-db-regions-cache';
  
  const [cachedData] = React.useState(() => {
    if (typeof window === 'undefined') return { products: [], tailors: [], regions: [] };
    try {
      const p = window.localStorage.getItem(DB_PRODUCTS_CACHE_KEY);
      const t = window.localStorage.getItem(DB_TAILORS_CACHE_KEY);
      const r = window.localStorage.getItem(DB_REGIONS_CACHE_KEY);
      return { 
        products: p ? JSON.parse(p) : [], 
        tailors: t ? JSON.parse(t) : [],
        regions: r ? JSON.parse(r) : []
      };
    } catch { return { products: [], tailors: [], regions: [] }; }
  });

  const { data: dbProducts = cachedData.products, isLoading: isDbLoading } = useHomeProducts('all');
  const { data: dbTailors = cachedData.tailors, isLoading: isTailorsLoading } = useHomeTailors();
  const { data: dbRegions = cachedData.regions, isLoading: isRegionsLoading } = usePopularRegions(10);
  const { data: dbCategories = [], isLoading: isCategoriesLoading } = useProductCategories();
  
  React.useEffect(() => {
    if (dbProducts?.length > 0) window.localStorage.setItem(DB_PRODUCTS_CACHE_KEY, JSON.stringify(dbProducts));
  }, [dbProducts]);

  React.useEffect(() => {
    if (dbTailors?.length > 0) window.localStorage.setItem(DB_TAILORS_CACHE_KEY, JSON.stringify(dbTailors));
  }, [dbTailors]);

  React.useEffect(() => {
    if (dbRegions?.length > 0) window.localStorage.setItem(DB_REGIONS_CACHE_KEY, JSON.stringify(dbRegions));
  }, [dbRegions]);

  const dbImageUrls = React.useMemo(() => {
    const prodImages = (dbProducts || []).map((p: any) => p.image);
    const tailorImages = (dbTailors || []).map((t: any) => t.image || t.profileImage);
    // Expand to 120 images to ensure full coverage across all regions & sections
    return [...prodImages, ...tailorImages].filter(Boolean).slice(0, 120);
  }, [dbProducts, dbTailors]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(COUNTERS_STORAGE_KEY, JSON.stringify(pageCounters));
    } catch (error) {
      console.warn('Unable to persist demo shell counters:', error);
    }
  }, [pageCounters]);

  const imageUrls = React.useMemo(
    () => ({
      a: ['/logo_big.png?v=4', '/og-image.png', '/auth-panel.jpg', '/og/khuyoot-og.jpg'],
      b: ['/icons/icon-512.png', '/icons/maskable-512.png', '/og-image.svg', '/pwa-512x512.svg'],
    }),
    []
  );

  const allImageUrls = React.useMemo(() => {
    const uniq = new Set<string>();
    [...imageUrls.a, ...imageUrls.b, ...dbImageUrls].forEach((u) => uniq.add(u));
    return Array.from(uniq);
  }, [imageUrls, dbImageUrls]);

  // 🚀 UNIFIED PRE-WARMING: Trigger blob creation for all images
  React.useEffect(() => {
    if (allImageUrls.length > 0) {
      prefetchThumbnails(allImageUrls);
    }
  }, [allImageUrls, prefetchThumbnails]);


  const setPageCounter: DemoShellOutletContext['setPageCounter'] = (page, value) => {
    setPageCounters((prev) => {
      const nextValue = typeof value === 'function' ? (value as (p: number) => number)(prev[page]) : value;
      return { ...prev, [page]: nextValue };
    });
  };

  const markImageLoaded = React.useCallback((url: string) => {
    setImageLoadedMap((prev) => {
      if (prev[url]) return prev;
      return { ...prev, [url]: true };
    });
  }, []);

  const [activeOrders, setActiveOrders] = React.useState<Order[]>([]);
  const [activeTheme, setActiveTheme] = React.useState<string>(() => {
    if (typeof window === 'undefined') return 'lime';
    return window.localStorage.getItem('demo-active-theme') || 'lime';
  });

  const [landingConfig, setLandingConfig] = React.useState<any>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = window.localStorage.getItem('demo-landing-config-cache');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const docRef = doc(db, 'site_config', 'landing_page');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setLandingConfig(data);
          window.localStorage.setItem('demo-landing-config-cache', JSON.stringify(data));
        }
      } catch (error) {
        console.error('Error loading landing page config:', error);
      }
    };
    loadConfig();
  }, []);

  React.useEffect(() => {
    if (activeTheme) {
      window.localStorage.setItem('demo-active-theme', activeTheme);
    }
  }, [activeTheme]);

  React.useEffect(() => {
    if (user?.id) {
       getUserOrders(user.id).then(setActiveOrders);
    } else {
       setActiveOrders([]);
    }
  }, [user?.id]);

  return (
    <div className="flex h-screen bg-[#ededed] font-sans overflow-hidden">
      {/* 🚀 Main Content area - Scrollable */}
      <main className="flex-1 bg-[#ededed] overflow-y-auto overflow-x-hidden mt-[72px] h-[calc(100vh-72px)] w-full">
        {/* 🚀 UNIFIED BLOB LAYER: These images stay mounted so blobs remain valid & cached */}
        <div className="sr-only" aria-hidden="true">
          {allImageUrls.map((url) => (
            <PrewarmImage key={url} url={url} onLoaded={markImageLoaded} />
          ))}
        </div>

        <div className="mx-auto h-full max-w-none p-0">
          {/* Regular routes: Render everything EXCEPT designer sub-routes which are handled by KeepAlive */}
          {!isDesignerRoute && (
            <Outlet
              context={
                {
                  pageCounters,
                  setPageCounter,
                  imageUrls,
                  imageLoadedMap,
                  dbProducts,
                  isDbLoading,
                  dbTailors,
                  isTailorsLoading,
                  dbRegions,
                  isRegionsLoading,
                  dbCategories,
                  isCategoriesLoading,
                  isMasterSidebarCollapsed: true,
                  setMasterSidebarCollapsed: () => {},
                  landingConfig,
                  activeTheme,
                  setActiveTheme
                } as DemoShellOutletContext
              }
            />
          )}

          {/* Designer: keep mounted for persistent state; hidden when not active */}
          {designerMounted && (
            <div 
              aria-hidden={isDesignerRoute ? undefined : true}
              {...(!isDesignerRoute ? ({ inert: '' } as any) : {})}
              className={`${isDesignerRoute ? 'block h-full' : 'hidden h-full pointer-events-none opacity-0 invisible absolute inset-0 -z-50'}`}
            >
              <DesignerKeepAlive />
            </div>
          )}
        </div>

        {/* 🚀 Footer: Only active in Mobile version */}
        {appSettings.showFooter && isMobile && (
          <div className="mt-12 border-t border-black/5 pt-8">
            <Footer />
          </div>
        )}
      </main>
    </div>
  );
}
