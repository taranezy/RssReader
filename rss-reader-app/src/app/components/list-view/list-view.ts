import { Component, OnInit, HostListener, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';
import { RssItem, RssFeed, FeedViewPreference } from '../../models/rss-feed.model';
import { RssFeedService } from '../../services/rss-feed.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { PipStateService } from '../../services/pip-state.service';
import { ImageCacheService } from '../../services/image-cache.service';
import { ArticleReaderComponent } from '../article-reader/article-reader';

@Component({
  selector: 'app-list-view',
  standalone: true,
  imports: [CommonModule, ArticleReaderComponent],
  templateUrl: './list-view.html',
  styleUrl: './list-view.scss',
  changeDetection: ChangeDetectionStrategy.Default
})
export class ListViewComponent implements OnInit {
  private _items: RssItem[] = [];
  
  get items(): RssItem[] {
    // Always ensure _items is an array
    if (!Array.isArray(this._items)) {
      if (typeof this._items === 'string') {
        try {
          this._items = JSON.parse(this._items);
        } catch (e) {
          console.error('[LIST-VIEW] Failed to parse:', e);
          this._items = [];
        }
      } else {
        this._items = [];
      }
    }
    return this._items;
  }
  
  set items(value: any) {
    if (typeof value === 'string') {
      try {
        this._items = JSON.parse(value);
      } catch (e) {
        console.error('[LIST-VIEW] Failed to parse string:', e);
        this._items = [];
      }
    } else if (Array.isArray(value)) {
      this._items = value;
    } else if (value === undefined || value === null) {
      this._items = [];
    } else {
      this._items = [];
    }
  }

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
  
  // Expose global PIP state to template
  pipState$: any;
  
  // Container A - can be in preview or PIP
  containerAArticle: RssItem | null = null;
  containerAUrl: SafeResourceUrl | null = null;
  containerAInPip = false; // true = A is in PIP, false = A is in preview or hidden
  
  // Container B - can be in preview or PIP
  containerBArticle: RssItem | null = null;
  containerBUrl: SafeResourceUrl | null = null;
  containerBInPip = false; // true = B is in PIP, false = B is in preview or hidden
  
  // Which container is currently active (showing in preview or PIP)
  activeContainer: 'A' | 'B' = 'A'; // The container displayed in preview when no PIP
  
  // PIP state
  isVideoInPipMode = false; // true = one of the containers is in PIP
  pipContainer: 'A' | 'B' | null = null; // Track which container is in PIP
  hasEverHadVideoPIP = false; // true = user has manually closed a video from PIP at least once
  isPIPEnabled = true; // Whether PIP feature is enabled in user settings
  
  isLargeScreen = false;
  showPreviewPane = true; // User preference to show/hide preview pane
  feedColumnWidth = 420; // Fixed width for feed list in pixels (default minimum width)
  isResizing = false;
  resizeStartX = 0;
  resizeStartWidth = 0;

  @ViewChild('previewVideoContainer', { read: ElementRef }) previewVideoContainer?: ElementRef;
  @ViewChild('pipVideoContainer', { read: ElementRef }) pipVideoContainer?: ElementRef;
  
  private transitionInProgress = false; // Prevent rapid successive transitions
  private closedContainerId: 'A' | 'B' | null = null; // Track which container was closed during delay

  constructor(
    private feedService: RssFeedService,
    private userSettingsService: UserSettingsService,
    private pipStateService: PipStateService,
    private imageCacheService: ImageCacheService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2
  ) {
    this.pipState$ = this.pipStateService.pipState$;
  }

  ngOnInit(): void {
    this.checkScreenSize();
    
    // Subscribe to filtered items - updates in real-time
    this.feedService.getFilteredItems().subscribe((items: RssItem[]) => {
      this.items = items;
      // Always update - trackBy will protect iframe
      this.cdr.markForCheck();
    });

    this.feedService.feeds$.subscribe(feeds => {
      this.feeds = feeds;
      this.cdr.markForCheck();
    });

    this.feedService.preferences$.subscribe(prefs => {
      this.preferences = prefs;
      this.cdr.markForCheck();
    });

    this.userSettingsService.settings$.subscribe(settings => {
      this.showFeedImages = settings.showFeedImages;
      this.isPIPEnabled = settings.enablePIP;
      this.cdr.markForCheck();
    });

    // Subscribe to PIP state and restore preview when returning to list view
    this.pipState$.subscribe((pipState: any) => {
      if (pipState.isActive && pipState.article && !this.selectedArticleForPreview) {
        // Restore the preview article from PIP state when user returns to list view
        this.selectedArticleForPreview = pipState.article;
        this.cdr.markForCheck();
      }
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
    // Skip if transition is in progress (prevents audio issues from rapid switching)
    if (this.transitionInProgress) return;
    
    // ALWAYS mark change detection when user explicitly clicks
    this.feedService.markAsRead(item.id);
    
    // On large screens with preview pane enabled and showing, always show in preview
    if (this.isLargeScreen && this.showPreviewPane) {
      const clickedItemHasVideo = this.getYouTubeVideoId(item.link);
      
      // Show clicked item in preview
      this.selectedArticleForPreview = item;
      
      if (clickedItemHasVideo) {
        // If a container is in PIP, load new video into the inactive container
        if (this.isVideoInPipMode) {
          // Load into the inactive container
          if (this.activeContainer === 'A') {
            // A is active (in PIP or preview), load B
            this.containerBArticle = item;
            this.containerBUrl = this.getYouTubeEmbedUrl(item.link);
            this.containerBInPip = false;
            this.activeContainer = 'B'; // B becomes active for preview
          } else {
            // B is active (in PIP or preview), load A
            this.containerAArticle = item;
            this.containerAUrl = this.getYouTubeEmbedUrl(item.link);
            this.containerAInPip = false;
            this.activeContainer = 'A'; // A becomes active for preview
          }
        } else {
          // No PIP, just load into the active container
          if (this.activeContainer === 'A') {
            this.containerAArticle = item;
            this.containerAUrl = this.getYouTubeEmbedUrl(item.link);
            this.containerAInPip = false;
          } else {
            this.containerBArticle = item;
            this.containerBUrl = this.getYouTubeEmbedUrl(item.link);
            this.containerBInPip = false;
          }
        }
      } else {
        // Clicked item has no video - clear the active container only if not in PIP
        if (!this.isVideoInPipMode) {
          if (this.activeContainer === 'A') {
            this.containerAArticle = null;
            this.containerAUrl = null;
          } else {
            this.containerBArticle = null;
            this.containerBUrl = null;
          }
        }
      }
      
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
    this.selectedArticleForPreview = null;
  }

  closePipOverlay(): void {
    // Skip if transition is in progress
    if (this.transitionInProgress) return;
    
    this.transitionInProgress = true;
    
    // Mark that user has manually closed a video from PIP
    this.hasEverHadVideoPIP = true;
    
    // Simply hide the PIP - don't clear URLs to keep iframes stable
    if (this.containerAInPip) {
      this.containerAInPip = false;
      this.containerAArticle = null; // Clear article reference but keep URL
      // If B has content, make it active in preview
      if (this.containerBArticle && this.containerBUrl) {
        this.activeContainer = 'B';
      }
    } else if (this.containerBInPip) {
      this.containerBInPip = false;
      this.containerBArticle = null; // Clear article reference but keep URL
      // If A has content, make it active in preview
      if (this.containerAArticle && this.containerAUrl) {
        this.activeContainer = 'A';
      }
    }
    
    this.isVideoInPipMode = false;
    this.pipContainer = null; // Clear PIP container tracker
    
    // Close global PIP
    this.pipStateService.closePip();
    
    this.cdr.markForCheck();
    
    // Release transition lock after CSS transition completes
    setTimeout(() => {
      this.transitionInProgress = false;
    }, 350);
  }

  createPipManually(): void {
    // Check if PIP is enabled in user settings
    if (!this.isPIPEnabled) {
      return;
    }
    
    // Prevent rapid successive transitions that confuse YouTube iframe state
    if (this.transitionInProgress) return;
    
    this.transitionInProgress = true;
    
    // Send the active container to PIP - keep other container's iframe in DOM to avoid state issues
    if (this.activeContainer === 'A') {
      if (this.containerAArticle && this.containerAUrl) {
        this.containerAInPip = true;
        this.pipContainer = 'A'; // Track that A is in PIP
        // Hide container B but keep its URL (iframe stays in DOM)
        this.containerBArticle = null;
        this.containerBInPip = false;
        this.isVideoInPipMode = true;
        
        // Update global PIP state
        this.pipStateService.openPip(this.containerAArticle, this.containerAUrl, 'A');
      }
    } else {
      if (this.containerBArticle && this.containerBUrl) {
        this.containerBInPip = true;
        this.pipContainer = 'B'; // Track that B is in PIP
        // Hide container A but keep its URL (iframe stays in DOM)
        this.containerAArticle = null;
        this.containerAInPip = false;
        this.isVideoInPipMode = true;
        
        // Update global PIP state
        this.pipStateService.openPip(this.containerBArticle, this.containerBUrl, 'B');
      }
    }
    this.cdr.markForCheck();
    
    // Release the transition lock after CSS transition completes (300ms + buffer)
    setTimeout(() => {
      this.transitionInProgress = false;
    }, 350);
  }

  openPipInPreview(): void {
    // Move the PIP container back to preview
    if (this.containerAInPip) {
      this.containerAInPip = false;
      this.activeContainer = 'A';
    } else if (this.containerBInPip) {
      this.containerBInPip = false;
      this.activeContainer = 'B';
    }
    this.isVideoInPipMode = false;
    this.selectedArticleForPreview = this.activeContainer === 'A' ? this.containerAArticle : this.containerBArticle;
    this.cdr.markForCheck();
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

  /**
   * Get cached image URL for item (used in template with async pipe)
   * Returns cached blob URL if available, otherwise original URL
   */
  getCachedImageUrl(imageUrl: string | undefined): Observable<string> {
    if (!imageUrl) {
      return of('');
    }
    return this.imageCacheService.getCachedImageUrl(imageUrl);
  }
}

