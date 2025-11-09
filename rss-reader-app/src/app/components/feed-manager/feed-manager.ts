import { Component, OnInit, Input, HostListener, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RssFeed, RssItem } from '../../models/rss-feed.model';
import { RssFeedService } from '../../services/rss-feed.service';
import { UserSettingsService, HEADER_COLOR_THEMES } from '../../services/user-settings.service';

@Component({
  selector: 'app-feed-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed-manager.html',
  styleUrl: './feed-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedManagerComponent implements OnInit {
  @Input() isSidebarCollapsed = false;
  @Output() sidebarToggled = new EventEmitter<boolean>();
  
  feeds: RssFeed[] = [];
  items: RssItem[] = [];
  newFeedUrl = '';
  newFeedTitle = '';
  newFeedCategory = '';
  isAddingFeed = false;
  isRefreshing = false;
  
  selectedView: 'today' | 'all' | 'unread' | 'saved' = 'all';
  expandedCategories: Set<string> = new Set();
  selectedFeedMenu: RssFeed | null = null;
  menuPosition = { x: 0, y: 0 };
  selectedFeedIds: string[] = [];
  
  // Modal properties
  showEditModal = false;
  showMoveModal = false;
  editingFeed: RssFeed | null = null;
  editFeedTitle = '';
  editFeedColor = '';
  editFeedCategory = '';
  
  // Drag and drop
  draggedFeed: RssFeed | null = null;
  dragOverCategory: string | null = null;
  dragOverUncategorized = false;

  // Header color for sidebar
  headerColor = 'purple';
  
  // Refresh progress
  refreshProgress = { total: 0, completed: 0, currentFeed: '' };

  // Cached counts to avoid recalculation on every change detection
  private cachedUnreadCount = 0;
  private cachedSavedCount = 0;
  private cachedFeedUnreadCounts = new Map<string, number>();

  constructor(
    private feedService: RssFeedService,
    private userSettingsService: UserSettingsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load user settings for header color
    this.userSettingsService.settings$.subscribe(settings => {
      this.headerColor = settings.headerColor;
      this.applySidebarColor(settings.headerColor);
      this.cdr.markForCheck();
    });

    this.feedService.feeds$.subscribe(feeds => {
      this.feeds = feeds;
      // Auto-expand all categories initially
      this.getCategories().forEach(cat => this.expandedCategories.add(cat));
      this.cdr.markForCheck();
    });

    this.feedService.items$.subscribe(items => {
      this.items = items;
      // Recalculate cached counts when items change
      this.updateCachedCounts();
      this.cdr.markForCheck();
    });

    this.feedService.preferences$.subscribe(prefs => {
      this.selectedFeedIds = prefs.selectedFeeds;
      this.cdr.markForCheck();
    });
    
    // Subscribe to refresh progress
    this.feedService.refreshProgress$.subscribe(progress => {
      this.refreshProgress = progress;
      this.cdr.markForCheck();
    });

    // Set initial filter based on selected view
    this.selectView('all');
  }

  applySidebarColor(colorId: string): void {
    const theme = HEADER_COLOR_THEMES[colorId] || HEADER_COLOR_THEMES['purple'];
    const sidebarHeader = document.querySelector('.sidebar-header') as HTMLElement;
    if (sidebarHeader) {
      sidebarHeader.style.background = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
    }
  }

  getSidebarGradient(): string {
    const theme = HEADER_COLOR_THEMES[this.headerColor] || HEADER_COLOR_THEMES['purple'];
    return `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
  }

  toggleAddFeed(): void {
    this.isAddingFeed = !this.isAddingFeed;
  }

  cancelAddFeed(): void {
    this.isAddingFeed = false;
    this.newFeedUrl = '';
    this.newFeedTitle = '';
    this.newFeedCategory = '';
  }

  addFeed(): void {
    if (!this.newFeedUrl.trim()) {
      return;
    }

    this.isAddingFeed = true;
    this.feedService.addFeed(
      this.newFeedUrl.trim(), 
      this.newFeedTitle.trim() || undefined,
      this.newFeedCategory.trim() || undefined
    )
      .subscribe({
        next: (success) => {
          if (success) {
            this.newFeedUrl = '';
            this.newFeedTitle = '';
            this.newFeedCategory = '';
            this.cancelAddFeed();
          } else {
            alert('Failed to add feed. Please check the URL and try again.');
          }
          this.isAddingFeed = false;
        },
        error: () => {
          alert('Error adding feed.');
          this.isAddingFeed = false;
        }
      });
  }

  removeFeed(feedId: string, feedTitle: string): void {
    if (confirm(`Are you sure you want to remove "${feedTitle}"?`)) {
      this.feedService.removeFeed(feedId);
    }
  }

  toggleFeedActive(feed: RssFeed): void {
    this.feedService.updateFeed(feed.id, { isActive: !feed.isActive });
  }

  refreshFeed(feedId: string): void {
    this.feedService.refreshFeed(feedId).subscribe({
      next: (count) => {
        // For single feed refresh, reload items immediately
        if (count > 0) {
          this.feedService.loadItems();
        }
      },
      error: (err) => {
        console.error('Error refreshing feed:', err);
      }
    });
    this.closeMenu();
  }

  refreshAllFeeds(): void {
    // Prevent multiple simultaneous refreshes
    if (this.isRefreshing) {
      console.log('Refresh already in progress, please wait...');
      return;
    }
    
    this.isRefreshing = true;
    
    // Start refresh in background - don't wait for completion
    this.feedService.refreshAllFeeds().subscribe({
      next: (count) => {
        this.isRefreshing = false;
        console.log(`Refresh completed: ${count} new items`);
        // Optional: show non-blocking notification instead of alert
        if (count > 0) {
          console.log(`✓ ${count} new item(s) loaded`);
        }
      },
      error: (err) => {
        this.isRefreshing = false;
        console.error('Error refreshing feeds:', err);
      }
    });
    
    // Immediately close menu and allow user to continue reading
    this.closeMenu();
  }

  updateFeedColor(feedId: string, color: string): void {
    this.feedService.updateFeed(feedId, { color });
  }

  // View selection
  selectView(view: 'today' | 'all' | 'unread' | 'saved'): void {
    console.log('Selecting view:', view);
    this.selectedView = view;
    
    if (view === 'saved') {
      // Clear all filters first, then load saved items
      this.feedService.updatePreferences({ showOnlyUnread: false, selectedFeeds: [] });
      // Use setTimeout to ensure preferences are updated before loading saved items
      setTimeout(() => {
        this.feedService.loadSavedItems();
      }, 50);
    } else {
      // For all other views, reload normal items with appropriate filters
      if (view === 'unread') {
        this.feedService.updatePreferences({ showOnlyUnread: true, selectedFeeds: [] });
      } else {
        this.feedService.updatePreferences({ showOnlyUnread: false, selectedFeeds: [] });
      }
      // Reload all items to restore normal view
      this.feedService.loadItems();
    }
  }

  // Feed selection
  selectFeed(feedId: string): void {
    // If we were in saved view, switch back to normal view first
    if (this.selectedView === 'saved') {
      this.selectedView = 'all';
    }
    
    this.feedService.updatePreferences({ selectedFeeds: [feedId], showOnlyUnread: false });
    // Reload items to apply the feed filter
    this.feedService.loadItems();
  }

  isSelectedFeed(feedId: string): boolean {
    return this.selectedFeedIds.includes(feedId);
  }

  // Category methods
  getCategories(): string[] {
    const categories = new Set<string>();
    this.feeds.forEach(feed => {
      if (feed.category) {
        categories.add(feed.category);
      }
    });
    return Array.from(categories).sort();
  }

  getCategoryFeeds(category: string): RssFeed[] {
    return this.feeds.filter(f => f.category === category && f.isActive);
  }

  getUncategorizedFeeds(): RssFeed[] {
    return this.feeds.filter(f => !f.category && f.isActive);
  }

  toggleCategory(category: string): void {
    if (this.expandedCategories.has(category)) {
      this.expandedCategories.delete(category);
    } else {
      this.expandedCategories.add(category);
    }
    
    // Automatically select all feeds in this folder
    this.selectFolderFeeds(category);
  }
  
  toggleCategoryExpand(category: string): void {
    if (this.expandedCategories.has(category)) {
      this.expandedCategories.delete(category);
    } else {
      this.expandedCategories.add(category);
    }
  }
  
  selectFolderFeeds(category: string): void {
    const categoryFeeds = this.getCategoryFeeds(category);
    const feedIds = categoryFeeds.map(feed => feed.id);
    
    if (feedIds.length > 0) {
      this.feedService.updatePreferences({ selectedFeeds: feedIds });
    }
  }
  
  selectUncategorizedFeeds(): void {
    const uncategorizedFeeds = this.getUncategorizedFeeds();
    const feedIds = uncategorizedFeeds.map(feed => feed.id);
    
    if (feedIds.length > 0) {
      this.feedService.updatePreferences({ selectedFeeds: feedIds });
    }
  }

  isCategoryExpanded(category: string): boolean {
    return this.expandedCategories.has(category);
  }

  // Count methods - now using cached values
  getUnreadCount(): number {
    return this.cachedUnreadCount;
  }

  getSavedCount(): number {
    return this.cachedSavedCount;
  }

  getFeedUnreadCount(feedId: string): number {
    return this.cachedFeedUnreadCounts.get(feedId) || 0;
  }

  // Update cached counts - called only when items array changes
  private updateCachedCounts(): void {
    this.cachedUnreadCount = this.items.filter(item => !item.isRead).length;
    this.cachedSavedCount = this.items.filter(item => item.isSaved).length;
    
    // Calculate unread counts per feed
    this.cachedFeedUnreadCounts.clear();
    this.items.forEach(item => {
      if (!item.isRead) {
        const currentCount = this.cachedFeedUnreadCounts.get(item.feedId) || 0;
        this.cachedFeedUnreadCounts.set(item.feedId, currentCount + 1);
      }
    });
  }

  // Format feed date for display
  formatFeedDate(date: Date | string): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // Less than 1 minute
    if (diffMins < 1) {
      return 'just now';
    }
    
    // Less than 1 hour
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    
    // Less than 24 hours
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    
    // Less than 7 days
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    
    // Format as date - show month and day
    return dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Feed menu methods
  openFeedMenu(feed: RssFeed, event: Event): void {
    event.stopPropagation();
    this.selectedFeedMenu = feed;
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Calculate menu dimensions (estimate based on number of buttons)
    const menuHeight = 5 * 40; // 5 buttons * ~40px each
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    
    // If not enough space below, position menu above the button
    let posY: number;
    if (spaceBelow < menuHeight) {
      // Position above the button
      posY = rect.top - menuHeight;
    } else {
      // Position below the button (default)
      posY = rect.bottom;
    }
    
    // Ensure menu doesn't go above viewport
    posY = Math.max(10, posY);
    
    this.menuPosition = { x: rect.left, y: posY };
    
    // Add overlay effect to prevent scrolling behind sidebar
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.add('menu-open');
    }
  }

  editFeed(feed: RssFeed): void {
    this.editingFeed = feed;
    this.editFeedTitle = feed.title;
    this.editFeedColor = feed.color;
    this.editFeedCategory = feed.category || '';
    this.showEditModal = true;
    this.closeMenu();
  }

  saveEditFeed(): void {
    if (this.editingFeed && this.editFeedTitle.trim()) {
      this.feedService.updateFeed(this.editingFeed.id, {
        title: this.editFeedTitle.trim(),
        color: this.editFeedColor,
        category: this.editFeedCategory.trim() || undefined
      });
      this.closeEditModal();
    }
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingFeed = null;
    this.editFeedTitle = '';
    this.editFeedColor = '';
    this.editFeedCategory = '';
    this.closeMenu();
  }

  closeMenu(): void {
    this.selectedFeedMenu = null;
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.remove('menu-open');
    }
  }

  changeFeedColor(feed: RssFeed): void {
    // This will be done through edit modal
    this.editFeed(feed);
  }

  moveFeedToCategory(feed: RssFeed): void {
    this.editingFeed = feed;
    this.editFeedCategory = feed.category || '';
    this.showMoveModal = true;
    this.closeMenu();
  }

  saveMoveFeed(): void {
    if (this.editingFeed) {
      this.feedService.updateFeed(this.editingFeed.id, {
        category: this.editFeedCategory.trim() || undefined
      });
      this.closeMoveModal();
    }
  }

  closeMoveModal(): void {
    this.showMoveModal = false;
    this.editingFeed = null;
    this.editFeedCategory = '';
    this.closeMenu();
  }
  
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.sidebarToggled.emit(this.isSidebarCollapsed);
  }

  deleteFeed(feed: RssFeed): void {
    if (confirm(`Are you sure you want to delete "${feed.title}"?`)) {
      this.feedService.removeFeed(feed.id);
    }
    this.closeMenu();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.selectedFeedMenu) {
      const target = event.target as HTMLElement;
      if (!target.closest('.feed-menu') && !target.closest('.feed-menu-btn')) {
        this.closeMenu();
      }
    }
  }
  
  // Drag and Drop methods
  onDragStart(event: DragEvent, feed: RssFeed): void {
    this.draggedFeed = feed;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', feed.id);
    }
    // Add visual feedback
    setTimeout(() => {
      (event.target as HTMLElement).style.opacity = '0.5';
    }, 0);
  }
  
  onDragEnd(event: DragEvent): void {
    (event.target as HTMLElement).style.opacity = '1';
    this.draggedFeed = null;
    this.dragOverCategory = null;
    this.dragOverUncategorized = false;
  }
  
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }
  
  onDragEnterCategory(event: DragEvent, category: string): void {
    event.preventDefault();
    this.dragOverCategory = category;
  }
  
  onDragLeaveCategory(event: DragEvent): void {
    this.dragOverCategory = null;
  }
  
  onDropOnCategory(event: DragEvent, category: string): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.draggedFeed && this.draggedFeed.category !== category) {
      this.feedService.updateFeed(this.draggedFeed.id, { category });
    }
    
    this.dragOverCategory = null;
    this.draggedFeed = null;
  }
  
  onDragEnterUncategorized(event: DragEvent): void {
    event.preventDefault();
    this.dragOverUncategorized = true;
  }
  
  onDragLeaveUncategorized(event: DragEvent): void {
    this.dragOverUncategorized = false;
  }
  
  onDropOnUncategorized(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.draggedFeed && this.draggedFeed.category) {
      this.feedService.updateFeed(this.draggedFeed.id, { category: undefined });
    }
    
    this.dragOverUncategorized = false;
    this.draggedFeed = null;
  }

  // TrackBy functions to prevent unnecessary DOM recreation
  trackByFeedId(index: number, feed: RssFeed): string {
    return feed.id;
  }

  trackByCategory(index: number, category: string): string {
    return category;
  }
}
