import { Observable } from 'rxjs';
import { RssItem } from '../models/rss-feed.model';

// Dependency Inversion Principle - depend on abstractions
export interface IRssParser {
  parseRssFeed(xmlContent: string, feedId: string, feedTitle: string): RssItem[];
}

export interface IRssFeedFetcher {
  fetchFeed(url: string): Observable<string>;
}
