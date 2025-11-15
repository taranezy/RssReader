import { Component, OnInit, OnDestroy, HostListener, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RssFeed, FeedViewPreference } from '../../models/rss-feed.model';
import { RssFeedService } from '../../services/rss-feed.service';
import { AuthService, User } from '../../services/auth.service';
import { UserSettingsService, HEADER_COLOR_THEMES } from '../../services/user-settings.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() sidebarToggleRequested = new EventEmitter<void>();
  @Output() leftMenuToggled = new EventEmitter<boolean>();
  
  feeds: RssFeed[] = [];
  preferences: FeedViewPreference = {
    viewType: 'list',
    selectedFeeds: [],
    showOnlyUnread: false,
    openInNewTab: true
  };
  
  currentView: 'list' | 'grid' | 'news' | 'suggested' = 'list';
  currentUser: User | null = null;
  showUserMenu = false;
  showFeedDropdown = false;
  showSettings = false;
  selectedCategory: 'appearance' | 'settings' | 'data' = 'appearance';
  isMobile = false;
  isDemoUser = false;
  isImporting = false;
  importProgress = 0;
  importTotal = 0;
  private destroy$ = new Subject<void>();

  userSettings = {
    font: 'default',
    showLeftMenu: true,
    showFeedImages: true,
    headerColor: 'purple',
    darkMode: false,
    enablePIP: true
  };

  availableFonts = [
    { id: 'default', name: 'Default', family: 'system-ui' },
    { id: 'serif', name: 'Serif', family: 'Georgia, serif' },
    { id: 'monospace', name: 'Monospace', family: 'Courier New, monospace' },
    { id: 'comic', name: 'Comic Sans', family: 'Comic Sans MS, cursive' },
    { id: 'verdana', name: 'Verdana', family: 'Verdana, sans-serif' }
  ];

  headerColorThemes = Object.entries(HEADER_COLOR_THEMES).map(([id, theme]) => ({
    id,
    ...theme
  }));

  constructor(
    private feedService: RssFeedService,
    private authService: AuthService,
    private userSettingsService: UserSettingsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserSettings();
    
    // Detect mobile screen size
    this.checkScreenSize();
    
    this.feedService.feeds$
      .pipe(takeUntil(this.destroy$))
      .subscribe(feeds => {
        this.feeds = feeds.filter(f => f.isActive);
      });

    this.feedService.preferences$
      .pipe(takeUntil(this.destroy$))
      .subscribe(prefs => {
        this.preferences = prefs;
        // Don't change currentView if on news or suggested pages
        if (this.router.url !== '/suggested' && this.router.url !== '/news') {
          this.currentView = prefs.viewType;
        }
      });

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        // Check if user is demo user
        this.isDemoUser = user?.email === 'demo@rssreader.local';
      });
    
    // Detect current route
    if (this.router.url.includes('/suggested')) {
      this.currentView = 'suggested';
    } else if (this.router.url.includes('/news')) {
      this.currentView = 'news';
    } else if (this.router.url.includes('/grid')) {
      this.currentView = 'grid';
    } else {
      this.currentView = 'list';
    }

    // Apply header color on init
    this.applyHeaderColor(this.userSettings.headerColor);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  switchView(viewType: 'list' | 'grid' | 'news' | 'suggested'): void {
    this.currentView = viewType;
    if (viewType !== 'suggested') {
      this.feedService.updatePreferences({ viewType: viewType === 'news' ? 'grid' : viewType });
    }
    const route = viewType === 'list' ? '/list' : 
                  viewType === 'grid' ? '/grid' : 
                  viewType === 'news' ? '/news' : 
                  '/suggested';
    this.router.navigate([route]);
  }

  toggleUnreadFilter(): void {
    this.feedService.updatePreferences({ 
      showOnlyUnread: !this.preferences.showOnlyUnread 
    });
  }

  toggleFeedFilter(feedId: string): void {
    const selectedFeeds = [...this.preferences.selectedFeeds];
    const index = selectedFeeds.indexOf(feedId);
    
    if (index > -1) {
      selectedFeeds.splice(index, 1);
    } else {
      selectedFeeds.push(feedId);
    }
    
    this.feedService.updatePreferences({ selectedFeeds });
  }

  clearFeedFilter(): void {
    this.feedService.updatePreferences({ selectedFeeds: [] });
  }

  isFeedSelected(feedId: string): boolean {
    return this.preferences.selectedFeeds.includes(feedId);
  }

  toggleFeedDropdown(): void {
    this.showFeedDropdown = !this.showFeedDropdown;
  }

  closeFeedDropdown(): void {
    this.showFeedDropdown = false;
  }

  markAllAsRead(): void {
    if (confirm('Mark all visible items as read?')) {
      const feedId = this.preferences.selectedFeeds.length === 1 
        ? this.preferences.selectedFeeds[0] 
        : undefined;
      this.feedService.markAllAsRead(feedId);
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.showFeedDropdown = false;
    }
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout().subscribe(() => {
        // Remove dark mode class and clear localStorage just before navigation
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
        try {
          localStorage.removeItem('darkMode');
        } catch (e) {
          // localStorage might not be available
        }
        this.router.navigate(['/login']);
      });
    }
  }

  toggleSidebar(): void {
    this.sidebarToggleRequested.emit();
  }

  openSettings(): void {
    this.showSettings = true;
    this.showUserMenu = false;
  }

  closeSettings(): void {
    this.showSettings = false;
  }

  /**
   * Delete all feeds with confirmation
   */
  deleteAllFeeds(): void {
    if (this.isDemoUser) {
      alert('⚠️ Demo mode is read-only. Cannot delete feeds.');
      return;
    }

    // Show confirmation dialog
    const confirmed = confirm(
      '🚨 WARNING: This will PERMANENTLY DELETE all your feeds and items!\n\n' +
      'This action CANNOT be undone.\n\n' +
      'Are you absolutely sure you want to delete everything and start from scratch?'
    );

    if (!confirmed) {
      return;
    }

    // Second confirmation for safety
    const reconfirmed = confirm(
      'This is your final warning. All your feeds will be permanently deleted.\n\n' +
      'Click OK to delete everything, or Cancel to keep your feeds.'
    );

    if (!reconfirmed) {
      return;
    }

    // Perform the deletion
    this.feedService.removeAllFeeds().subscribe({
      next: (response: any) => {
        console.log('[Header] Successfully deleted all feeds:', response);
        alert(`✅ All ${response.deletedCount} feeds have been deleted successfully!\n\nYou can now import new feeds or add them manually.`);
        
        // Clear ALL caches before reload
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.clear();
            console.log('[Header] localStorage cleared');
          }
        } catch (e) {
          console.warn('[Header] Could not clear localStorage:', e);
        }
        
        // Reload with cache-busting parameter and small delay to ensure cache is cleared
        setTimeout(() => {
          const timestamp = Date.now();
          window.location.href = window.location.origin + '/?nocache=' + timestamp;
        }, 500);
      },
      error: (error) => {
        console.error('[Header] Error deleting all feeds:', error);
        alert('❌ Failed to delete feeds: ' + (error.error?.error || error.message));
      }
    });
  }

  changeFont(fontId: string): void {
    this.userSettings.font = fontId;
    
    // Apply font immediately to entire application
    this.userSettingsService.applyFontImmediately(fontId);
    
    // Save to database via API (fire and forget, but with error handling)
    this.userSettingsService.updateFont(fontId).subscribe(
      () => {
      },
      error => {
        console.error('Error updating font setting:', error);
        // Fall back to localStorage if API fails
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('userSettings', JSON.stringify(this.userSettings));
        }
      }
    );
  }

  toggleLeftMenu(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.userSettings.showLeftMenu = checkbox.checked;
    
    // Save to database via API
    this.userSettingsService.updateShowLeftMenu(checkbox.checked).subscribe(
      () => {
        this.leftMenuToggled.emit(checkbox.checked);
      },
      error => {
        console.error('Error updating left menu setting:', error);
        // Fall back to localStorage if API fails
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('userSettings', JSON.stringify(this.userSettings));
        }
        this.leftMenuToggled.emit(checkbox.checked);
      }
    );
  }

  toggleFeedImages(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.userSettings.showFeedImages = checkbox.checked;
    
    // Save to database via API
    this.userSettingsService.updateShowFeedImages(checkbox.checked).subscribe(
      () => {
      },
      error => {
        console.error('Error updating feed images setting:', error);
        // Fall back to localStorage if API fails
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('userSettings', JSON.stringify(this.userSettings));
        }
      }
    );
  }

  toggleDarkMode(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.userSettings.darkMode = checkbox.checked;
    
    // Save to database via API
    this.userSettingsService.updateDarkMode(checkbox.checked).subscribe(
      () => {
      },
      error => {
        console.error('Error updating dark mode setting:', error);
      }
    );
  }

  toggleOpenInNewTab(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.feedService.updatePreferences({ 
      openInNewTab: checkbox.checked 
    });
  }

  togglePIP(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.userSettings.enablePIP = checkbox.checked;
    
    // Save to database via API using the service method
    const current = this.userSettingsService.getCurrentSettings();
    this.userSettingsService.updateSettings({ ...current, enablePIP: checkbox.checked }).subscribe(
      () => {
      },
      error => {
        console.error('Error updating PIP setting:', error);
        // Fall back to localStorage if API fails
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('userSettings', JSON.stringify(this.userSettings));
        }
      }
    );
  }

  changeHeaderColor(colorId: string): void {
    this.userSettings.headerColor = colorId;
    
    // Apply color immediately
    this.applyHeaderColor(colorId);
    
    // Save to database via API
    this.userSettingsService.updateHeaderColor(colorId).subscribe(
      () => {
      },
      error => {
        console.error('Error updating header color setting:', error);
        // Fall back to localStorage if API fails
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('userSettings', JSON.stringify(this.userSettings));
        }
      }
    );
  }

  applyHeaderColor(colorId: string): void {
    const theme = HEADER_COLOR_THEMES[colorId] || HEADER_COLOR_THEMES['purple'];
    const header = document.querySelector('.app-header') as HTMLElement;
    if (header) {
      header.style.background = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
    }
  }

  getHeaderGradient(): string {
    const theme = HEADER_COLOR_THEMES[this.userSettings.headerColor] || HEADER_COLOR_THEMES['purple'];
    return `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
  }

  loadUserSettings(): void {
    this.userSettingsService.getSettings().subscribe({
      next: (settings) => {
        this.userSettings = settings;
        this.userSettingsService.applyFontImmediately(settings.font);
        this.applyHeaderColor(settings.headerColor);
        this.userSettingsService.applyDarkMode(settings.darkMode);
      },
      error: (error) => {
        console.error('[Header] Error loading user settings:', error);
        // Fall back to localStorage or defaults
        if (typeof localStorage !== 'undefined') {
          const saved = localStorage.getItem('userSettings');
          if (saved) {
            try {
              this.userSettings = JSON.parse(saved);
              this.userSettingsService.applyFontImmediately(this.userSettings.font);
              this.applyHeaderColor(this.userSettings.headerColor);
              this.userSettingsService.applyDarkMode(this.userSettings.darkMode);
            } catch (e) {
              console.error('[Header] Failed to parse localStorage settings:', e);
            }
          }
        }
      }
    });
  }

  exportData(): void {
    this.userSettingsService.exportData().subscribe(
      blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rss-reader-backup-${Date.now()}.xml`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        alert('Data exported successfully!');
      },
      error => {
        console.error('Error exporting data:', error);
        alert('Failed to export data. Please try again.');
      }
    );
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      if (!file.name.endsWith('.xml')) {
        alert('Please select an XML file.');
        return;
      }

      const confirmed = confirm(
        '⚠️ WARNING: This will DELETE all your current feeds and data, and replace them with the imported data.\n\n' +
        'Are you sure you want to continue?'
      );

      if (!confirmed) {
        input.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const xmlData = e.target?.result as string;
        this.importData(xmlData);
        input.value = ''; // Reset file input
      };
      reader.readAsText(file);
    }
  }

  importData(xmlData: string): void {
    this.userSettingsService.importData(xmlData).subscribe(
      result => {
        alert(`Data imported successfully!\n\nFeeds: ${result.feedsImported}\nItems: ${result.itemsImported}\n\nReloading page...`);
        // Reload the page to refresh all data
        window.location.reload();
      },
      error => {
        console.error('Error importing data:', error);
        alert('Failed to import data: ' + (error.error?.error || error.message));
      }
    );
  }

  onFeedlyImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      if (!file.name.endsWith('.xml') && !file.name.endsWith('.opml')) {
        alert('Please select an OPML or XML file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const opmlData = e.target?.result as string;
        this.importFeedlyOpml(opmlData);
        input.value = ''; // Reset file input
      };
      reader.readAsText(file);
    }
  }

  importFeedlyOpml(opmlData: string): void {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(opmlData, 'text/xml');
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Invalid XML/OPML format');
      }

      // Extract feeds from OPML
      const outlines = xmlDoc.querySelectorAll('outline[type="rss"]');
      const feeds: any[] = [];
      const categories = new Map<string, string[]>();

      outlines.forEach(outline => {
        const feedUrl = outline.getAttribute('xmlUrl');
        const feedTitle = outline.getAttribute('title') || outline.getAttribute('text') || 'Untitled Feed';
        const htmlUrl = outline.getAttribute('htmlUrl');
        
        if (feedUrl) {
          // Get category from parent outline
          let category = 'Uncategorized';
          const parentOutline = outline.parentElement?.closest('outline');
          if (parentOutline) {
            category = parentOutline.getAttribute('title') || parentOutline.getAttribute('text') || 'Uncategorized';
          }

          // Generate random color for feed
          const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');

          feeds.push({
            url: feedUrl,
            title: feedTitle,
            description: htmlUrl || '',
            color: randomColor,
            category: category
          });

          // Track feeds per category
          if (!categories.has(category)) {
            categories.set(category, []);
          }
          categories.get(category)!.push(feedTitle);
        }
      });

      if (feeds.length === 0) {
        alert('No RSS feeds found in the OPML file.');
        return;
      }

      const confirmed = confirm(
        `Found ${feeds.length} feeds in ${categories.size} categories:\n\n` +
        Array.from(categories.entries())
          .map(([cat, feedList]) => `• ${cat} (${feedList.length} feeds)`)
          .join('\n') +
        '\n\nImport these feeds? They will be added to your existing feeds.'
      );

      if (!confirmed) {
        return;
      }

      // Import feeds one by one with progress
      let importedCount = 0;
      let errorCount = 0;
      const totalFeeds = feeds.length;
      this.isImporting = true;
      this.importProgress = 0;
      this.importTotal = totalFeeds;
      this.cdr.markForCheck();

      // Store feed IDs for later live updates
      const feedIdsToUpdate: string[] = [];

      const importNext = (index: number) => {
        if (index >= feeds.length) {
          // Finished importing all feeds - close progress indicator immediately
          console.log(`[Import] All feeds imported! Imported: ${importedCount}, Failed: ${errorCount}`);
          this.isImporting = false;
          this.cdr.markForCheck();
          
          // Reload feeds list to show all imported feeds
          this.feedService.initialize();
          
          // Start fetching items for all imported feeds live (one by one)
          console.log(`[Import] Starting live item fetch for ${feedIdsToUpdate.length} feeds...`);
          this.fetchImportedFeedsLive(feedIdsToUpdate);
          
          return;
        }

        const feed = feeds[index];
        this.feedService.addFeed(feed.url, feed.title, feed.category).subscribe(
          (addedFeed: any) => {
            importedCount++;
            this.importProgress = importedCount;
            console.log(`[Import] Added feed ${importedCount}/${totalFeeds}: ${feed.title}`);
            
            // Store the feed ID for live item fetching
            if (addedFeed && addedFeed.id) {
              feedIdsToUpdate.push(addedFeed.id);
            }
            
            this.cdr.markForCheck();
            importNext(index + 1);
          },
          error => {
            console.error(`Error importing feed ${feed.title}:`, error);
            errorCount++;
            this.importProgress = importedCount + errorCount;
            this.cdr.markForCheck();
            importNext(index + 1);
          }
        );
      };

      importNext(0);

    } catch (error) {
      console.error('Error parsing OPML:', error);
      alert('Failed to parse OPML file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Fetch items for imported feeds one by one (live updates)
   * Shows items appearing in real-time as each feed completes
   */
  private fetchImportedFeedsLive(feedIds: string[]): void {
    if (feedIds.length === 0) {
      console.log('[Import] No feeds to fetch items for');
      return;
    }

    console.log(`[Import] Fetching items for ${feedIds.length} imported feeds...`);
    let fetchedCount = 0;

    const fetchNext = (index: number) => {
      if (index >= feedIds.length) {
        console.log(`[Import] ✓ All items fetched! Total: ${fetchedCount} items`);
        return;
      }

      const feedId = feedIds[index];
      
      // Fetch this feed's items and wait for completion
      this.feedService.refreshFeed(feedId).subscribe({
        next: (itemCount) => {
          fetchedCount += itemCount;
          console.log(`[Import] Feed ${index + 1}/${feedIds.length}: fetched ${itemCount} items`);
          
          // After fetching, explicitly reload items to ensure they're displayed live
          this.feedService.loadItems().subscribe(() => {
            console.log(`[Import] Items reloaded after feed ${index + 1}`);
            // Move to next feed after items are loaded
            fetchNext(index + 1);
          });
        },
        error: (error) => {
          console.error(`[Import] Error fetching feed ${index + 1}:`, error);
          // Continue with next feed even if this one fails
          fetchNext(index + 1);
        }
      });
    };

    fetchNext(0);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // Close feed dropdown if clicking outside
    if (this.showFeedDropdown && !target.closest('.feed-filter')) {
      this.showFeedDropdown = false;
    }
    
    // Close user menu if clicking outside
    if (this.showUserMenu && !target.closest('.user-menu')) {
      this.showUserMenu = false;
    }
  }
}
