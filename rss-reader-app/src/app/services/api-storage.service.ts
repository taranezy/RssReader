import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, tap } from 'rxjs';
import { RssFeed, RssItem, FeedViewPreference } from '../models/rss-feed.model';
import { LocalCacheService } from './local-cache.service';
import { environment } from '../../environments/environment';

// Single Responsibility Principle - handles all API communication with SQLite backend
@Injectable({
  providedIn: 'root'
})
export class ApiStorageService {
  private readonly apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  private readonly httpOptions = { withCredentials: true };

  constructor(
    private http: HttpClient,
    private localCache: LocalCacheService
  ) {}

  /**
   * Extract data from wrapped API response {success, data}
   * Falls back to original response if not wrapped
   */
  private extractData<T>(response: any): T {
    // Handle both wrapped {success, data} and direct data formats
    if (response && typeof response === 'object' && response.data !== undefined) {
      return response.data;
    }
    return response;
  }

  // ==================== FEEDS ====================
  
  getAllFeeds(): Observable<RssFeed[]> {
    // Check local cache first
    const cached = this.localCache.getCache('all_feeds');
    if (cached) {
      return of(cached);
    }

    // Not in cache, fetch from server
    return this.http.get<any>(`${this.apiUrl}/feeds`, this.httpOptions).pipe(
      map(response => {
        // Extract data from {success, data} wrapper using extractData
        let feeds = this.extractData<RssFeed[]>(response);
        
        // Ensure feeds is an array, handle stringified JSON
        if (!Array.isArray(feeds)) {
          console.warn('getAllFeeds: feeds is not an array:', typeof feeds, feeds);
          try {
            if (typeof feeds === 'string') {
              feeds = JSON.parse(feeds);
            }
          } catch (e) {
            console.error('Failed to parse feeds:', e);
            feeds = [];
          }
        }
        
        return Array.isArray(feeds) ? feeds : [];
      }),
      tap(feeds => {
        // Cache the result
        this.localCache.setCache('all_feeds', feeds);
      }),
      catchError(error => {
        console.error('Error fetching feeds:', error);
        return of([]);
      })
    );
  }

  getFeedById(id: string): Observable<RssFeed | null> {
    return this.http.get<any>(`${this.apiUrl}/feeds/${id}`, this.httpOptions).pipe(
      map(response => this.extractData<RssFeed>(response) || null),
      catchError(error => {
        console.error('Error fetching feed:', error);
        return of(null);
      })
    );
  }

  createFeed(feed: RssFeed): Observable<RssFeed> {
    return this.http.post<any>(`${this.apiUrl}/feeds`, feed, this.httpOptions).pipe(
      map(response => this.extractData<RssFeed>(response)),
      tap(() => {
        // Invalidate cache when feed is created
        this.localCache.clearFeedsCache();
      })
    );
  }

  updateFeed(id: string, updates: Partial<RssFeed>): Observable<RssFeed> {
    return this.http.put<any>(`${this.apiUrl}/feeds/${id}`, updates, this.httpOptions).pipe(
      map(response => this.extractData<RssFeed>(response)),
      tap(() => {
        // Invalidate cache when feed is updated
        this.localCache.clearFeedsCache();
      })
    );
  }

