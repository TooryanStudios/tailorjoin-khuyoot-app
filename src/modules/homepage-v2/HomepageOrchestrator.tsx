import React from 'react';
import { useApp } from '../../../context/AppContext';
import { useLayoutStore } from './store/useLayoutStore';
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
  const { appSettings } = useApp();
  const hydrateFromRemote = useLayoutStore((s) => s.hydrateFromRemote);
  const order = useLayoutStore((s) => s.order);
  const visibility = useLayoutStore((s) => s.visibility);

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

    // Optional: allow remote/admin settings to override local layout.
    // If not present, store defaults (manifest + local persisted state) apply.
    hydrateFromRemote((appSettings as any)?.homePageV2Layout ?? null);
  }, [appSettings, hydrateFromRemote, previewEnabled]);

  return (
    <div className="w-full min-h-screen bg-[#050817] text-white">
      {/* Header: Full width background, centered content */}
      <header className="w-full border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          {/* Logo & Nav */}
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
        </div>
      </main>
    </div>
  );
}
