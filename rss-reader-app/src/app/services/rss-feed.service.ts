import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, forkJoin, map, of } from 'rxjs';
import { RssFeed, RssItem, FeedViewPreference } from '../models/rss-feed.model';
import { LocalStorageService } from './local-storage.service';
import { RssParserService } from './rss-parser.service';
import { RssFeedFetcherService } from './rss-feed-fetcher.service';

// Single Responsibility Principle - manages RSS feeds and items
@Injectable({
  providedIn: 'root'
})
export class RssFeedService {
  private readonly FEEDS_KEY = 'rss_feeds';
  private readonly ITEMS_KEY = 'rss_items';
  private readonly PREFERENCES_KEY = 'feed_preferences';
  
  private feedsSubject = new BehaviorSubject<RssFeed[]>([]);
  private itemsSubject = new BehaviorSubject<RssItem[]>([]);
  private preferencesSubject = new BehaviorSubject<FeedViewPreference>({
    viewType: 'list',
    selectedFeeds: [],
    showOnlyUnread: false
  });

  public feeds$ = this.feedsSubject.asObservable();
  public items$ = this.itemsSubject.asObservable();
  public preferences$ = this.preferencesSubject.asObservable();

  private readonly defaultColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#6C5B7B'
  ];

  constructor(
    private storage: LocalStorageService,
    private parser: RssParserService,
    private fetcher: RssFeedFetcherService
  ) {
    this.loadFeeds();
    this.loadItems();
    this.loadPreferences();
  }

  // Feed Management
  addFeed(url: string, title?: string): Observable<boolean> {
    const newFeed: RssFeed = {
      id: this.generateFeedId(),
      url: url,
      title: title || 'New Feed',
      color: this.getRandomColor(),
      isActive: true,
      addedDate: new Date(),
      lastFetched: undefined
    };

    return new Observable<boolean>(observer => {
      this.fetcher.fetchFeed(url).subscribe({
        next: (xmlContent) => {
          if (xmlContent) {
            const items = this.parser.parseRssFeed(xmlContent, newFeed.id, newFeed.title);
            
            // Extract feed title from XML if not provided
            if (!title) {
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
              const feedTitleElement = xmlDoc.querySelector('channel > title, feed > title');
              if (feedTitleElement?.textContent) {
                newFeed.title = feedTitleElement.textContent.trim();
              }
            }

            newFeed.lastFetched = new Date();
            
            // Save feed and items
            const feeds = this.feedsSubject.value;
            feeds.push(newFeed);
            this.saveFeeds(feeds);
            
            if (items.length > 0) {
              const allItems = [...this.itemsSubject.value, ...items];
              this.saveItems(allItems);
            }

            observer.next(true);
            observer.complete();
          } else {
            observer.next(false);
            observer.complete();
          }
        },
        error: (error) => {
          console.error('Error adding feed:', error);
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  removeFeed(feedId: string): void {
    const feeds = this.feedsSubject.value.filter(f => f.id !== feedId);
    this.saveFeeds(feeds);
    
    // Also remove all items from this feed
    const items = this.itemsSubject.value.filter(i => i.feedId !== feedId);
    this.saveItems(items);
  }

  updateFeed(feedId: string, updates: Partial<RssFeed>): void {
    const feeds = this.feedsSubject.value.map(f => 
      f.id === feedId ? { ...f, ...updates } : f
    );
    this.saveFeeds(feeds);
  }

  refreshFeed(feedId: string): Observable<number> {
    const feed = this.feedsSubject.value.find(f => f.id === feedId);
    if (!feed) {
      return of(0);
    }

    return new Observable<number>(observer => {
      this.fetcher.fetchFeed(feed.url).subscribe({
        next: (xmlContent) => {
          if (xmlContent) {
            const newItems = this.parser.parseRssFeed(xmlContent, feed.id, feed.title);
            const existingItems = this.itemsSubject.value;
            
            // Filter out items that already exist
            const uniqueNewItems = newItems.filter(newItem => 
              !existingItems.some(existingItem => existingItem.id === newItem.id)
            );

            if (uniqueNewItems.length > 0) {
              const allItems = [...existingItems, ...uniqueNewItems];
              this.saveItems(allItems);
            }

            // Update last fetched time
            this.updateFeed(feedId, { lastFetched: new Date() });

            observer.next(uniqueNewItems.length);
            observer.complete();
          } else {
            observer.next(0);
            observer.complete();
          }
        },
        error: (error) => {
          console.error('Error refreshing feed:', error);
          observer.next(0);
          observer.complete();
        }
      });
    });
  }

  refreshAllFeeds(): Observable<number> {
    const activeFeeds = this.feedsSubject.value.filter(f => f.isActive);
    if (activeFeeds.length === 0) {
      return of(0);
    }

    const refreshObservables = activeFeeds.map(feed => this.refreshFeed(feed.id));
    
    return forkJoin(refreshObservables).pipe(
      map(results => results.reduce((sum, count) => sum + count, 0))
    );
  }

  // Item Management
  markAsRead(itemId: string): void {
    const items = this.itemsSubject.value.map(item =>
      item.id === itemId ? { ...item, isRead: true } : item
    );
    this.saveItems(items);
  }

  markAsUnread(itemId: string): void {
    const items = this.itemsSubject.value.map(item =>
      item.id === itemId ? { ...item, isRead: false } : item
    );
    this.saveItems(items);
  }

  markAllAsRead(feedId?: string): void {
    const items = this.itemsSubject.value.map(item =>
      (!feedId || item.feedId === feedId) ? { ...item, isRead: true } : item
    );
    this.saveItems(items);
  }

  // View Preferences
  updatePreferences(preferences: Partial<FeedViewPreference>): void {
    const current = this.preferencesSubject.value;
    const updated = { ...current, ...preferences };
    this.preferencesSubject.next(updated);
    this.storage.save(this.PREFERENCES_KEY, updated);
  }

  // Filtered Items
  getFilteredItems(): Observable<RssItem[]> {
    return combineLatest([this.items$, this.preferences$]).pipe(
      map(([items, prefs]) => {
        let filtered = items;

        // Filter by selected feeds
        if (prefs.selectedFeeds.length > 0) {
          filtered = filtered.filter(item => prefs.selectedFeeds.includes(item.feedId));
        }

        // Filter by read status
        if (prefs.showOnlyUnread) {
          filtered = filtered.filter(item => !item.isRead);
        }

        // Sort by date (newest first)
        return filtered.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
      })
    );
  }

  // Helper Methods
  private loadFeeds(): void {
    const feeds = this.storage.load(this.FEEDS_KEY);
    if (feeds) {
      // Convert date strings back to Date objects
      const parsedFeeds = feeds.map((feed: any) => ({
        ...feed,
        addedDate: new Date(feed.addedDate),
        lastFetched: feed.lastFetched ? new Date(feed.lastFetched) : undefined
      }));
      this.feedsSubject.next(parsedFeeds);
    }
  }

  private loadItems(): void {
    const items = this.storage.load(this.ITEMS_KEY);
    if (items) {
      // Convert date strings back to Date objects
      const parsedItems = items.map((item: any) => ({
        ...item,
        pubDate: new Date(item.pubDate)
      }));
      this.itemsSubject.next(parsedItems);
    }
  }

  private loadPreferences(): void {
    const prefs = this.storage.load(this.PREFERENCES_KEY);
    if (prefs) {
      this.preferencesSubject.next(prefs);
    }
  }

  private saveFeeds(feeds: RssFeed[]): void {
    this.storage.save(this.FEEDS_KEY, feeds);
    this.feedsSubject.next(feeds);
  }

  private saveItems(items: RssItem[]): void {
    this.storage.save(this.ITEMS_KEY, items);
    this.itemsSubject.next(items);
  }

  private generateFeedId(): string {
    return `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRandomColor(): string {
    const usedColors = this.feedsSubject.value.map(f => f.color);
    const availableColors = this.defaultColors.filter(c => !usedColors.includes(c));
    
    if (availableColors.length > 0) {
      return availableColors[Math.floor(Math.random() * availableColors.length)];
    }
    
    return this.defaultColors[Math.floor(Math.random() * this.defaultColors.length)];
  }
}
