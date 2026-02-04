import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, History as HistoryIcon, Sparkles, Crown, HelpCircle, ChevronDown, User2, Bell, Search, PanelLeftClose, PanelLeftOpen, MapPin, SquareSplitHorizontal } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { DesignerV2_1 } from '../DesignerV2_1/DesignerV2_1';
import { useMobileDetection } from '../../modules/designer/mobile';
import { useHomeProducts, useHomeTailors, usePopularRegions, useProductCategories } from '../../hooks/useHomeData';
import { useThumbnailCache, useThumbnail } from '../../hooks/useThumbnailCache';
import { Footer } from '../../client/components/Footer';
import { getUserOrders } from '../../../services/orderService';
import { Order } from '../../../types';

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
  const { user, theme, appSettings } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPath = pathParts[0] || 'home';
  const isMobile = useMobileDetection();
  
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

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(true);
  const [activeOrders, setActiveOrders] = React.useState<Order[]>([]);

  React.useEffect(() => {
    if (user?.id) {
       getUserOrders(user.id).then(setActiveOrders);
    } else {
       setActiveOrders([]);
    }
  }, [user?.id]);

  const activeCount = React.useMemo(() => {
    return activeOrders.filter(o => 
      ['pending', 'measuring', 'cutting', 'sewing', 'ready'].includes(o.status)
    ).length;
  }, [activeOrders]);

  const orderIndicator = React.useMemo(() => {
    if (activeCount === 0) return null;
    
    // Green takes priority if anything is "approved/active"
    const hasGreen = activeOrders.some(o => 
      ['measuring', 'cutting', 'sewing', 'ready'].includes(o.status)
    );
    if (hasGreen) return 'green';
    
    // Yellow for pending/submitted
    const hasYellow = activeOrders.some(o => o.status === 'pending');
    if (hasYellow) return 'yellow';
    
    return null;
  }, [activeOrders, activeCount]);

  return (
    <div className="flex h-screen bg-[var(--studio-bg)] text-[var(--studio-text)] font-sans overflow-hidden">
      {/* 🚀 Sidebar - Fixed Right */}
      <aside 
        className={`fixed inset-y-0 right-0 bg-[var(--studio-sidebar)] text-white flex flex-col p-4 z-50 transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden scrollbar-hide border-l border-white/[0.08] shadow-[-20px_0_25px_-5px_rgba(0,0,0,0.1)] ${
          isSidebarCollapsed ? 'w-20 items-center' : 'w-[240px]'
        }`}
      >
        {/* Top Header / Toggle Area */}
        <div className="relative flex items-center mb-10 w-full min-h-[44px]">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 pl-2 select-none">
              <div className="h-8 w-8 bg-zinc-800 rounded-lg flex items-center justify-center font-bold text-white italic shadow-xl border border-white/5 text-[11px]">K</div>
              <span className="text-xl font-bold tracking-tight italic text-white leading-none">khuyoot <span className="text-zinc-400">studio</span></span>
            </div>
          )}
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`absolute z-[100] p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-all shadow-xl border border-white/10 flex items-center justify-center ${
              isSidebarCollapsed 
                ? 'relative left-auto top-auto translate-y-0 mx-auto mt-2' 
                : 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2'
            }`}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 19V5"/><path d="m13 19-7-7 7-7"/><path d="M6 12h11"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 19V5"/><path d="m11 19 7-7-7-7"/><path d="M18 12H7"/></svg>
            )}
          </button>
        </div>

        {/* User Profile Area */}
        <div 
          onClick={() => navigate('/account')}
          className={`group flex items-center gap-3 mb-10 rounded-xl hover:bg-white/5 cursor-pointer transition w-full ${
            isSidebarCollapsed ? 'justify-center p-2' : 'p-2'
          }`}
        >
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-zinc-800 border border-white/10 relative">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover rounded-full" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors rounded-full overflow-hidden">
                <User2 size={20} />
              </div>
            )}
            
            {/* Order Status Indicator Badge */}
            {activeCount > 0 && (
              <div className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full border-2 border-zinc-900 shadow-lg flex items-center justify-center text-[10px] font-black text-white z-10 ${
                orderIndicator === 'green' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}>
                {activeCount}
              </div>
            )}
          </div>
          {!isSidebarCollapsed && (
            <>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate uppercase">{user?.name || 'Designer'}</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest border border-zinc-800 rounded px-1.5 w-fit mt-0.5 group-hover:border-zinc-700 transition-colors">
                  {user?.isGoldMember ? 'Gold' : 'Free'}
                </span>
              </div>
              <ChevronDown size={14} className="ml-auto text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 w-full">
          <button 
            onClick={() => navigate('/')}
            className={`w-full flex items-center gap-3 py-3 rounded-xl transition ${
              isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
            } ${
              currentPath === 'home' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Home size={22} />
            {!isSidebarCollapsed && <span className="text-sm font-semibold">Home</span>}
          </button>
          <button 
            onClick={() => navigate('/tailors')}
            className={`w-full flex items-center gap-3 py-3 rounded-xl transition ${
              isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
            } ${
              currentPath === 'tailors' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutGrid size={22} />
            {!isSidebarCollapsed && <span className="text-sm font-semibold">Discovery</span>}
          </button>
          <button 
            onClick={() => navigate('/designer-v2-1')}
            className={`w-full flex items-center gap-3 py-3 rounded-xl transition ${
              isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
            } ${
              currentPath === 'designer-v2-1' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <SquareSplitHorizontal size={22} />
            {!isSidebarCollapsed && <span className="text-sm font-semibold">Try On</span>}
          </button>
        </nav>

        {/* Credits Section */}
        {isSidebarCollapsed ? (
          <div className="mt-auto mb-6 flex flex-col items-center gap-4 py-6 w-10 rounded-full bg-[var(--studio-card)] text-[var(--studio-text)] border border-[var(--studio-card-border)] shadow-sm">
            <div className="p-1 rounded-full bg-blue-600/10 text-blue-500">
              <Sparkles size={16} fill="currentColor" />
            </div>
            <div className="flex-1 w-[3px] bg-zinc-800 rounded-full relative">
               <div className="absolute top-0 left-0 w-full h-[0%] bg-blue-500 rounded-full" />
            </div>
            <div className="text-[10px] font-bold text-zinc-500 rotate-0 text-center">0%<br/>used</div>
            <div className="p-1 rounded-full bg-blue-600/10 text-blue-500">
              <Crown size={16} fill="currentColor" />
            </div>
          </div>
        ) : (
          <div className="mt-auto mb-6 p-6 rounded-3xl bg-[var(--studio-card)] text-[var(--studio-text)] space-y-4 shadow-xl border border-[var(--studio-card-border)]">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-500">
               <div className="p-1.5 rounded-full bg-blue-600/10"><Sparkles size={12} fill="currentColor" /></div>
               <span>0 / 50 Credits</span>
            </div>
            <p className="text-[11px] text-[var(--studio-text-muted)] font-medium leading-relaxed">Upgrade to paid plan. Cancel anytime.</p>
            <button className="w-full py-2.5 rounded-full bg-blue-600/10 text-blue-500 text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-600/20 transition">
              Upgrade
              <Crown size={14} fill="currentColor" />
            </button>
            <p className="text-[9px] text-zinc-500 font-medium text-center">*Credits used to generate designs.</p>
          </div>
        )}

        {/* Support */}
        <button className={`flex items-center gap-3 text-zinc-500 hover:text-zinc-300 transition w-full ${
          isSidebarCollapsed ? 'justify-center p-2' : 'px-4 py-2'
        }`}>
          <HelpCircle size={20} />
          {!isSidebarCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Support</span>}
        </button>
      </aside>

      {/* 🚀 Main Content area - Scrollable */}
      <main 
        className={`flex-1 bg-[var(--studio-bg)] h-full overflow-y-auto overflow-x-hidden studio-main-viewport transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'mr-20' : 'mr-[240px]'
        }`}
      >
        {/* 🚀 UNIFIED BLOB LAYER: These images stay mounted so blobs remain valid & cached */}
        <div className="sr-only" aria-hidden="true">
          {allImageUrls.map((url) => (
            <PrewarmImage key={url} url={url} onLoaded={markImageLoaded} />
          ))}
        </div>

        <div className={`mx-auto h-full ${
          ['product', 'tailor', 'designer-v2-1', 'order-summary', 'measurements', 'studio'].includes(currentPath) ? 'max-w-none p-1' : 'max-w-[1400px] p-8'
        }`}>
          {/* Regular routes */}
          {!['designer'].includes(currentPath) && (
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
                  isMasterSidebarCollapsed: isSidebarCollapsed,
                  setMasterSidebarCollapsed: setIsSidebarCollapsed,
                } as DemoShellOutletContext
              }
            />
          )}

          {/* Designer: keep mounted for persistent state; hidden when not active */}
          {designerMounted && (
            <div 
              style={{ display: currentPath === 'designer' ? 'block' : 'none' }} 
              aria-hidden={currentPath !== 'designer'}
              className="h-full"
            >
              <DesignerKeepAlive />
            </div>
          )}
        </div>

        {/* 🚀 Footer: Only active in Mobile version */}
        {appSettings.showFooter && isMobile && (
          <div className="mt-12 border-t border-[var(--studio-card-border)] pt-8">
            <Footer />
          </div>
        )}
      </main>
    </div>
  );
}
