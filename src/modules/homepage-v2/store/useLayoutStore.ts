import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  HomePageV2BlockKey,
  HomePageV2BlockConfig,
  HomePageV2HeroConfig,
  HomePageV2LayoutManifest,
  HomePageV2LayoutState,
} from '../types';
import manifestJson from '../config/layout-manifest.json';

type LayoutActions = {
  hydrateFromManifest: () => void;
  hydrateFromRemote: (remote?: Partial<HomePageV2LayoutState> | null) => void;
  setVisible: (key: HomePageV2BlockKey, visible: boolean) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  setHero: (hero: Partial<HomePageV2HeroConfig>) => void;
  setBlockConfig: (key: HomePageV2BlockKey, config: Partial<HomePageV2BlockConfig>) => void;
};

const defaultHero: HomePageV2HeroConfig = { mediaType: 'image', mediaUrl: '' };

function buildKnownKeysSet(m: HomePageV2LayoutManifest): ReadonlySet<HomePageV2BlockKey> {
  return new Set(m.blocks.map((b) => b.key));
}

function sanitizeOrder(order: unknown, knownKeys: ReadonlySet<HomePageV2BlockKey>, fallback: HomePageV2BlockKey[]): HomePageV2BlockKey[] {
  if (!Array.isArray(order)) return fallback;

  const result: HomePageV2BlockKey[] = [];
  const seen = new Set<HomePageV2BlockKey>();

  for (const raw of order) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim() as HomePageV2BlockKey;
    if (!knownKeys.has(trimmed)) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result.length ? result : fallback;
}

function buildDefaultBlockConfig(m: HomePageV2LayoutManifest): Partial<Record<HomePageV2BlockKey, HomePageV2BlockConfig>> {
  const entries = m.blocks
    .filter((b) => !!b.defaultConfig)
    .map((b) => [b.key, b.defaultConfig!] as const);
  return Object.fromEntries(entries) as Partial<Record<HomePageV2BlockKey, HomePageV2BlockConfig>>;
}

function ensureManifestSync(state: HomePageV2LayoutState, manifest: HomePageV2LayoutManifest): HomePageV2LayoutState {
  const nextOrder = [...state.order];
  const nextVisibility = { ...state.visibility } as Record<HomePageV2BlockKey, boolean>;
  const nextBlockConfig = { ...state.blockConfig } as Partial<Record<HomePageV2BlockKey, HomePageV2BlockConfig>>;

  manifest.blocks.forEach((b) => {
    if (!nextOrder.includes(b.key)) nextOrder.push(b.key as HomePageV2BlockKey);
    if (typeof nextVisibility[b.key] === 'undefined') {
      nextVisibility[b.key] = b.defaultVisible;
    }
    if (b.defaultConfig && !nextBlockConfig[b.key]) {
      nextBlockConfig[b.key] = b.defaultConfig;
    }
  });

  return {
    ...state,
    manifestVersion: manifest.version,
    order: nextOrder,
    visibility: nextVisibility,
    blockConfig: nextBlockConfig,
  };
}

function normalizeFromManifest(m: HomePageV2LayoutManifest): HomePageV2LayoutState {
  const order = m.blocks.map((b) => b.key);
  const visibility = Object.fromEntries(m.blocks.map((b) => [b.key, b.defaultVisible])) as Record<HomePageV2BlockKey, boolean>;
  return {
    manifestVersion: m.version,
    order,
    visibility,
    hero: defaultHero,
    blockConfig: buildDefaultBlockConfig(m),
  };
}

const manifest = manifestJson as unknown as HomePageV2LayoutManifest;
const knownKeys = buildKnownKeysSet(manifest);

