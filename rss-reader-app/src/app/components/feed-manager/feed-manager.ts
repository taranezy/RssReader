import { Component, OnInit, HostListener, Output, EventEmitter } from '@angular/core';
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
  styleUrl: './feed-manager.scss'
})
export class FeedManagerComponent implements OnInit {
  @Output() sidebarToggled = new EventEmitter<boolean>();
  
  feeds: RssFeed[] = [];
  items: RssItem[] = [];
  newFeedUrl = '';
  newFeedTitle = '';
  newFeedCategory = '';
  isAddingFeed = false;
  isRefreshing = false;
  
  selectedView: 'today' | 'all' | 'unread' = 'all';
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
  
  // Sidebar toggle
  isSidebarCollapsed = false;
  
  // Drag and drop
  draggedFeed: RssFeed | null = null;
  dragOverCategory: string | null = null;
  dragOverUncategorized = false;

  // Header color for sidebar
  headerColor = 'purple';

  constructor(
    private feedService: RssFeedService,
    private userSettingsService: UserSettingsService
  ) {}

  ngOnInit(): void {
    // Load user settings for header color
    this.userSettingsService.settings$.subscribe(settings => {
      this.headerColor = settings.headerColor;
      this.applySidebarColor(settings.headerColor);
    });

    this.feedService.feeds$.subscribe(feeds => {
      this.feeds = feeds;
      // Auto-expand all categories initially
      this.getCategories().forEach(cat => this.expandedCategories.add(cat));
    });

    this.feedService.items$.subscribe(items => {
      this.items = items;
    });

    this.feedService.preferences$.subscribe(prefs => {
      this.selectedFeedIds = prefs.selectedFeeds;
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
    this.feedService.refreshFeed(feedId).subscribe();
  }

  refreshAllFeeds(): void {
    this.isRefreshing = true;
    this.feedService.refreshAllFeeds().subscribe({
      next: (count) => {
        this.isRefreshing = false;
        if (count > 0) {
          alert(`${count} new item(s) fetched from all feeds!`);
        } else {
          alert('No new items found.');
        }
      },
      error: () => {
        this.isRefreshing = false;
        alert('Error refreshing feeds.');
      }
    });
  }

  updateFeedColor(feedId: string, color: string): void {
    this.feedService.updateFeed(feedId, { color });
  }

  // View selection
  selectView(view: 'today' | 'all' | 'unread'): void {
    this.selectedView = view;
    
    if (view === 'unread') {
      this.feedService.updatePreferences({ showOnlyUnread: true, selectedFeeds: [] });
    } else {
      this.feedService.updatePreferences({ showOnlyUnread: false, selectedFeeds: [] });
    }
  }

  // Feed selection
  selectFeed(feedId: string): void {
    this.feedService.updatePreferences({ selectedFeeds: [feedId] });
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
  }

  isCategoryExpanded(category: string): boolean {
    return this.expandedCategories.has(category);
  }

  // Count methods
  getUnreadCount(): number {
    return this.items.filter(item => !item.isRead).length;
  }

  getFeedUnreadCount(feedId: string): number {
    return this.items.filter(item => item.feedId === feedId && !item.isRead).length;
  }

  // Feed menu methods
  openFeedMenu(feed: RssFeed, event: Event): void {
    event.stopPropagation();
    this.selectedFeedMenu = feed;
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.menuPosition = { x: rect.left, y: rect.bottom };
  }

  editFeed(feed: RssFeed): void {
    this.editingFeed = feed;
    this.editFeedTitle = feed.title;
    this.editFeedColor = feed.color;
    this.editFeedCategory = feed.category || '';
    this.showEditModal = true;
    this.selectedFeedMenu = null;
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
  }

  changeFeedColor(feed: RssFeed): void {
    // This will be done through edit modal
    this.editFeed(feed);
  }

  moveFeedToCategory(feed: RssFeed): void {
    this.editingFeed = feed;
    this.editFeedCategory = feed.category || '';
    this.showMoveModal = true;
    this.selectedFeedMenu = null;
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
  }
  
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.sidebarToggled.emit(this.isSidebarCollapsed);
  }

  deleteFeed(feed: RssFeed): void {
    if (confirm(`Are you sure you want to delete "${feed.title}"?`)) {
      this.feedService.removeFeed(feed.id);
    }
    this.selectedFeedMenu = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.selectedFeedMenu) {
      const target = event.target as HTMLElement;
      if (!target.closest('.feed-menu') && !target.closest('.feed-menu-btn')) {
        this.selectedFeedMenu = null;
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
}
