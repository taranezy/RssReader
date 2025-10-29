import { Injectable } from '@angular/core';
import { IRssParser } from '../interfaces/rss-parser.interface';
import { RssItem } from '../models/rss-feed.model';

// Single Responsibility Principle - only handles RSS parsing
@Injectable({
  providedIn: 'root'
})
export class RssParserService implements IRssParser {

  parseRssFeed(xmlContent: string, feedId: string, feedTitle: string): RssItem[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    // Check for parser errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('XML parsing error:', parserError.textContent);
      return [];
    }

    // Try RSS 2.0 format first
    let items = xmlDoc.querySelectorAll('item');
    
    // If no items, try Atom format
    if (items.length === 0) {
      items = xmlDoc.querySelectorAll('entry');
      return this.parseAtomFeed(items, feedId, feedTitle);
    }
    
    return this.parseRss2Feed(items, feedId, feedTitle);
  }

  private parseRss2Feed(items: NodeListOf<Element>, feedId: string, feedTitle: string): RssItem[] {
    const rssItems: RssItem[] = [];

    items.forEach((item) => {
      const title = this.getTextContent(item, 'title');
      const link = this.getTextContent(item, 'link');
      const description = this.getTextContent(item, 'description');
      const pubDateStr = this.getTextContent(item, 'pubDate');
      const author = this.getTextContent(item, 'author') || this.getTextContent(item, 'dc\\:creator');
      const content = this.getTextContent(item, 'content\\:encoded') || description;
      
      // Get categories
      const categoryElements = item.querySelectorAll('category');
      const categories: string[] = [];
      categoryElements.forEach(cat => {
        const categoryText = cat.textContent?.trim();
        if (categoryText) {
          categories.push(categoryText);
        }
      });

      const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();
      
      const rssItem: RssItem = {
        id: this.generateId(feedId, link),
        feedId: feedId,
        feedTitle: feedTitle,
        title: title || 'No Title',
        link: link || '',
        description: description || '',
        pubDate: pubDate,
        isRead: false,
        author: author || undefined,
        categories: categories.length > 0 ? categories : undefined,
        content: content || undefined
      };

      rssItems.push(rssItem);
    });

    return rssItems;
  }

  private parseAtomFeed(entries: NodeListOf<Element>, feedId: string, feedTitle: string): RssItem[] {
    const rssItems: RssItem[] = [];

    entries.forEach((entry) => {
      const title = this.getTextContent(entry, 'title');
      const linkElement = entry.querySelector('link[rel="alternate"]') || entry.querySelector('link');
      const link = linkElement?.getAttribute('href') || '';
      const summary = this.getTextContent(entry, 'summary');
      const content = this.getTextContent(entry, 'content') || summary;
      const publishedStr = this.getTextContent(entry, 'published') || this.getTextContent(entry, 'updated');
      const authorName = this.getTextContent(entry, 'author > name');
      
      const pubDate = publishedStr ? new Date(publishedStr) : new Date();
      
      const rssItem: RssItem = {
        id: this.generateId(feedId, link),
        feedId: feedId,
        feedTitle: feedTitle,
        title: title || 'No Title',
        link: link,
        description: summary || '',
        pubDate: pubDate,
        isRead: false,
        author: authorName || undefined,
        content: content || undefined
      };

      rssItems.push(rssItem);
    });

    return rssItems;
  }

  private getTextContent(element: Element, selector: string): string {
    const node = element.querySelector(selector);
    return node?.textContent?.trim() || '';
  }

  private generateId(feedId: string, link: string): string {
    // Simple hash function for generating unique IDs
    const str = feedId + link;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
