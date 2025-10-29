import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RssFeed, RssItem } from '../../models/rss-feed.model';
import { RssFeedService } from '../../services/rss-feed.service';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

interface FeedWidget {
  feed: RssFeed;
  items: RssItem[];
}

@Component({
  selector: 'app-grid-view',
  imports: [CommonModule, SafeUrlPipe],
  templateUrl: './grid-view.html',
  styleUrl: './grid-view.scss'
})
export class GridViewComponent implements OnInit {
  widgets: FeedWidget[] = [];
  currentUrl: string | null = null;
  private allItems: RssItem[] = [];

  constructor(private feedService: RssFeedService) {}

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
    this.currentUrl = item.link;
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
