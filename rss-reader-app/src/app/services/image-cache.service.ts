import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';

interface CachedImage {
  url: string;
  blob: Blob;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageCacheService {
  private readonly DB_NAME = 'rss-reader-db';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'images';
  private readonly MAX_CACHE_SIZE = 104857600; // 100MB
  private readonly MAX_IMAGE_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

  private db: IDBDatabase | null = null;

  constructor(private http: HttpClient) {
    this.initializeDatabase();
  }

  /**
   * Initialize IndexedDB for image caching
   */
  private initializeDatabase(): void {
    if (!this.isIndexedDBAvailable()) {
      console.warn('[ImageCacheService] IndexedDB not available');
      return;
    }

    const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

    request.onerror = () => {
      console.error('[ImageCacheService] Failed to open IndexedDB:', request.error);
    };

    request.onsuccess = () => {
      this.db = request.result;
      console.log('[ImageCacheService] IndexedDB initialized successfully');
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store for images
      if (!db.objectStoreNames.contains(this.STORE_NAME)) {
        const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'url' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('[ImageCacheService] Object store created');
      }
    };
  }

  /**
   * Get cached image or fetch and cache it
   * Returns data URL for direct use in img src
   */
  getCachedImageUrl(imageUrl: string): Observable<string> {
    if (!imageUrl || !this.isIndexedDBAvailable()) {
      // Return original URL if caching unavailable
      return of(imageUrl);
    }

    return from(this.getFromCache(imageUrl)).pipe(
      switchMap(cachedBlob => {
        if (cachedBlob) {
          console.log('[ImageCacheService] Cache HIT for:', imageUrl);
          return of(URL.createObjectURL(cachedBlob));
        }

        console.log('[ImageCacheService] Cache MISS for:', imageUrl, '- fetching from source');
        
        // Not in cache, fetch from source
        return this.fetchAndCacheImage(imageUrl);
      }),
      catchError(error => {
        console.warn('[ImageCacheService] Error caching image, using original URL:', error);
        return of(imageUrl);
      })
    );
  }

  /**
   * Fetch image and cache it
   */
  private fetchAndCacheImage(imageUrl: string): Observable<string> {
    return this.http.get(imageUrl, { responseType: 'blob' }).pipe(
      switchMap(blob => {
        return from(this.saveToCache(imageUrl, blob)).pipe(
          switchMap(() => of(URL.createObjectURL(blob)))
        );
      }),
      catchError(error => {
        console.warn('[ImageCacheService] Failed to fetch image:', imageUrl, error);
        return of(imageUrl); // Fallback to original URL
      })
    );
  }

  /**
   * Get image from IndexedDB cache
   */
  private getFromCache(imageUrl: string): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      try {
        const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(imageUrl);

        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            // Check if cache is still valid (not older than MAX_IMAGE_AGE)
            if (Date.now() - result.timestamp < this.MAX_IMAGE_AGE) {
              resolve(result.blob);
            } else {
              // Cache expired, delete it
              this.deleteFromCache(imageUrl);
              resolve(null);
            }
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.warn('[ImageCacheService] Error reading from cache:', request.error);
          resolve(null);
        };
      } catch (error) {
        console.warn('[ImageCacheService] Error accessing IndexedDB:', error);
        resolve(null);
      }
    });
  }

  /**
   * Save image to IndexedDB cache
   */
  private saveToCache(imageUrl: string, blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      try {
        // Check cache size before saving
        this.checkCacheSize().then(() => {
          const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
          const store = transaction.objectStore(this.STORE_NAME);
          
          const cachedImage: CachedImage = {
            url: imageUrl,
            blob: blob,
            timestamp: Date.now()
          };

          const request = store.put(cachedImage);

          request.onsuccess = () => {
            console.log('[ImageCacheService] Cached image:', imageUrl);
            resolve();
          };

          request.onerror = () => {
            console.warn('[ImageCacheService] Error saving to cache:', request.error);
            resolve(); // Don't reject, just skip caching
          };
        }).catch(() => {
          resolve(); // Skip caching if size check fails
        });
      } catch (error) {
        console.warn('[ImageCacheService] Error saving to cache:', error);
        reject(error);
      }
    });
  }

  /**
   * Delete image from cache
   */
  private deleteFromCache(imageUrl: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }

      try {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.delete(imageUrl);

        request.onsuccess = () => {
          console.log('[ImageCacheService] Deleted image from cache:', imageUrl);
          resolve();
        };

        request.onerror = () => {
          console.warn('[ImageCacheService] Error deleting from cache:', request.error);
          resolve();
        };
      } catch (error) {
        console.warn('[ImageCacheService] Error deleting from cache:', error);
        resolve();
      }
    });
  }

  /**
   * Check cache size and delete oldest images if needed
   */
  private checkCacheSize(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }

      try {
        const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const images: CachedImage[] = request.result;
          
          // Calculate total size
          let totalSize = 0;
          for (const image of images) {
            totalSize += image.blob.size;
          }

          console.log(`[ImageCacheService] Cache size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);

          if (totalSize > this.MAX_CACHE_SIZE) {
            console.log('[ImageCacheService] Cache size exceeded, removing oldest images');
            // Sort by timestamp and delete oldest until under limit
            images.sort((a, b) => a.timestamp - b.timestamp);
            
            let sizeToRemove = totalSize - this.MAX_CACHE_SIZE;
            for (const image of images) {
              if (sizeToRemove <= 0) break;
              this.deleteFromCache(image.url);
              sizeToRemove -= image.blob.size;
            }
          }
          
          resolve();
        };

        request.onerror = () => {
          console.warn('[ImageCacheService] Error checking cache size:', request.error);
          resolve();
        };
      } catch (error) {
        console.warn('[ImageCacheService] Error checking cache size:', error);
        resolve();
      }
    });
  }

  /**
   * Clear all cached images
   */
  clearCache(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }

      try {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          console.log('[ImageCacheService] Cache cleared');
          resolve();
        };

        request.onerror = () => {
          console.warn('[ImageCacheService] Error clearing cache:', request.error);
          resolve();
        };
      } catch (error) {
        console.warn('[ImageCacheService] Error clearing cache:', error);
        resolve();
      }
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): Promise<{ count: number; size: string; oldest: Date | null }> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve({ count: 0, size: '0MB', oldest: null });
        return;
      }

      try {
        const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const images: CachedImage[] = request.result;
          let totalSize = 0;
          let oldest: Date | null = null;

          for (const image of images) {
            totalSize += image.blob.size;
            if (!oldest || image.timestamp < oldest.getTime()) {
              oldest = new Date(image.timestamp);
            }
          }

          resolve({
            count: images.length,
            size: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
            oldest
          });
        };

        request.onerror = () => {
          console.warn('[ImageCacheService] Error getting cache stats:', request.error);
          resolve({ count: 0, size: '0MB', oldest: null });
        };
      } catch (error) {
        console.warn('[ImageCacheService] Error getting cache stats:', error);
        resolve({ count: 0, size: '0MB', oldest: null });
      }
    });
  }

  /**
   * Check if IndexedDB is available
   */
  private isIndexedDBAvailable(): boolean {
    try {
      return typeof indexedDB !== 'undefined' && indexedDB !== null;
    } catch (error) {
      return false;
    }
  }
}
