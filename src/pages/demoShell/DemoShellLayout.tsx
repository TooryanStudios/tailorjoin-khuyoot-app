import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DesignerV2_1 } from '../DesignerV2_1/DesignerV2_1';
import { useHomeProducts, useHomeTailors, usePopularRegions } from '../../hooks/useHomeData';
import { useThumbnailCache, useThumbnail } from '../../hooks/useThumbnailCache';

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

const DesignerKeepAlive = React.memo(DesignerV2_1);

export function DemoShellLayout() {
  const { prefetchThumbnails } = useThumbnailCache({ maxEntries: 100 });
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop() || 'a';
  
  // Track designer visits - keep it mounted once visited
  const [designerMounted, setDesignerMounted] = React.useState(false);
  
  React.useEffect(() => {
    if (currentPath === 'designer' && !designerMounted) {
      setDesignerMounted(true);
    }
  }, [currentPath, designerMounted]);

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
  
  const [cachedData] = React.useState(() => {
    if (typeof window === 'undefined') return { products: [], tailors: [] };
    try {
      const p = window.localStorage.getItem(DB_PRODUCTS_CACHE_KEY);
      const t = window.localStorage.getItem(DB_TAILORS_CACHE_KEY);
      return { 
        products: p ? JSON.parse(p) : [], 
        tailors: t ? JSON.parse(t) : [] 
      };
    } catch { return { products: [], tailors: [] }; }
  });

  const { data: dbProducts = cachedData.products, isLoading: isDbLoading } = useHomeProducts('all');
  const { data: dbTailors = cachedData.tailors, isLoading: isTailorsLoading } = useHomeTailors();
  const { data: dbRegions = [], isLoading: isRegionsLoading } = usePopularRegions(10);
  
  React.useEffect(() => {
    if (dbProducts?.length > 0) window.localStorage.setItem(DB_PRODUCTS_CACHE_KEY, JSON.stringify(dbProducts));
  }, [dbProducts]);

  React.useEffect(() => {
    if (dbTailors?.length > 0) window.localStorage.setItem(DB_TAILORS_CACHE_KEY, JSON.stringify(dbTailors));
  }, [dbTailors]);

  const dbImageUrls = React.useMemo(() => {
    const prodImages = (dbProducts || []).map((p: any) => p.image);
    const tailorImages = (dbTailors || []).map((t: any) => t.image || t.profileImage);
    // Expand to 70 images to ensure full coverage
    return [...prodImages, ...tailorImages].filter(Boolean).slice(0, 70);
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
      a: ['/logo.png', '/og-image.png', '/auth-panel.jpg', '/og/khuyoot-og.jpg'],
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      {/* 🚀 UNIFIED BLOB LAYER: These images stay mounted so blobs remain valid & cached */}
      <div className="sr-only" aria-hidden="true">
        {allImageUrls.map((url) => (
          <PrewarmImage key={url} url={url} onLoaded={markImageLoaded} />
        ))}
      </div>

      {/* NOTE: No max-width here (was max-w-4xl) to avoid fixed-width grids on the homepage. */}
      <main className="w-full px-4 py-6">
        {/* Regular routes for simple pages */}
        {currentPath !== 'designer' && (
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
              } as DemoShellOutletContext
            }
          />
        )}

        {/* Designer: keep mounted for persistent state; hidden when not active */}
        {designerMounted && (
          <div style={{ display: currentPath === 'designer' ? 'block' : 'none' }} aria-hidden={currentPath !== 'designer'}>
            <DesignerKeepAlive />
          </div>
        )}
      </main>
    </div>
  );
}
