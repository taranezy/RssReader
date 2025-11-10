import { Component, OnInit, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RssItem, RssFeed, FeedViewPreference } from '../../models/rss-feed.model';
import { RssFeedService } from '../../services/rss-feed.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { ArticleReaderComponent } from '../article-reader/article-reader';

@Component({
  selector: 'app-list-view',
  standalone: true,
  imports: [CommonModule, ArticleReaderComponent],
  templateUrl: './list-view.html',
  styleUrl: './list-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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
  pipArticle: RssItem | null = null; // Article shown in floating PIP overlay
  
  // Cached embed URLs to prevent iframe recreation
  previewEmbedUrl: SafeResourceUrl | null = null;
  pipEmbedUrl: SafeResourceUrl | null = null;
  
  isLargeScreen = false;
  showPreviewPane = true; // User preference to show/hide preview pane
  feedColumnWidth = 420; // Fixed width for feed list in pixels (default minimum width)
  isResizing = false;
  resizeStartX = 0;
  resizeStartWidth = 0;

  constructor(
    private feedService: RssFeedService,
    private userSettingsService: UserSettingsService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    
    // Subscribe to filtered items - updates in real-time
    this.feedService.getFilteredItems().subscribe((items: RssItem[]) => {
      console.log('[LIST-VIEW] Received items update:', items.length);
      this.items = items;
      // Always update - trackBy will protect iframe
      this.cdr.markForCheck();
    });

    this.feedService.feeds$.subscribe(feeds => {
      console.log('[LIST-VIEW] Received feeds update:', feeds.length);
      this.feeds = feeds;
      this.cdr.markForCheck();
    });

    this.feedService.preferences$.subscribe(prefs => {
      this.preferences = prefs;
      this.cdr.markForCheck();
    });

    this.userSettingsService.settings$.subscribe(settings => {
      this.showFeedImages = settings.showFeedImages;
      this.cdr.markForCheck();
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
    // ALWAYS mark change detection when user explicitly clicks
    console.log('[LIST-VIEW] User clicked item - allowing change detection');
    this.feedService.markAsRead(item.id);
    
    // On large screens with preview pane enabled and showing, always show in preview
    if (this.isLargeScreen && this.showPreviewPane) {
      const clickedItemHasVideo = this.getYouTubeVideoId(item.link);
      const previewHasVideo = this.selectedArticleForPreview && 
                              this.getYouTubeVideoId(this.selectedArticleForPreview.link);
      
      // If there's a video in preview and user clicks a different item
      if (this.selectedArticleForPreview && 
          this.selectedArticleForPreview.id !== item.id && 
          previewHasVideo) {
        // Move current video to PIP (regardless of what user clicked)
        this.pipArticle = this.selectedArticleForPreview;
        this.pipEmbedUrl = this.previewEmbedUrl; // Cache the URL
      }
      
      // Always show the clicked item in preview
      this.selectedArticleForPreview = item;
      this.previewEmbedUrl = this.getYouTubeEmbedUrl(item.link); // Cache the URL
      this.cdr.markForCheck();
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
    // If there's a video playing, move it to PIP before closing
    if (this.selectedArticleForPreview && 
        this.getYouTubeVideoId(this.selectedArticleForPreview.link)) {
      this.pipArticle = this.selectedArticleForPreview;
      this.pipEmbedUrl = this.previewEmbedUrl; // Cache the URL
    }
    this.selectedArticleForPreview = null;
    this.previewEmbedUrl = null;
  }

  closePipOverlay(): void {
    this.pipArticle = null;
    this.pipEmbedUrl = null;
    this.cdr.markForCheck();
  }

  openPipInPreview(): void {
    if (this.pipArticle) {
      // If preview has a video, swap them
      if (this.selectedArticleForPreview && 
          this.getYouTubeVideoId(this.selectedArticleForPreview.link)) {
        const temp = this.selectedArticleForPreview;
        const tempUrl = this.previewEmbedUrl;
        this.selectedArticleForPreview = this.pipArticle;
        this.previewEmbedUrl = this.pipEmbedUrl;
        this.pipArticle = temp;
        this.pipEmbedUrl = tempUrl;
      } else {
        // Just move PIP to preview
        this.selectedArticleForPreview = this.pipArticle;
        this.previewEmbedUrl = this.pipEmbedUrl;
        this.pipArticle = null;
        this.pipEmbedUrl = null;
      }
      this.cdr.markForCheck();
    }
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

  toggleSaved(item: RssItem, event: Event): void {
    event.stopPropagation();
    const newSavedStatus = !item.isSaved;
    this.feedService.toggleSaved(item.id, newSavedStatus);
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
    const newWidth = Math.max(420, Math.min(this.resizeStartWidth + deltaX, window.innerWidth - 600));
    this.feedColumnWidth = newWidth;

    // Save preference to localStorage
    localStorage.setItem('feedColumnWidth', newWidth.toString());
  }

  onResizeEnd(): void {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.onResizeMove.bind(this));
    document.removeEventListener('mouseup', this.onResizeEnd.bind(this));
  }

  /**
   * Extract YouTube video ID from various YouTube URL formats
   */
  getYouTubeVideoId(url: string): string | null {
    if (!url) return null;

    // Match various YouTube URL formats:
    // - https://www.youtube.com/watch?v=VIDEO_ID
    // - https://youtu.be/VIDEO_ID
    // - https://www.youtube.com/embed/VIDEO_ID
    // - https://www.youtube.com/v/VIDEO_ID
    // - https://www.youtube.com/feeds/videos.xml?channel_id=... (YouTube feed URLs)
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Generate safe YouTube embed URL
   */
  getYouTubeEmbedUrl(url: string): SafeResourceUrl | null {
    const videoId = this.getYouTubeVideoId(url);
    if (!videoId) return null;

    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  /**
   * Format item date for display in the left column
   * Shows relative time (e.g., "5m ago", "2h ago") for recent items
   * Shows date for older items (e.g., "Nov 08")
   */
  formatItemDate(date: Date | string | null): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    // For older items, show date like "Nov 08"
    return dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  }

  // TrackBy function to prevent unnecessary DOM recreation
  trackByItemId(index: number, item: RssItem): string {
    return item.id;
  }
}
