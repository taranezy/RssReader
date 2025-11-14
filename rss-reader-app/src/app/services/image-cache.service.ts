import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ImageCacheService {
  private readonly MAX_BLOB_URLS = 100; // Limit blob URL count
  private readonly BLOB_URL_TTL = 5 * 60 * 1000; // 5 minutes TTL for blob URLs

  private blobUrlCache = new Map<string, { url: string; timestamp: number }>(); // Cache ONLY the blob URLs
  private imageLoadCache = new Set<string>(); // Track which images are loaded

  constructor(private http: HttpClient) {}

  /**
   * Get cached blob URL for an image
   * Returns null if not cached or expired
   * 
   * Strategy: Cache ONLY the blob URLs (not the binary data)
   * - Blob URLs are instant to reuse
   * - Binary data is handled by browser's HTTP cache
   * - Minimal memory footprint
   */
  getCachedImageUrl(imageUrl: string): Promise<string | null> {
    return new Promise((resolve) => {
      // Check if blob URL exists and is still valid
      const cached = this.blobUrlCache.get(imageUrl);
      if (cached && Date.now() - cached.timestamp < this.BLOB_URL_TTL) {
        // Blob URL still valid, return it instantly (0-1ms)
        resolve(cached.url);
        return;
      }

      // Blob URL expired or doesn't exist - clean up if expired
      if (cached && Date.now() - cached.timestamp >= this.BLOB_URL_TTL) {
        try {
          URL.revokeObjectURL(cached.url);
        } catch (e) {
          console.warn('[ImageCacheService] Failed to revoke blob URL');
        }
        this.blobUrlCache.delete(imageUrl);
      }

      // No valid cached URL - return null
      // Browser will load from HTTP cache (fast) or network (normal speed)
      resolve(null);
    });
  }

  /**
   * Cache a blob URL for an image
   * Only called after image successfully loads from network
   * Stores URL, not binary data
   */
  cacheImageUrl(imageUrl: string, blobUrl: string): void {
    // Don't cache if already cached
    if (this.blobUrlCache.has(imageUrl)) {
      return;
    }

    // Cache the blob URL (NOT the binary data)
    this.blobUrlCache.set(imageUrl, {
      url: blobUrl,
      timestamp: Date.now()
    });

    // Enforce limit - revoke oldest if too many
    if (this.blobUrlCache.size > this.MAX_BLOB_URLS) {
      this.evictOldestBlobUrl();
    }
  }

  /**
   * Mark that an image has been loaded from network
   * Browser HTTP cache will handle future loads
   */
  markImageAsLoaded(imageUrl: string): void {
    this.imageLoadCache.add(imageUrl);
  }

  /**
   * Check if image was previously loaded
   */
  wasImageLoaded(imageUrl: string): boolean {
    return this.imageLoadCache.has(imageUrl);
  }

  /**
   * Evict oldest blob URL to prevent memory leak
   */
  private evictOldestBlobUrl(): void {
    const keysIterator = this.blobUrlCache.keys();
    const firstKey = keysIterator.next().value;
    if (firstKey !== undefined) {
      const cached = this.blobUrlCache.get(firstKey);
      if (cached) {
        try {
          URL.revokeObjectURL(cached.url);
        } catch (e) {
          console.warn('[ImageCacheService] Failed to revoke blob URL');
        }
      }
      this.blobUrlCache.delete(firstKey);
    }
  }

  /**
   * Clear all cached blob URLs and free memory
   * Called on app destroy or logout
   */
  clearBlobUrlCache(): void {
    // Revoke all blob URLs
    this.blobUrlCache.forEach(cached => {
      try {
        URL.revokeObjectURL(cached.url);
      } catch (e) {
        console.warn('[ImageCacheService] Failed to revoke blob URL during cleanup');
      }
    });
    this.blobUrlCache.clear();
    this.imageLoadCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): Promise<{ count: number; size: string }> {
    // Only blob URLs are cached, so size is negligible
    return Promise.resolve({
      count: this.blobUrlCache.size,
      size: '< 1MB' // Blob URLs are just strings, not binary data
    });
  }
}
