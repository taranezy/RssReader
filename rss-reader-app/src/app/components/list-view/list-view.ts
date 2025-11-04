import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RssItem, RssFeed } from '../../models/rss-feed.model';
import { RssFeedService } from '../../services/rss-feed.service';
import { UserSettingsService } from '../../services/user-settings.service';

@Component({
  selector: 'app-list-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-view.html',
  styleUrl: './list-view.scss'
})
export class ListViewComponent implements OnInit {
  items: RssItem[] = [];
  feeds: RssFeed[] = [];
  currentUrl: string | null = null;
  showFeedImages = true;

  constructor(
    private feedService: RssFeedService,
    private userSettingsService: UserSettingsService
  ) {}

  ngOnInit(): void {
    this.feedService.getFilteredItems().subscribe(items => {
      this.items = items;
    });

    this.feedService.feeds$.subscribe(feeds => {
      this.feeds = feeds;
    });

    this.userSettingsService.settings$.subscribe(settings => {
      this.showFeedImages = settings.showFeedImages;
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

  getFeedColor(item: RssItem): string {
    const feed = this.feeds.find((f: RssFeed) => f.id === item.feedId);
    return feed?.color || '#999';
  }

  getExcerpt(description: string, maxLength: number = 200): string {
    if (!description) return '';
    const text = description.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
}
