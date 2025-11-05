import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RssItem, RssFeed, FeedViewPreference } from '../../models/rss-feed.model';
import { RssFeedService } from '../../services/rss-feed.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { ArticleReaderComponent } from '../article-reader/article-reader';

@Component({
  selector: 'app-list-view',
  standalone: true,
  imports: [CommonModule, ArticleReaderComponent],
  templateUrl: './list-view.html',
  styleUrl: './list-view.scss'
})
export class ListViewComponent implements OnInit {
  items: RssItem[] = [];
  feeds: RssFeed[] = [];
  currentUrl: string | null = null;
  showFeedImages = true;
  preferences: FeedViewPreference = {
    viewType: 'list',
    selectedFeeds: [],
    showOnlyUnread: false,
    openInNewTab: true
  };
  selectedArticle: RssItem | null = null;
  selectedArticleForPreview: RssItem | null = null;
  isLargeScreen = false;
  showPreviewPane = true; // User preference to show/hide preview pane
  feedColumnWidth = 150; // Fixed width for feed list in pixels
  isResizing = false;
  resizeStartX = 0;
  resizeStartWidth = 0;

  constructor(
    private feedService: RssFeedService,
    private userSettingsService: UserSettingsService
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    
    this.feedService.getFilteredItems().subscribe(items => {
      this.items = items;
    });

    this.feedService.feeds$.subscribe(feeds => {
      this.feeds = feeds;
    });

    this.feedService.preferences$.subscribe(prefs => {
      this.preferences = prefs;
    });

    this.userSettingsService.settings$.subscribe(settings => {
      this.showFeedImages = settings.showFeedImages;
    });

    // Load preview pane preference from localStorage
    const savedPreference = localStorage.getItem('showPreviewPane');
    if (savedPreference !== null) {
      this.showPreviewPane = JSON.parse(savedPreference);
    }

    // Load feed column width preference from localStorage
    const savedWidth = localStorage.getItem('feedColumnWidth');
    if (savedWidth) {
      this.feedColumnWidth = parseInt(savedWidth, 10);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.isLargeScreen = window.innerWidth > 1300;
    // Close preview pane on smaller screens
    if (!this.isLargeScreen) {
      this.selectedArticleForPreview = null;
    }
  }

  togglePreviewPane(): void {
    this.showPreviewPane = !this.showPreviewPane;
    localStorage.setItem('showPreviewPane', JSON.stringify(this.showPreviewPane));
    if (!this.showPreviewPane) {
      this.selectedArticleForPreview = null;
    }
  }

  openArticle(item: RssItem): void {
    this.feedService.markAsRead(item.id);
    
    // On large screens with preview pane enabled and showing, always show in preview
    if (this.isLargeScreen && this.showPreviewPane) {
      this.selectedArticleForPreview = item;
    } else if (this.preferences.openInNewTab) {
      // Open in new tab
      window.open(item.link, '_blank', 'noopener,noreferrer');
    } else {
      // Open in full-screen article reader within the app
      this.selectedArticle = item;
    }
  }

  closeArticleReader(): void {
    this.selectedArticle = null;
  }

  closePreviewPane(): void {
    this.selectedArticleForPreview = null;
  }

  openPreviewInFullscreen(): void {
    if (this.selectedArticleForPreview) {
      this.selectedArticle = this.selectedArticleForPreview;
      this.selectedArticleForPreview = null;
    }
  }

  openPreviewInNewTab(): void {
    if (this.selectedArticleForPreview) {
      window.open(this.selectedArticleForPreview.link, '_blank', 'noopener,noreferrer');
    }
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

  startResize(event: MouseEvent): void {
    this.isResizing = true;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.feedColumnWidth;
    event.preventDefault();

    // Add mouse move and mouse up listeners
    document.addEventListener('mousemove', this.onResizeMove.bind(this));
    document.addEventListener('mouseup', this.onResizeEnd.bind(this));
  }

  onResizeMove(event: MouseEvent): void {
    if (!this.isResizing) return;

    const deltaX = event.clientX - this.resizeStartX;
    const newWidth = Math.max(100, Math.min(this.resizeStartWidth + deltaX, window.innerWidth - 600));
    this.feedColumnWidth = newWidth;

    // Save preference to localStorage
    localStorage.setItem('feedColumnWidth', newWidth.toString());
  }

  onResizeEnd(): void {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.onResizeMove.bind(this));
    document.removeEventListener('mouseup', this.onResizeEnd.bind(this));
  }
}
