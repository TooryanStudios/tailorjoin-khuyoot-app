import * as React from 'react';

type CacheEntry = {
  blobUrl: string;
  lastAccess: number;
};

type CacheMetaV1 = {
  v: 1;
  order: string[]; // oldest -> newest
  touchedAt: number;
};

const STORAGE_KEY = 'khuyoot_thumbnail_cache_meta_v1';

const listeners = new Set<() => void>();
let version = 0;

const entries = new Map<string, CacheEntry>(); // remoteUrl -> entry (insertion order = LRU order)
const inFlight = new Map<string, Promise<string>>();
// IMPORTANT: Use a global capacity that only grows.
// If some views request a smaller maxEntries, it should NOT evict entries created
// for other views (otherwise navigating away/back causes visible image reloads).
let globalMaxEntries = 0;

function bump() {
  version += 1;
  listeners.forEach((l) => {
    try {
      l();
    } catch (e) {
      console.error('[Thumbnail Cache] Listener crash:', e);
    }
  });
}

function readMeta(): CacheMetaV1 | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheMetaV1;
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.order)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeMeta() {
  try {
    const meta: CacheMetaV1 = {
      v: 1,
      order: Array.from(entries.keys()),
      touchedAt: Date.now(),
    };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

function isCacheableUrl(url: string) {
  if (!url) return false;
  if (url.startsWith('blob:')) return false;
  if (url.startsWith('data:')) return false;
  return true;
}

function touch(url: string) {
  const existing = entries.get(url);
  if (!existing) return;

  entries.delete(url);
  entries.set(url, { ...existing, lastAccess: Date.now() });
  writeMeta();
}

async function fetchAsBlobUrl(remoteUrl: string): Promise<string> {
  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

function evictOldest(maxEntries: number) {
  while (entries.size > maxEntries) {
    const oldestKey = entries.keys().next().value as string | undefined;
    if (!oldestKey) return;
    const entry = entries.get(oldestKey);
    if (entry?.blobUrl) URL.revokeObjectURL(entry.blobUrl);
    entries.delete(oldestKey);
  }
}

function ensure(remoteUrl: string, maxEntries: number) {
  if (!isCacheableUrl(remoteUrl)) return;

  globalMaxEntries = Math.max(globalMaxEntries, maxEntries);

  const existing = entries.get(remoteUrl);
  if (existing) {
    touch(remoteUrl);
    return;
  }

  if (inFlight.has(remoteUrl)) return;

  const p = (async () => {
    try {
      const blobUrl = await fetchAsBlobUrl(remoteUrl);

      // Add as newest
      entries.set(remoteUrl, { blobUrl, lastAccess: Date.now() });
      evictOldest(globalMaxEntries);
      writeMeta();
      bump();
      return blobUrl;
    } finally {
      inFlight.delete(remoteUrl);
    }
  })();

  inFlight.set(remoteUrl, p);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return version;
}

function getServerSnapshot() {
  return 0;
}

export function useThumbnailCache(params?: { maxEntries?: number; enabled?: boolean }) {
  const maxEntries = params?.maxEntries ?? 30;
  const enabled = params?.enabled ?? true;

  // Make capacity monotonic (only grows) across the entire SPA session.
  // This prevents a view with a smaller maxEntries from shrinking the cache.
  React.useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    globalMaxEntries = Math.max(globalMaxEntries, maxEntries);
  }, [enabled, maxEntries]);

  // Ensure sessionStorage is initialized (metadata-only). We don't attempt to persist blobs.
  React.useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    const meta = readMeta();
    if (meta?.order?.length) {
      // No-op for now; metadata is mainly for debugging/observability and future warm strategies.
      // We intentionally don't prefetch everything on mount.
    }
  }, [enabled]);

  const getThumbnailSrc = React.useCallback(
    (remoteUrl: string | null | undefined) => {
      if (!enabled) return remoteUrl ?? null;
      if (!remoteUrl) return null;
      if (!isCacheableUrl(remoteUrl)) return remoteUrl;

      const entry = entries.get(remoteUrl);
      if (entry?.blobUrl) {
        return entry.blobUrl;
      }

      // Start background fetch; return remote URL for now.
      ensure(remoteUrl, maxEntries);
      return remoteUrl;
    },
    [enabled, maxEntries]
  );

  const prefetchThumbnails = React.useCallback(
    (urls: Array<string | null | undefined>) => {
      if (!enabled) return;
      for (const u of urls) {
        if (!u) continue;
        ensure(u, maxEntries);
      }
    },
    [enabled, maxEntries]
  );

  return { getThumbnailSrc, prefetchThumbnails };
}

/**
 * 🚀 SELECTIVE CACHE HOOK:
 * Only re-renders when the SPECIFIC url's blob availability changes.
 * This prevents the massive global re-render loop while keeping UI reactive.
 */
export function useThumbnail(url: string | null | undefined, params?: { maxEntries?: number; enabled?: boolean }) {
  const { getThumbnailSrc } = useThumbnailCache(params);
  const [currentSrc, setCurrentSrc] = React.useState(() => (url ? getThumbnailSrc(url) : null));

  React.useLayoutEffect(() => {
    if (!url) {
      setCurrentSrc(null);
      return;
    }

    // Update if url changed
    const initial = getThumbnailSrc(url);
    setCurrentSrc(initial);

    // If it's already a blob, no need to subscribe
    if (initial !== url) return;

    // Subscribe to cache updates
    const unsubscribe = subscribe(() => {
      const next = getThumbnailSrc(url);
      if (next !== url) {
        setCurrentSrc(next);
      }
    });

    return unsubscribe;
  }, [url, getThumbnailSrc]);

  return currentSrc;
}

