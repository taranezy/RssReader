import { Injectable } from '@angular/core';

interface CachedData {
  data: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocalCacheService {
  private readonly CACHE_PREFIX = 'rss_cache_';
  private readonly FEED_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly ITEMS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor() {}

  /**
   * Get cached data if still valid
   */
  getCache(key: string): any | null {
    try {
      const cached = localStorage.getItem(this.CACHE_PREFIX + key);
      if (!cached) {
        return null;
      }

      const parsed: CachedData = JSON.parse(cached);
      
      // Check if cache is still valid
      const age = Date.now() - parsed.timestamp;
      const ttl = key.includes('feeds') ? this.FEED_CACHE_TTL : this.ITEMS_CACHE_TTL;
      
      if (age > ttl) {
        // Cache expired, delete it
        this.clearCache(key);
        return null;
      }

      console.log(`[LocalCache] HIT: ${key} (age: ${Math.round(age / 1000)}s)`);
      return parsed.data;
    } catch (error) {
      console.warn('[LocalCache] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Set cache
   */
  setCache(key: string, data: any): void {
    try {
      const cacheData: CachedData = {
        data: data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(cacheData));
      console.log(`[LocalCache] SET: ${key}`);
    } catch (error) {
      console.warn('[LocalCache] Error setting cache:', error);
    }
  }

  /**
   * Clear specific cache
   */
  clearCache(key: string): void {
    try {
      localStorage.removeItem(this.CACHE_PREFIX + key);
      console.log(`[LocalCache] CLEARED: ${key}`);
    } catch (error) {
      console.warn('[LocalCache] Error clearing cache:', error);
    }
  }

  /**
   * Clear all feeds cache when feeds change
   */
  clearFeedsCache(): void {
    try {
      // Delete all feeds-related cache
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes(this.CACHE_PREFIX) && key.includes('feeds')) {
          localStorage.removeItem(key);
        }
      }
      console.log('[LocalCache] CLEARED ALL FEEDS CACHE');
    } catch (error) {
      console.warn('[LocalCache] Error clearing feeds cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    try {
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes(this.CACHE_PREFIX)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => localStorage.removeItem(key));
      console.log('[LocalCache] CLEARED ALL CACHE');
    } catch (error) {
      console.warn('[LocalCache] Error clearing all cache:', error);
    }
  }
}
