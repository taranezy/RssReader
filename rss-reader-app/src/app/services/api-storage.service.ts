import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { RssFeed, RssItem, FeedViewPreference } from '../models/rss-feed.model';
import { environment } from '../../environments/environment';

// Single Responsibility Principle - handles all API communication with SQLite backend
@Injectable({
  providedIn: 'root'
})
export class ApiStorageService {
  private readonly apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  private readonly httpOptions = { withCredentials: true };

  constructor(private http: HttpClient) {}

  // ==================== FEEDS ====================
  
  getAllFeeds(): Observable<RssFeed[]> {
    return this.http.get<RssFeed[]>(`${this.apiUrl}/feeds`, this.httpOptions).pipe(
      catchError(error => {
        console.error('Error fetching feeds:', error);
        return of([]);
      })
    );
  }

  getFeedById(id: string): Observable<RssFeed | null> {
    return this.http.get<RssFeed>(`${this.apiUrl}/feeds/${id}`, this.httpOptions).pipe(
      catchError(error => {
        console.error('Error fetching feed:', error);
        return of(null);
      })
    );
  }

  createFeed(feed: RssFeed): Observable<RssFeed> {
    return this.http.post<RssFeed>(`${this.apiUrl}/feeds`, feed, this.httpOptions);
  }

  updateFeed(id: string, updates: Partial<RssFeed>): Observable<RssFeed> {
    return this.http.put<RssFeed>(`${this.apiUrl}/feeds/${id}`, updates, this.httpOptions);
  }

  deleteFeed(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/feeds/${id}`, this.httpOptions);
  }

  // ==================== ITEMS ====================
  
  getAllItems(): Observable<RssItem[]> {
    return this.http.get<RssItem[]>(`${this.apiUrl}/items`, this.httpOptions).pipe(
      map(items => items.map(item => this.convertItemDates(item))),
      catchError(error => {
        console.error('Error fetching items:', error);
        return of([]);
      })
    );
  }

  getItemsByFeed(feedId: string): Observable<RssItem[]> {
    return this.http.get<RssItem[]>(`${this.apiUrl}/feeds/${feedId}/items`, this.httpOptions).pipe(
      map(items => items.map(item => this.convertItemDates(item))),
      catchError(error => {
        console.error('Error fetching feed items:', error);
        return of([]);
      })
    );
  }

  createItem(item: RssItem): Observable<RssItem> {
    return this.http.post<RssItem>(`${this.apiUrl}/items`, item, this.httpOptions);
  }

  createItems(items: RssItem[]): Observable<{ created: number }> {
    return this.http.post<{ created: number }>(`${this.apiUrl}/items/bulk`, items, this.httpOptions);
  }

  updateItem(id: string, updates: Partial<RssItem>): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/items/${id}`, updates, this.httpOptions);
  }

  markAllAsRead(feedId?: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/items/mark-all-read`, { feedId }, this.httpOptions);
  }

  // ==================== PREFERENCES ====================
  
  getPreferences(): Observable<FeedViewPreference> {
    return this.http.get<FeedViewPreference>(`${this.apiUrl}/preferences`, this.httpOptions).pipe(
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
    return this.http.put<FeedViewPreference>(`${this.apiUrl}/preferences`, preferences, this.httpOptions);
  }

  // ==================== UTILITY ====================
  
  healthCheck(): Observable<{ status: string; timestamp: string }> {
    return this.http.get<{ status: string; timestamp: string }>(`${this.apiUrl}/health`, this.httpOptions);
  }

  private convertItemDates(item: any): RssItem {
    return {
      ...item,
      pubDate: new Date(item.pubDate)
    };
  }
}
