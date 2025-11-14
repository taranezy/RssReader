import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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
  private readonly MAX_CACHE_SIZE = 52428800; // 50MB
  private readonly MAX_IMAGE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  private db: IDBDatabase | null = null;
  private cacheInProgress = new Set<string>();

  constructor(private http: HttpClient) {
    this.initializeDatabase();
  }

  /**
   * Initialize IndexedDB for image caching
   */
  private initializeDatabase(): void {
    if (!this.isIndexedDBAvailable()) {
      return;
    }

    const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

    request.onerror = () => {
      console.error('[ImageCacheService] Failed to open IndexedDB');
    };

    request.onsuccess = () => {
      this.db = request.result;
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(this.STORE_NAME)) {
        const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'url' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  }

  /**
   * Cache image in background after it loads successfully
   */
  cacheImageInBackground(imageUrl: string): void {
    if (!imageUrl || !this.isIndexedDBAvailable() || this.cacheInProgress.has(imageUrl)) {
      return;
    }

    // Check if already cached
    this.getFromCache(imageUrl).then(cached => {
      if (cached) {
        return;
      }

      // Mark as in-progress
      this.cacheInProgress.add(imageUrl);

      // Fetch in background
      this.http.get(imageUrl, { responseType: 'blob' }).subscribe({
        next: (blob: Blob) => {
          this.saveToCache(imageUrl, blob).finally(() => {
            this.cacheInProgress.delete(imageUrl);
          });
        },
        error: () => {
          this.cacheInProgress.delete(imageUrl);
        }
      });
    }).catch(() => {
      this.cacheInProgress.delete(imageUrl);
    });
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
          if (result && Date.now() - result.timestamp < this.MAX_IMAGE_AGE) {
            resolve(result.blob);
          } else {
            if (result) {
              this.deleteFromCache(imageUrl);
            }
            resolve(null);
          }
        };

        request.onerror = () => {
          resolve(null);
        };
      } catch (error) {
        resolve(null);
      }
    });
  }

  /**
   * Save image to IndexedDB cache
   */
  private saveToCache(imageUrl: string, blob: Blob): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }

      try {
        this.checkCacheSize().then(() => {
          const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
          const store = transaction.objectStore(this.STORE_NAME);
          
          const cachedImage: CachedImage = {
            url: imageUrl,
            blob: blob,
            timestamp: Date.now()
          };

          store.put(cachedImage);
          resolve();
        }).catch(() => {
          resolve();
        });
      } catch (error) {
        resolve();
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
        store.delete(imageUrl);
        resolve();
      } catch (error) {
        resolve();
      }
    });
  }

  /**
   * Check cache size and delete oldest if needed
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
          let totalSize = 0;
          
          for (const image of images) {
            totalSize += image.blob.size;
          }

          if (totalSize > this.MAX_CACHE_SIZE) {
            images.sort((a, b) => a.timestamp - b.timestamp);
            
            let sizeToRemove = totalSize - (this.MAX_CACHE_SIZE * 0.8);
            for (const image of images) {
              if (sizeToRemove <= 0) break;
              this.deleteFromCache(image.url);
              sizeToRemove -= image.blob.size;
            }
          }
          
          resolve();
        };

        request.onerror = () => {
          resolve();
        };
      } catch (error) {
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
        store.clear();
        resolve();
      } catch (error) {
        resolve();
      }
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): Promise<{ count: number; size: string }> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve({ count: 0, size: '0MB' });
        return;
      }

      try {
        const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const images: CachedImage[] = request.result;
          let totalSize = 0;

          for (const image of images) {
            totalSize += image.blob.size;
          }

          resolve({
            count: images.length,
            size: `${(totalSize / 1024 / 1024).toFixed(2)}MB`
          });
        };

        request.onerror = () => {
          resolve({ count: 0, size: '0MB' });
        };
      } catch (error) {
        resolve({ count: 0, size: '0MB' });
      }
    });
  }

  /**
   * Get cached image as blob URL for serving from cache
   * Returns null if not cached or expired
   */
  getCachedImageUrl(imageUrl: string): Promise<string | null> {
    return new Promise((resolve) => {
      this.getFromCache(imageUrl).then(blob => {
        if (blob) {
          // Create blob URL for serving cached image
          const blobUrl = URL.createObjectURL(blob);
          resolve(blobUrl);
        } else {
          resolve(null);
        }
      }).catch(() => {
        resolve(null);
      });
    });
  }

  /**
   * Check if IndexedDB is available
   */
  private isIndexedDBAvailable(): boolean {
    try {
      return typeof indexedDB !== 'undefined' && indexedDB !== null;
    } catch {
      return false;
    }
  }
}
