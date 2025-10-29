export interface RssFeed {
  id: string;
  url: string;
  title: string;
  description?: string;
  color: string;
  isActive: boolean;
  lastFetched?: Date;
  addedDate: Date;
}

export interface RssItem {
  id: string;
  feedId: string;
  feedTitle: string;
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  isRead: boolean;
  author?: string;
  categories?: string[];
  content?: string;
}

export interface FeedViewPreference {
  viewType: 'list' | 'grid';
  selectedFeeds: string[]; // empty array means 'all'
  showOnlyUnread: boolean;
}
