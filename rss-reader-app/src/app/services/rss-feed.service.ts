import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, forkJoin, map, of, switchMap, tap, catchError, interval, from, concatMap, toArray } from 'rxjs';
import { RssFeed, RssItem, FeedViewPreference } from '../models/rss-feed.model';
import { ApiStorageService } from './api-storage.service';
import { RssParserService } from './rss-parser.service';
import { RssFeedFetcherService } from './rss-feed-fetcher.service';

// Single Responsibility Principle - manages RSS feeds and items with SQLite backend
@Injectable({
  providedIn: 'root'
})
export class RssFeedService {
  private feedsSubject = new BehaviorSubject<RssFeed[]>([]);
  private itemsSubject = new BehaviorSubject<RssItem[]>([]);
  private preferencesSubject = new BehaviorSubject<FeedViewPreference>({
    viewType: 'list',
    selectedFeeds: [],
    showOnlyUnread: false,
    openInNewTab: true // Default to current behavior (open in new tab)
  });
  
  // Track refresh progress
  private refreshProgressSubject = new BehaviorSubject<{total: number, completed: number, currentFeed: string}>({
    total: 0,
    completed: 0,
    currentFeed: ''
  });

  public feeds$ = this.feedsSubject.asObservable();
  public items$ = this.itemsSubject.asObservable();
  public preferences$ = this.preferencesSubject.asObservable();
  public refreshProgress$ = this.refreshProgressSubject.asObservable();

