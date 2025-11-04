import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RssFeedService } from '../../services/rss-feed.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { RssItem, RssFeed } from '../../models/rss-feed.model';

@Component({
  selector: 'app-news-look',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './news-look.html',
  styleUrls: ['./news-look.scss']
})
export class NewsLookComponent implements OnInit, OnDestroy {
  items: RssItem[] = [];
  feeds: RssFeed[] = [];
  showFeedImages = true;
  private destroy$ = new Subject<void>();

  constructor(
    private feedService: RssFeedService,
    private userSettingsService: UserSettingsService
  ) {}

  ngOnInit(): void {
    this.feedService.items$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(items => {
      this.items = items;
    });

    this.feedService.feeds$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(feeds => {
      this.feeds = feeds;
    });

    this.userSettingsService.settings$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.showFeedImages = settings.showFeedImages;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openArticle(item: RssItem): void {
    this.feedService.markAsRead(item.id);
    window.open(item.link, '_blank', 'noopener,noreferrer');
  }

  toggleRead(event: Event, item: RssItem): void {
    event.stopPropagation();
    if (item.isRead) {
      this.feedService.markAsUnread(item.id);
    } else {
      this.feedService.markAsRead(item.id);
    }
  }

  getItemSize(index: number): string {
    // Create a newspaper-like pattern with different sizes
    const pattern = index % 12;
    
    switch(pattern) {
      case 0: return 'large'; // Hero article
      case 1:
      case 2: return 'medium';
      case 3:
      case 4:
      case 5: return 'small';
      case 6: return 'wide'; // Full width
      case 7:
      case 8: return 'medium';
      case 9:
      case 10:
      case 11: return 'small';
      default: return 'small';
    }
  }

  getFeedColor(feedId: string): string {
    const feed = this.feeds.find(f => f.id === feedId);
    return feed?.color || '#666';
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  }
}
