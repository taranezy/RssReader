import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RssFeed, FeedViewPreference } from '../../models/rss-feed.model';
import { RssFeedService } from '../../services/rss-feed.service';

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

  constructor(
    private feedService: RssFeedService,
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

  markAllAsRead(): void {
    if (confirm('Mark all visible items as read?')) {
      const feedId = this.preferences.selectedFeeds.length === 1 
        ? this.preferences.selectedFeeds[0] 
        : undefined;
      this.feedService.markAllAsRead(feedId);
    }
  }
}
