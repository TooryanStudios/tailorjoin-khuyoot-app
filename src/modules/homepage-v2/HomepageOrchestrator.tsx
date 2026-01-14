import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { useLayoutStore } from './store/useLayoutStore';
import { useAppStore } from '../../store/useAppStore';
import { useScrollRestoration } from '../../hooks/useScrollRestoration';
import manifestJson from './config/layout-manifest.json';
import type { HomePageV2LayoutManifest, HomePageV2BlockKey } from './types';
import { SkeletonShimmer } from './components/SkeletonShimmer';

const manifest = manifestJson as unknown as HomePageV2LayoutManifest;

const PREVIEW_FLAG_KEY = 'khuyoot:homepage-v2:preview';
const PREVIEW_STATE_KEY = 'khuyoot:homepage-v2:previewState';

function isPreviewEnabled(): boolean {
  try {
    return localStorage.getItem(PREVIEW_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

// Map component files using Vite's import.meta.glob so missing files don't crash the app.
// If a file is deleted, it simply won't appear in this map.
const componentModules = import.meta.glob('./components/*.tsx');

function componentPathForKey(key: HomePageV2BlockKey): string | null {
  const entry = manifest.blocks.find((b) => b.key === key);
  if (!entry) return null;
  // manifest component is like "./components/DynamicHero"; actual file ends with .tsx
  return `${entry.component}.tsx`;
}

export function HomepageOrchestrator() {
  const { appSettings, user } = useApp();
  const hydrateFromRemote = useLayoutStore((s) => s.hydrateFromRemote);
  const order = useLayoutStore((s) => s.order);
  const visibility = useLayoutStore((s) => s.visibility);
  
  // Preserve scroll position across navigation
  useScrollRestoration();
  
  // Use Zustand for persistent state across navigation
  const spaTestNote = useAppStore((s) => s.spaTestNote);
  const setSpaTestNote = useAppStore((s) => s.setSpaTestNote);

  const [previewEnabled, setPreviewEnabled] = React.useState(() => (typeof window !== 'undefined' ? isPreviewEnabled() : false));

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PREVIEW_FLAG_KEY) setPreviewEnabled(isPreviewEnabled());
      if (e.key === PREVIEW_STATE_KEY && isPreviewEnabled()) {
        try {
          const raw = e.newValue;
          if (!raw) return;
          const parsed = JSON.parse(raw);
          hydrateFromRemote(parsed);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [hydrateFromRemote]);

  const lastRemoteLayoutRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (previewEnabled) {
      try {
        const raw = localStorage.getItem(PREVIEW_STATE_KEY);
        if (raw) hydrateFromRemote(JSON.parse(raw));
      } catch {
        // ignore
      }
      return;
    }

    // Only hydrate from remote if the data actually changed (not on every appSettings change)
    const remoteLayout = (appSettings as any)?.homePageV2Layout ?? null;
    const serialized = remoteLayout ? JSON.stringify(remoteLayout) : 'null';
    if (lastRemoteLayoutRef.current === serialized) return;
    
    lastRemoteLayoutRef.current = serialized;
    // Only hydrate if we have actual remote data, don't wipe local state with null
    if (remoteLayout) {
      hydrateFromRemote(remoteLayout);
    }
  }, [appSettings, hydrateFromRemote, previewEnabled]);

  return (
    <div className="w-full min-h-screen bg-[#050817] text-white">
      {/* Header: Full width background, centered content */}
      <header className="w-full border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          {/* Logo */}
          <img 
            src="/logo.png" 
            alt="خيوط" 
            className="h-14 w-auto object-contain"
          />
        </div>
      </header>

      {/* Main Content: Full width background, centered content */}
      <main className="w-full">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {order.map((key) => {
            if (!visibility[key]) return null;

            const path = componentPathForKey(key);
            if (!path) {
              console.warn('[HomepageV2] Missing manifest entry for block:', key);
              return null;
            }

            const loader = (componentModules as Record<string, any>)[path];
            if (!loader) {
              console.warn('[HomepageV2] Component module not found for block:', key, 'path:', path);
              return null;
            }

            const Lazy = React.lazy(async () => {
              const mod = await loader();
              return { default: mod.default ?? mod[Object.keys(mod)[0]] };
            });

            return (
              <React.Suspense key={key} fallback={<div className="my-6"><SkeletonShimmer className="h-40 w-full" /></div>}>
                <Lazy />
              </React.Suspense>
            );
          })}

          {/* Demo sections - Only visible to admin users */}
          {user?.role === 'admin' && (
            <>
              <div className="my-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Demo: App Shell (Nested Routes)</div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Switch between A/B — layout stays mounted.
                    </div>
                  </div>
                  <Link
                    to="/demo-shell/a"
                    className="h-10 px-4 inline-flex items-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold"
                  >
                    Open Demo
                  </Link>
                </div>
              </div>

              {/* SPA Persistence Test - Right before Footer/Privacy */}
              <div className="my-8 bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-2xl p-6 border-2 border-dashed border-purple-300 dark:border-purple-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                🧪 اختبار SPA - ملاحظة مؤقتة
              </h3>
              <Link
                to="/settings"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                اذهب إلى الإعدادات
              </Link>
            </div>
            <input
              type="text"
              value={spaTestNote}
              onChange={(e) => setSpaTestNote(e.target.value)}
              placeholder="اكتب أي شيء هنا... ثم انتقل إلى الإعدادات وارجع. إذا بقي النص، فالتطبيق SPA حقيقي!"
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-purple-200 dark:border-purple-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
              dir="rtl"
            />
            <p className="mt-2 text-xs text-purple-700 dark:text-purple-300">
              💡 نصيحة: اكتب شيئًا، ثم اذهب إلى الإعدادات، ثم ارجع. إذا كان النص لا يزال هنا، فهذا يثبت أن الصفحة لم يتم إعادة تحميلها!
            </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
