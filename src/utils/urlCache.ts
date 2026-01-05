/**
 * URL Cache Service
 * Caches Firebase Storage download URLs to avoid repeated getDownloadURL calls
 * URLs are cached with expiry time to handle token rotation
 */

interface CachedUrl {
  url: string;
  timestamp: number;
  path: string;
}

const CACHE_KEY = 'firebase_url_cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 500; // Maximum number of cached URLs

class UrlCacheService {
  private cache: Map<string, CachedUrl>;
  private initialized: boolean = false;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Initialize cache from localStorage
   */
  private init() {
    if (this.initialized) return;
    
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        
        // Load only non-expired entries
        Object.entries(parsed).forEach(([path, entry]: [string, any]) => {
          if (entry.timestamp && entry.url && (now - entry.timestamp) < CACHE_DURATION_MS) {
            this.cache.set(path, entry as CachedUrl);
          }
        });
        
        console.log(`✅ URL Cache loaded: ${this.cache.size} entries`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load URL cache:', error);
    }
    
    this.initialized = true;
  }

  /**
   * Save cache to localStorage
   */
  private persist() {
    try {
      // Convert Map to object for JSON serialization
      const cacheObj: Record<string, CachedUrl> = {};
      this.cache.forEach((value, key) => {
        cacheObj[key] = value;
      });
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
    } catch (error) {
      console.warn('⚠️ Failed to persist URL cache:', error);
      // If localStorage is full, clear old entries
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearExpired();
        try {
          const cacheObj: Record<string, CachedUrl> = {};
          this.cache.forEach((value, key) => {
            cacheObj[key] = value;
          });
          localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
        } catch {
          // If still fails, clear entire cache
          this.clear();
        }
      }
    }
  }

  /**
   * Get cached URL for a Firebase Storage path
   */
  get(path: string): string | null {
    this.init();
    
    const cached = this.cache.get(path);
    if (!cached) return null;
    
    const now = Date.now();
    const age = now - cached.timestamp;
    
    // Check if expired
    if (age > CACHE_DURATION_MS) {
      this.cache.delete(path);
      this.persist();
      return null;
    }
    
    return cached.url;
  }

  /**
   * Set URL in cache
   */
  set(path: string, url: string) {
    this.init();
    
    // Enforce max cache size (remove oldest entries)
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, 50); // Remove oldest 50
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
    
    this.cache.set(path, {
      url,
      path,
      timestamp: Date.now(),
    });
    
    this.persist();
  }

  /**
   * Check if URL exists and is valid
   */
  has(path: string): boolean {
    return this.get(path) !== null;
  }

  /**
   * Clear expired entries
   */
  clearExpired() {
    this.init();
    
    const now = Date.now();
    const toDelete: string[] = [];
    
    this.cache.forEach((entry, path) => {
      if ((now - entry.timestamp) > CACHE_DURATION_MS) {
        toDelete.push(path);
      }
    });
    
    toDelete.forEach(path => this.cache.delete(path));
    
    if (toDelete.length > 0) {
      console.log(`🧹 Cleared ${toDelete.length} expired URL cache entries`);
      this.persist();
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    try {
      localStorage.removeItem(CACHE_KEY);
      console.log('🧹 URL cache cleared');
    } catch (error) {
      console.warn('⚠️ Failed to clear URL cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    this.init();
    
    const now = Date.now();
    let fresh = 0;
    let stale = 0;
    
    this.cache.forEach(entry => {
      const age = now - entry.timestamp;
      if (age < CACHE_DURATION_MS) {
        fresh++;
      } else {
        stale++;
      }
    });
    
    return {
      total: this.cache.size,
      fresh,
      stale,
      maxSize: MAX_CACHE_SIZE,
      cacheDurationHours: CACHE_DURATION_MS / (60 * 60 * 1000),
    };
  }
}

// Export singleton instance
export const urlCache = new UrlCacheService();

// Clear expired entries on page load
if (typeof window !== 'undefined') {
  urlCache.clearExpired();
}
