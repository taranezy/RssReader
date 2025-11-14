import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageCacheService {
  /**
   * SIMPLIFIED: No URL caching needed!
   * 
   * Why?
   * - Feed items are cached in localStorage with imageUrl field
   * - imageUrl is already part of cached RssItem data
   * - Browser HTTP cache handles binary image data
   * - No need to duplicate cache storage
   * 
   * Flow:
   * 1. Feed items cached in localStorage (includes imageUrl)
   * 2. Display cached item with imageUrl
   * 3. Browser HTTP cache loads the image efficiently
   * 4. Done - no separate image caching needed
   */

  constructor() {}

  /**
   * No-op: Image URLs are already in cached RssItem data
   */
  getCachedImageUrl(imageUrl: string): Promise<string | null> {
    return Promise.resolve(null);
  }

  /**
   * No-op: Feed items already cached in localStorage
   */
  cacheImageUrl(imageUrl: string, blobUrl: string): void {
    // Not needed - imageUrl is part of RssItem
  }

  /**
   * No-op: Already handled by browser HTTP cache
   */
  markImageAsLoaded(imageUrl: string): void {
    // Browser handles this automatically
  }

  /**
   * No-op: Already handled by browser HTTP cache
   */
  wasImageLoaded(imageUrl: string): boolean {
    return false;
  }

  /**
   * No-op: Nothing cached separately
   */
  clearBlobUrlCache(): void {
    // Nothing to clear
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): Promise<{ count: number; size: string }> {
    return Promise.resolve({
      count: 0,
      size: '0MB (images cached with feed items in localStorage)'
    });
  }
}
