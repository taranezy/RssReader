import { Component, OnInit, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RssFeed, FeedViewPreference } from '../../models/rss-feed.model';
import { RssFeedService } from '../../services/rss-feed.service';
import { AuthService, User } from '../../services/auth.service';
import { UserSettingsService } from '../../services/user-settings.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent implements OnInit {
  @Output() sidebarToggleRequested = new EventEmitter<void>();
  @Output() leftMenuToggled = new EventEmitter<boolean>();
  
  feeds: RssFeed[] = [];
  preferences: FeedViewPreference = {
    viewType: 'list',
    selectedFeeds: [],
    showOnlyUnread: false
  };
  
  currentView: 'list' | 'grid' | 'news' | 'suggested' = 'list';
  currentUser: User | null = null;
  showUserMenu = false;
  showFeedDropdown = false;
  showSettings = false;

  userSettings = {
    font: 'default',
    showLeftMenu: true,
    showFeedImages: true
  };

  availableFonts = [
    { id: 'default', name: 'Default', family: 'system-ui' },
    { id: 'serif', name: 'Serif', family: 'Georgia, serif' },
    { id: 'monospace', name: 'Monospace', family: 'Courier New, monospace' },
    { id: 'comic', name: 'Comic Sans', family: 'Comic Sans MS, cursive' },
    { id: 'verdana', name: 'Verdana', family: 'Verdana, sans-serif' }
  ];

  constructor(
    private feedService: RssFeedService,
    private authService: AuthService,
    private userSettingsService: UserSettingsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserSettings();
    
    this.feedService.feeds$.subscribe(feeds => {
      this.feeds = feeds.filter(f => f.isActive);
    });

    this.feedService.preferences$.subscribe(prefs => {
      this.preferences = prefs;
      if (this.router.url !== '/suggested') {
        this.currentView = prefs.viewType;
      }
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Detect current route
    if (this.router.url.includes('/suggested')) {
      this.currentView = 'suggested';
    } else if (this.router.url.includes('/grid')) {
      this.currentView = 'grid';
    } else {
      this.currentView = 'list';
    }
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

  changeFont(fontId: string): void {
    this.userSettings.font = fontId;
    
    // Apply font immediately to entire application
    this.userSettingsService.applyFontImmediately(fontId);
    
    // Save to database via API (fire and forget, but with error handling)
    this.userSettingsService.updateFont(fontId).subscribe(
      () => {
        console.log('Font setting updated successfully');
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
        console.log('Left menu setting updated successfully');
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
        console.log('Feed images setting updated successfully');
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

  loadUserSettings(): void {
    this.userSettingsService.getSettings().subscribe(
      settings => {
        this.userSettings = settings;
        this.userSettingsService.applyFontImmediately(settings.font);
      },
      error => {
        console.error('Error loading user settings:', error);
        // Fall back to localStorage if API fails
        if (typeof localStorage !== 'undefined') {
          const saved = localStorage.getItem('userSettings');
          if (saved) {
            this.userSettings = JSON.parse(saved);
            this.userSettingsService.applyFontImmediately(this.userSettings.font);
          }
        }
      }
    );
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
