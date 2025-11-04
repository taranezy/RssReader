import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RssFeed, FeedViewPreference } from '../../models/rss-feed.model';
import { RssFeedService } from '../../services/rss-feed.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent implements OnInit {
  feeds: RssFeed[] = [];
  preferences: FeedViewPreference = {
    viewType: 'list',
    selectedFeeds: [],
    showOnlyUnread: false
  };
  
  currentView: 'list' | 'grid' = 'list';
  currentUser: User | null = null;
  showUserMenu = false;
  showFeedDropdown = false;

  constructor(
    private feedService: RssFeedService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.feedService.feeds$.subscribe(feeds => {
      this.feeds = feeds.filter(f => f.isActive);
    });

    this.feedService.preferences$.subscribe(prefs => {
      this.preferences = prefs;
      this.currentView = prefs.viewType;
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  switchView(viewType: 'list' | 'grid'): void {
    this.currentView = viewType;
    this.feedService.updatePreferences({ viewType });
    this.router.navigate([viewType === 'list' ? '/list' : '/grid']);
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