// Custom storage with quota error handling
const storageWithQuotaHandling = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.warn('[useLayoutStore] Failed to read from localStorage:', error);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('[useLayoutStore] localStorage quota exceeded, clearing old data...');
        try {
          // Clear the specific key and try again
          localStorage.removeItem(name);
          localStorage.setItem(name, value);
          console.log('[useLayoutStore] Successfully saved after clearing old data');
        } catch (retryError) {
          console.error('[useLayoutStore] Failed to save even after clearing:', retryError);
          // If still failing, clear all homepage-v2 related keys
          try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.includes('khuyoot:homepage-v2')) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            localStorage.setItem(name, value);
            console.log('[useLayoutStore] Saved after clearing all homepage-v2 data');
          } catch (finalError) {
            console.error('[useLayoutStore] Critical: Cannot save to localStorage', finalError);
          }
        }
      } else {
        console.error('[useLayoutStore] localStorage error:', error);
      }
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.warn('[useLayoutStore] Failed to remove from localStorage:', error);
    }
  },
};

export const useLayoutStore = create<HomePageV2LayoutState & LayoutActions>()(
  persist(
    (set, get) => ({
      ...ensureManifestSync(normalizeFromManifest(manifest), manifest),

      hydrateFromManifest: () => {
        set((prev) => {
          const next = normalizeFromManifest(manifest);
          const merged = ensureManifestSync({
            ...next,
            hero: prev.hero ?? defaultHero,
            blockConfig: prev.blockConfig ?? next.blockConfig,
          }, manifest);
          return merged;
        });
      },

      hydrateFromRemote: (remote) => {
        if (!remote) return;
        set((prev) => {
          const nextOrder = sanitizeOrder(remote.order, knownKeys, prev.order);
          const nextVisibility = (remote.visibility as any) ? { ...prev.visibility, ...(remote.visibility as any) } : prev.visibility;
          const nextHero = (remote.hero as any) ? { ...prev.hero, ...(remote.hero as any) } : prev.hero;
          const nextBlockConfig = (remote as any)?.blockConfig ? { ...prev.blockConfig, ...(remote as any).blockConfig } : prev.blockConfig;
          return ensureManifestSync(
            {
              ...prev,
              manifestVersion: typeof remote.manifestVersion === 'number' ? remote.manifestVersion : prev.manifestVersion,
              order: nextOrder,
              visibility: nextVisibility,
              hero: nextHero,
              blockConfig: nextBlockConfig,
            },
            manifest
          );
        });
      },

      setVisible: (key, visible) => {
        set((prev) => ({
          ...prev,
          visibility: { ...prev.visibility, [key]: visible },
        }));
      },

      moveBlock: (fromIndex, toIndex) => {
        set((prev) => {
          const order = [...prev.order];
          if (fromIndex < 0 || fromIndex >= order.length) return prev;
          if (toIndex < 0 || toIndex >= order.length) return prev;
          const [moved] = order.splice(fromIndex, 1);
          order.splice(toIndex, 0, moved);
          return { ...prev, order };
        });
      },

      setHero: (hero) => {
        set((prev) => ({ ...prev, hero: { ...prev.hero, ...hero } }));
      },

      setBlockConfig: (key, config) => {
        set((prev) => ({
          ...prev,
          blockConfig: { ...prev.blockConfig, [key]: { ...(prev.blockConfig[key] ?? {}), ...config } as HomePageV2BlockConfig },
        }));
      },
    }),
    {
      name: 'khuyoot:homepage-v2:layout',
      version: 1,
      storage: storageWithQuotaHandling,
      migrate: async (persistedState: any) => {
        if (!persistedState) return ensureManifestSync(normalizeFromManifest(manifest), manifest);
        const withSanitizedOrder: HomePageV2LayoutState = {
          ...(persistedState as HomePageV2LayoutState),
          order: sanitizeOrder((persistedState as any).order, knownKeys, normalizeFromManifest(manifest).order),
        };
        return ensureManifestSync(withSanitizedOrder, manifest);
      },
      partialize: (state) => ({
        manifestVersion: state.manifestVersion,
        order: state.order,
        visibility: state.visibility,
        hero: state.hero,
        blockConfig: state.blockConfig,
      }),
    }
  )
);
