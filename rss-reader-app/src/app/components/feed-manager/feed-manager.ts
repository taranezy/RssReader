import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RssFeed } from '../../models/rss-feed.model';
import { RssFeedService } from '../../services/rss-feed.service';

@Component({
  selector: 'app-feed-manager',
  imports: [CommonModule, FormsModule],
  templateUrl: './feed-manager.html',
  styleUrl: './feed-manager.scss'
})
export class FeedManagerComponent implements OnInit {
  feeds: RssFeed[] = [];
  newFeedUrl = '';
  newFeedTitle = '';
  isAddingFeed = false;
  isRefreshing = false;
  showManager = false;

  constructor(private feedService: RssFeedService) {}

  ngOnInit(): void {
    this.feedService.feeds$.subscribe(feeds => {
      this.feeds = feeds;
    });
  }

  toggleManager(): void {
    this.showManager = !this.showManager;
  }

  addFeed(): void {
    if (!this.newFeedUrl.trim()) {
      return;
    }

    this.isAddingFeed = true;
    this.feedService.addFeed(this.newFeedUrl.trim(), this.newFeedTitle.trim() || undefined)
      .subscribe({
        next: (success) => {
          if (success) {
            this.newFeedUrl = '';
            this.newFeedTitle = '';
            alert('Feed added successfully!');
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
    this.feedService.refreshFeed(feedId).subscribe(count => {
      if (count > 0) {
        alert(`${count} new item(s) fetched!`);
      } else {
        alert('No new items found.');
      }
    });
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
}