  deleteFeed(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/feeds/${id}`, this.httpOptions).pipe(
      tap(() => {
        // Invalidate cache when feed is deleted
        this.localCache.clearFeedsCache();
      })
    );
  }

  // ==================== ITEMS ====================
  
  getAllItems(): Observable<RssItem[]> {
    // Check local cache first
    const cached = this.localCache.getCache('all_items');
    if (cached) {
      // Convert dates from strings back to Date objects
      return of(Array.isArray(cached) ? cached.map(item => this.convertItemDates(item)) : []);
    }

    return this.http.get<any>(`${this.apiUrl}/items`, this.httpOptions).pipe(
      map(response => {
        // Extract data from {success, data} wrapper using extractData
        let items = this.extractData<RssItem[]>(response);
        
        // Ensure items is an array, handle stringified JSON
        if (!Array.isArray(items)) {
          try {
            if (typeof items === 'string') {
              items = JSON.parse(items);
            }
          } catch (e) {
            console.error('Failed to parse items:', e);
            items = [];
          }
        }
        
        return Array.isArray(items) ? items.map(item => this.convertItemDates(item)) : [];
      }),
      tap(items => {
        // Cache the result
        this.localCache.setCache('all_items', items);
      }),
      catchError(error => {
        console.error('Error fetching items:', error);
        return of([]);
      })
    );
  }

  getItemsByFeed(feedId: string): Observable<RssItem[]> {
    return this.http.get<any>(`${this.apiUrl}/feeds/${feedId}/items`, this.httpOptions).pipe(
      map(response => {
        // Extract data from {success, data} wrapper using extractData
        let items = this.extractData<RssItem[]>(response);
        
        // Ensure items is an array, handle stringified JSON
        if (!Array.isArray(items)) {
          console.warn('getItemsByFeed: items is not an array:', typeof items, items);
          try {
            if (typeof items === 'string') {
              items = JSON.parse(items);
            }
          } catch (e) {
            console.error('Failed to parse items:', e);
            items = [];
          }
        }
        
        return Array.isArray(items) ? items.map(item => this.convertItemDates(item)) : [];
      }),
      catchError(error => {
        console.error('Error fetching feed items:', error);
        return of([]);
      })
    );
  }

  createItem(item: RssItem): Observable<RssItem> {
    return this.http.post<any>(`${this.apiUrl}/items`, item, this.httpOptions).pipe(
      map(response => this.extractData<RssItem>(response))
    );
  }

  createItems(items: RssItem[]): Observable<{ created: number }> {
    return this.http.post<any>(`${this.apiUrl}/items/bulk`, items, this.httpOptions).pipe(
      map(response => this.extractData<{ created: number }>(response))
    );
  }

  updateItem(id: string, updates: Partial<RssItem>): Observable<{ success: boolean }> {
    return this.http.put<any>(`${this.apiUrl}/items/${id}`, updates, this.httpOptions).pipe(
      map(response => this.extractData<{ success: boolean }>(response))
    );
  }

  markAllAsRead(feedId?: string): Observable<{ success: boolean }> {
    return this.http.post<any>(`${this.apiUrl}/items/mark-all-read`, { feedId }, this.httpOptions).pipe(
      map(response => this.extractData<{ success: boolean }>(response))
    );
  }

  getSavedItems(): Observable<RssItem[]> {
    return this.http.get<any>(`${this.apiUrl}/items/saved`, this.httpOptions).pipe(
      map(response => {
        // Extract data from {success, data} wrapper using extractData
        let items = this.extractData<RssItem[]>(response);
        
        // Ensure items is an array, handle stringified JSON
        if (!Array.isArray(items)) {
          console.warn('getSavedItems: items is not an array:', typeof items);
          try {
            if (typeof items === 'string') {
              items = JSON.parse(items);
            }
          } catch (e) {
            console.error('Failed to parse items:', e);
            items = [];
          }
        }
        
        return Array.isArray(items) ? items.map(item => this.convertItemDates(item)) : [];
      }),
      catchError(error => {
        console.error('Error fetching saved items:', error);
        return of([]);
      })
    );
  }

  cleanupOldItems(feedId: string, daysOld: number = 30): Observable<number> {
    return this.http.post<any>(`${this.apiUrl}/items/cleanup-old`, { feedId, daysOld }, this.httpOptions).pipe(
      map(response => {
        // Extract data from {success, data} wrapper using extractData
        const data = this.extractData<any>(response);
        return data?.deletedCount || 0;
      }),
      catchError(error => {
        console.error('Error cleaning up old items:', error);
        return of(0);
      })
    );
  }

  // ==================== PREFERENCES ====================
  
  getPreferences(): Observable<FeedViewPreference> {
    return this.http.get<any>(`${this.apiUrl}/preferences`, this.httpOptions).pipe(
      map(response => {
        // Extract data from {success, data} wrapper using extractData
        const prefs = this.extractData<FeedViewPreference>(response);
        return prefs || {
          viewType: 'list' as 'list' | 'grid',
          selectedFeeds: [],
          showOnlyUnread: false,
          openInNewTab: true
        };
      }),
      catchError(error => {
        console.error('Error fetching preferences:', error);
        return of({
          viewType: 'list' as 'list' | 'grid',
          selectedFeeds: [],
          showOnlyUnread: false,
          openInNewTab: true
        } as FeedViewPreference);
      })
    );
  }

  updatePreferences(preferences: FeedViewPreference): Observable<FeedViewPreference> {
    return this.http.put<any>(`${this.apiUrl}/preferences`, preferences, this.httpOptions).pipe(
      map(response => {
        // Extract data from {success, data} wrapper using extractData
        const updated = this.extractData<FeedViewPreference>(response);
        return updated || preferences;
      }),
      catchError(error => {
        console.error('Error updating preferences:', error);
        return of(preferences);
      })
    );
  }

  // ==================== UTILITY ====================
  
  healthCheck(): Observable<{ status: string; timestamp: string }> {
    return this.http.get<{ status: string; timestamp: string }>(`${this.apiUrl}/health`, this.httpOptions);
  }

  private convertItemDates(item: any): RssItem {
    try {
      const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
      // Check if date is valid
      if (isNaN(pubDate.getTime())) {
        console.warn('Invalid pubDate for item:', item.title, 'using current date');
        return {
          ...item,
          pubDate: new Date()
        };
      }
      return {
        ...item,
        pubDate: pubDate
      };
    } catch (error) {
      console.warn('Error converting item dates:', error, 'using current date');
      return {
        ...item,
        pubDate: new Date()
      };
    }
  }
}