  private readonly defaultColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#6C5B7B'
  ];

  constructor(
    private apiStorage: ApiStorageService,
    private parser: RssParserService,
    private fetcher: RssFeedFetcherService
  ) {
    this.loadFeeds();
    this.loadItems();
    this.loadPreferences();
    
    // Auto-refresh all feeds every 60 seconds
    this.startAutoRefresh();
  }

  // Auto-refresh all feeds every 60 seconds
  private startAutoRefresh(): void {
    interval(600000).subscribe(() => {
      console.log('Starting auto-refresh in background...');
      this.refreshAllFeeds().subscribe({
        next: (count) => {
          console.log(`Auto-refresh completed: ${count} new items`);
        },
        error: (error) => {
          console.error('Error during auto-refresh:', error);
        }
      });
    });
  }

  // Feed Management
  addFeed(url: string, title?: string, category?: string): Observable<boolean> {
    const newFeed: RssFeed = {
      id: this.generateFeedId(),
      url: url,
      title: title || 'New Feed',
      color: this.getRandomColor(),
      category: category,
      isActive: true,
      addedDate: new Date(),
      lastFetched: undefined
    };

    return this.fetcher.fetchFeed(url).pipe(
      switchMap(xmlContent => {
        if (!xmlContent) {
          return of(false);
        }

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
        
        // Save to API
        return this.apiStorage.createFeed(newFeed).pipe(
          switchMap(() => {
            if (items.length > 0) {
              return this.apiStorage.createItems(items).pipe(
                tap(() => {
                  this.loadFeeds();
                  this.loadItems();
                }),
                map(() => true)
              );
            } else {
              this.loadFeeds();
              return of(true);
            }
          }),
          catchError(error => {
            console.error('Error saving feed:', error);
            return of(false);
          })
        );
      }),
      catchError(error => {
        console.error('Error adding feed:', error);
        return of(false);
      })
    );
  }

  removeFeed(feedId: string): void {
    this.apiStorage.deleteFeed(feedId).pipe(
      tap(() => {
        this.loadFeeds();
        this.loadItems();
      }),
      catchError(error => {
        console.error('Error removing feed:', error);
        return of(null);
      })
    ).subscribe();
  }

  updateFeed(feedId: string, updates: Partial<RssFeed>): void {
    this.apiStorage.updateFeed(feedId, updates).pipe(
      tap(() => {
        this.loadFeeds();
      }),
      catchError(error => {
        console.error('Error updating feed:', error);
        return of(null);
      })
    ).subscribe();
  }

  refreshFeed(feedId: string): Observable<number> {
    const feed = this.feedsSubject.value.find(f => f.id === feedId);
    if (!feed) {
      return of(0);
    }

    return this.fetcher.fetchFeed(feed.url).pipe(
      switchMap(xmlContent => {
        if (!xmlContent) {
          return of(0);
        }

        const newItems = this.parser.parseRssFeed(xmlContent, feed.id, feed.title);
        const existingItems = this.itemsSubject.value;
        
        // Filter out items that already exist
        const uniqueNewItems = newItems.filter(newItem => 
          !existingItems.some(existingItem => existingItem.id === newItem.id)
        );

        if (uniqueNewItems.length > 0) {
          return this.apiStorage.createItems(uniqueNewItems).pipe(
            switchMap(() => {
              // Update last fetched time
              return this.apiStorage.updateFeed(feedId, { lastFetched: new Date() }).pipe(
                tap(() => {
                  this.loadFeeds();
                  this.loadItems();
                }),
                map(() => uniqueNewItems.length)
              );
            })
          );
        } else {
          // Just update last fetched time
          return this.apiStorage.updateFeed(feedId, { lastFetched: new Date() }).pipe(
            tap(() => this.loadFeeds()),
            map(() => 0)
          );
        }
      }),
      catchError(error => {
        console.error('Error refreshing feed:', error);
        return of(0);
      })
    );
  }

  refreshAllFeeds(): Observable<number> {
    const activeFeeds = this.feedsSubject.value.filter(f => f.isActive);
    if (activeFeeds.length === 0) {
      this.refreshProgressSubject.next({ total: 0, completed: 0, currentFeed: '' });
      return of(0);
    }

    // Initialize progress tracking
    this.refreshProgressSubject.next({ total: activeFeeds.length, completed: 0, currentFeed: '' });
    
    // Use concatMap to refresh feeds sequentially instead of all at once
    // This prevents overwhelming the server and allows UI to remain responsive
    let totalNewItems = 0;
    let completed = 0;
    
    return from(activeFeeds).pipe(
      concatMap((feed: RssFeed) => {
        // Update progress with current feed
        this.refreshProgressSubject.next({ 
          total: activeFeeds.length, 
          completed: completed, 
          currentFeed: feed.title 
        });
        
        return this.refreshFeed(feed.id).pipe(
          tap(count => {
            totalNewItems += count;
            completed++;
            
            // Update progress
            this.refreshProgressSubject.next({ 
              total: activeFeeds.length, 
              completed: completed, 
              currentFeed: completed < activeFeeds.length ? '' : 'Complete' 
            });
            
            // Reload items after each feed completes so user sees progress
            if (count > 0) {
              this.loadItems();
            }
          }),
          catchError(error => {
            console.error(`Error refreshing feed ${feed.title}:`, error);
            completed++;
            this.refreshProgressSubject.next({ 
              total: activeFeeds.length, 
              completed: completed, 
              currentFeed: '' 
            });
            return of(0); // Continue with other feeds even if one fails
          })
        );
      }),
      toArray(), // Wait for all to complete
      switchMap(() => {
        // After refreshing all feeds, cleanup old items (older than 30 days)
        return this.apiStorage.cleanupOldItems().pipe(
          map(deletedCount => {
            if (deletedCount > 0) {
              console.log(`Cleaned up ${deletedCount} old items`);
              this.loadItems(); // Reload items after cleanup
            }
            
            // Reset progress
            this.refreshProgressSubject.next({ total: 0, completed: 0, currentFeed: '' });
            return totalNewItems;
          }),
          catchError(error => {
            console.error('Error cleaning up old items:', error);
            this.refreshProgressSubject.next({ total: 0, completed: 0, currentFeed: '' });
            return of(totalNewItems); // Continue even if cleanup fails
          })
        );
      })
    );
  }

  // Item Management
  markAsRead(itemId: string): void {
    this.apiStorage.updateItem(itemId, { isRead: true }).pipe(
      tap(() => this.loadItems()),
      catchError(error => {
        console.error('Error marking item as read:', error);
        return of(null);
      })
    ).subscribe();
  }

  markAsUnread(itemId: string): void {
    this.apiStorage.updateItem(itemId, { isRead: false }).pipe(
      tap(() => this.loadItems()),
      catchError(error => {
        console.error('Error marking item as unread:', error);
        return of(null);
      })
    ).subscribe();
  }

  markAllAsRead(feedId?: string): void {
    this.apiStorage.markAllAsRead(feedId).pipe(
      tap(() => {
        // If showing unread only, switch to all items after marking all as read
        const currentPrefs = this.preferencesSubject.value;
        if (currentPrefs.showOnlyUnread) {
          this.updatePreferences({ ...currentPrefs, showOnlyUnread: false });
        }
        this.loadItems();
      }),
      catchError(error => {
        console.error('Error marking all as read:', error);
        return of(null);
      })
    ).subscribe();
  }

  toggleSaved(itemId: string, isSaved: boolean): void {
    // Optimistically update UI immediately
    const currentItems = this.itemsSubject.value;
    const updatedItems = currentItems.map(item => 
      item.id === itemId ? { ...item, isSaved } : item
    );
    this.itemsSubject.next(updatedItems);

    // Then update on server
    this.apiStorage.updateItem(itemId, { isSaved }).pipe(
      catchError(error => {
        console.error('Error toggling saved status:', error);
        // Revert on error
        this.itemsSubject.next(currentItems);
        return of(null);
      })
    ).subscribe();
  }

  loadSavedItems(): void {
    console.log('Loading saved items...');
    this.apiStorage.getSavedItems().pipe(
      tap(items => {
        console.log(`Loaded ${items.length} saved items`);
        this.itemsSubject.next(items);
      }),
      catchError(error => {
        console.error('Error loading saved items:', error);
        return of([]);
      })
    ).subscribe();
  }

  // View Preferences
  updatePreferences(preferences: Partial<FeedViewPreference>): void {
    const current = this.preferencesSubject.value;
    const updated = { ...current, ...preferences };
    
    this.apiStorage.updatePreferences(updated).pipe(
      tap(() => this.preferencesSubject.next(updated)),
      catchError(error => {
        console.error('Error updating preferences:', error);
        return of(null);
      })
    ).subscribe();
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
    this.apiStorage.getAllFeeds().pipe(
      map(feeds => feeds.map(feed => ({
        ...feed,
        addedDate: new Date(feed.addedDate),
        lastFetched: feed.lastFetched ? new Date(feed.lastFetched) : undefined
      }))),
      tap(feeds => this.feedsSubject.next(feeds)),
      catchError(error => {
        console.error('Error loading feeds:', error);
        return of([]);
      })
    ).subscribe();
  }

  public loadItems(): void {
    this.apiStorage.getAllItems().pipe(
      tap(items => this.itemsSubject.next(items)),
      catchError(error => {
        console.error('Error loading items:', error);
        return of([]);
      })
    ).subscribe();
  }

  private loadPreferences(): void {
    this.apiStorage.getPreferences().pipe(
      tap(prefs => this.preferencesSubject.next(prefs)),
      catchError(error => {
        console.error('Error loading preferences:', error);
        return of(null);
      })
    ).subscribe();
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
