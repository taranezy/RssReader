import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RssItem, RssFeed } from '../../models/rss-feed.model';
import { RssFeedService } from '../../services/rss-feed.service';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

@Component({
  selector: 'app-list-view',
  imports: [CommonModule, SafeUrlPipe],
  templateUrl: './list-view.html',
  styleUrl: './list-view.scss'
})
export class ListViewComponent implements OnInit {
  items: RssItem[] = [];
  feeds: RssFeed[] = [];
  currentUrl: string | null = null;

  constructor(private feedService: RssFeedService) {}

  ngOnInit(): void {
    this.feedService.getFilteredItems().subscribe(items => {
      this.items = items;
    });

    this.feedService.feeds$.subscribe(feeds => {
      this.feeds = feeds;
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
