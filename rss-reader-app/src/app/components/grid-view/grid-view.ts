import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RssFeed, RssItem } from '../../models/rss-feed.model';
import { RssFeedService } from '../../services/rss-feed.service';
import { UserSettingsService } from '../../services/user-settings.service';

interface FeedWidget {
  feed: RssFeed;
  items: RssItem[];
}

@Component({
  selector: 'app-grid-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grid-view.html',
  styleUrl: './grid-view.scss'
})
export class GridViewComponent implements OnInit {
  widgets: FeedWidget[] = [];
  currentUrl: string | null = null;
  showFeedImages = true;
  private allItems: RssItem[] = [];

  constructor(
    private feedService: RssFeedService,
    private userSettingsService: UserSettingsService
  ) {}

  ngOnInit(): void {
    this.feedService.items$.subscribe(items => {
      this.allItems = items;
      this.feedService.feeds$.subscribe(feeds => {
        this.updateWidgets(feeds);
      });
    });

    this.feedService.feeds$.subscribe(feeds => {
      this.updateWidgets(feeds);
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
      });
  }

  openArticle(item: RssItem): void {
    this.feedService.markAsRead(item.id);
    // Open in new tab instead of iframe to avoid X-Frame-Options issues
    window.open(item.link, '_blank', 'noopener,noreferrer');
  }

  closeArticle(): void {
    this.currentUrl = null;
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
