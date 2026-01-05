import { useCallback, useEffect, useMemo, useRef } from 'react';

class LruBlobCache {
  /** @param {number} limit */
  constructor(limit) {
    this.limit = limit;
    /** @type {Map<string, string>} */
    this.map = new Map();
  }

  /** @param {string} key */
  get(key) {
    const value = this.map.get(key);
    if (!value) return null;

    // refresh recency
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  /** @param {string} key @param {string} blobUrl */
  set(key, blobUrl) {
    const existing = this.map.get(key);
    if (existing) {
      URL.revokeObjectURL(existing);
      this.map.delete(key);
    }

    this.map.set(key, blobUrl);

    while (this.map.size > this.limit) {
      const oldestKey = this.map.keys().next().value;
      const oldestUrl = this.map.get(oldestKey);
      if (oldestUrl) URL.revokeObjectURL(oldestUrl);
      this.map.delete(oldestKey);
    }
  }

  clear() {
    for (const url of this.map.values()) {
      URL.revokeObjectURL(url);
    }
    this.map.clear();
  }
}

/**
 * LRU cache for high-res images.
 * - Stores at most `limit` blob URLs
 * - Revokes URLs on eviction and unmount
 */
export const useImageCache = ({ limit = 10 } = {}) => {
  const cacheRef = useRef(null);
  if (cacheRef.current === null) cacheRef.current = new LruBlobCache(limit);

  const cache = cacheRef.current;

  const get = useCallback((key) => cache.get(key), [cache]);

  const prefetch = useCallback(
    async (key, url) => {
      if (!key || !url) return null;

      const existing = cache.get(key);
      if (existing) return existing;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      cache.set(key, blobUrl);
      return blobUrl;
    },
    [cache]
  );

  const api = useMemo(() => ({ get, prefetch }), [get, prefetch]);

  useEffect(() => {
    return () => {
      cache.clear();
    };
  }, [cache]);

  return api;
};
