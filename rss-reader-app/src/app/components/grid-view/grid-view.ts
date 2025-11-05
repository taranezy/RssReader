import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RssFeed, RssItem, FeedViewPreference } from '../../models/rss-feed.model';
import { RssFeedService } from '../../services/rss-feed.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { ArticleReaderComponent } from '../article-reader/article-reader';

interface FeedWidget {
  feed: RssFeed;
  items: RssItem[];
}

@Component({
  selector: 'app-grid-view',
  standalone: true,
  imports: [CommonModule, ArticleReaderComponent],
  templateUrl: './grid-view.html',
  styleUrl: './grid-view.scss'
})
export class GridViewComponent implements OnInit {
  widgets: FeedWidget[] = [];
  currentUrl: string | null = null;
  showFeedImages = true;
  private allItems: RssItem[] = [];
  preferences: FeedViewPreference = {
    viewType: 'grid',
    selectedFeeds: [],
    showOnlyUnread: false,
    openInNewTab: true
  };
  selectedArticle: RssItem | null = null;

  constructor(
    private feedService: RssFeedService,
    private userSettingsService: UserSettingsService
  ) {}

  ngOnInit(): void {
    // Use getFilteredItems() to respect feed filter selection
    this.feedService.getFilteredItems().subscribe(items => {
      this.allItems = items;
      this.feedService.feeds$.subscribe(feeds => {
        this.updateWidgets(feeds);
      });
    });

    this.feedService.feeds$.subscribe(feeds => {
      this.updateWidgets(feeds);
    });

    this.feedService.preferences$.subscribe(prefs => {
      this.preferences = prefs;
    });

    this.userSettingsService.settings$.subscribe(settings => {
      this.showFeedImages = settings.showFeedImages;
    });
  }

  private updateWidgets(feeds: RssFeed[]): void {
    this.widgets = feeds
      .filter(feed => feed.isActive)
      .map(feed => {
        const feedItems = this.allItems
          .filter((item: RssItem) => item.feedId === feed.id)
          .sort((a: RssItem, b: RssItem) => b.pubDate.getTime() - a.pubDate.getTime())
          .slice(0, 10); // Last 10 items

        return {
          feed,
          items: feedItems
        };
      })
      .filter(widget => widget.items.length > 0); // Only show widgets with items
  }

  openArticle(item: RssItem): void {
    this.feedService.markAsRead(item.id);
    
    if (this.preferences.openInNewTab) {
      // Open in new tab
      window.open(item.link, '_blank', 'noopener,noreferrer');
    } else {
      // Open in article reader within the app
      this.selectedArticle = item;
    }
  }

  closeArticleReader(): void {
    this.selectedArticle = null;
  }

  toggleRead(item: RssItem, event: Event): void {
    event.stopPropagation();
    if (item.isRead) {
      this.feedService.markAsUnread(item.id);
    } else {
      this.feedService.markAsRead(item.id);
    }
  }

  getUnreadCount(widget: FeedWidget): number {
    return widget.items.filter(item => !item.isRead).length;
  }
}
