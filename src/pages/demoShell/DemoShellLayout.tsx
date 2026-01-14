import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { DesignerV2_1 } from '../DesignerV2_1/DesignerV2_1';
import { PerformanceDebugPanel } from './PerformanceDebugger';

export type DemoShellOutletContext = {
  pageCounters: { a: number; b: number };
  setPageCounter: (page: 'a' | 'b', value: number | ((prev: number) => number)) => void;
  imageUrls: { a: string[]; b: string[] };
  imageLoadedMap: Record<string, boolean>;
};

const COUNTERS_STORAGE_KEY = 'demo-shell-page-counters';

export function DemoShellLayout() {
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop() || 'a';
  const mountedAtRef = React.useRef(new Date().toISOString());
  const renderCountRef = React.useRef(0);
  
  // Track designer visits
  const [hasVisitedDesigner, setHasVisitedDesigner] = React.useState(false);
  const designerMountTimeRef = React.useRef<string | null>(null);
  
  React.useEffect(() => {
    renderCountRef.current++;
    console.log(`[DemoShellLayout] Render #${renderCountRef.current}, path: ${currentPath}`);
  });
  
  React.useEffect(() => {
    if (currentPath === 'designer' && !hasVisitedDesigner) {
      setHasVisitedDesigner(true);
      designerMountTimeRef.current = new Date().toISOString();
      console.log('[DemoShellLayout] Designer mounted at:', designerMountTimeRef.current);
    }
  }, [currentPath, hasVisitedDesigner]);
  const [layoutCounter, setLayoutCounter] = React.useState(0);
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
    [...imageUrls.a, ...imageUrls.b].forEach((u) => uniq.add(u));
    return Array.from(uniq);
  }, [imageUrls]);

  const imagesLoadedCount = React.useMemo(
    () => allImageUrls.reduce((acc, url) => acc + (imageLoadedMap[url] ? 1 : 0), 0),
    [allImageUrls, imageLoadedMap]
  );

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Keep these mounted so images stay cached while switching nested routes */}
      <div className="sr-only" aria-hidden="true">
        {allImageUrls.map((url) => (
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

      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-lg font-bold text-slate-900 dark:text-white">Demo Shell</div>
            <nav className="flex items-center gap-2 text-sm">
              <Link className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900" to="/demo-shell/a">
                Page A
              </Link>
              <Link className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900" to="/demo-shell/b">
                Page B
              </Link>
              <Link className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900" to="/demo-shell/top-tailors">
                أشهر الخياطين
              </Link>
              <Link className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900" to="/demo-shell/designer">
                Designer 2.1
              </Link>
              <Link className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900" to="/">
                Home
              </Link>
            </nav>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold">Layout mounted at:</span> {mountedAtRef.current}
            </div>

            <div className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold">Images cached:</span> {imagesLoadedCount}/{allImageUrls.length}
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Layout counter:</span> {layoutCounter}
              </div>
              <button
                type="button"
                onClick={() => setLayoutCounter((c) => c + 1)}
                className="h-9 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              >
                +1
              </button>
            </div>
            
            {hasVisitedDesigner && (
              <div className="text-xs text-slate-500 dark:text-slate-400 sm:col-span-2">
                <span className="font-semibold">Designer cached:</span> {designerMountTimeRef.current} | 
                <span className={currentPath === 'designer' ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}>
                  {' '}{currentPath === 'designer' ? 'Visible' : 'Hidden (kept mounted)'}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Regular routes for simple pages */}
        {currentPath !== 'designer' && (
          <Outlet
            context={{ pageCounters, setPageCounter, imageUrls, imageLoadedMap } satisfies DemoShellOutletContext}
          />
        )}
        
        {/* Designer: mount once, hide/show with CSS */}
        {hasVisitedDesigner && (
          <div style={{ display: currentPath === 'designer' ? 'block' : 'none' }}>
            <DesignerV2_1 />
          </div>
        )}
      </main>
      
      <PerformanceDebugPanel />
    </div>
  );
}
