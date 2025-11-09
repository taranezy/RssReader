import { Injectable } from '@angular/core';
import { IRssParser } from '../interfaces/rss-parser.interface';
import { RssItem } from '../models/rss-feed.model';

// Single Responsibility Principle - only handles RSS parsing
@Injectable({
  providedIn: 'root'
})
export class RssParserService implements IRssParser {

  parseRssFeed(xmlContent: string, feedId: string, feedTitle: string): RssItem[] {
    // Quick check if content is HTML instead of XML
    if (xmlContent.trim().startsWith('<html') || xmlContent.includes('<title>301 Moved') || xmlContent.includes('<title>404')) {
      console.error('Feed returned HTML instead of RSS/XML:', feedTitle);
      console.error('Content preview:', xmlContent.substring(0, 200));
      return [];
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    // Check for parser errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('XML parsing error for feed:', feedTitle, '(ID:', feedId, ')');
      console.error('Error details:', parserError.textContent);
      console.error('First 500 chars of content:', xmlContent.substring(0, 500));
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
      
      // Get content:encoded - use textContent to get CDATA content
      const contentNode = item.querySelector('content\\:encoded');
      const content = contentNode?.textContent?.trim() || description;
      
      // Debug logging
      if (contentNode) {
        console.log('=== DEBUG: Content:encoded found ===');
        console.log('Raw textContent:', contentNode.textContent?.substring(0, 500));
        console.log('Has img tag:', contentNode.textContent?.includes('<img'));
      }
      
      // Extract image URL from various sources
      const imageUrl = this.extractImageUrl(item, description, content);
      
      // Debug: Log the result
      console.log('Extracted image for item:', title?.substring(0, 50), '-> imageUrl:', imageUrl);
      
      if (content && content.includes('<img')) {
        console.log('=== DEBUG: Image extraction ===');
        console.log('Content has img tag, extracted imageUrl:', imageUrl);
      }
      
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
        content: content || undefined,
        imageUrl: imageUrl || undefined
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
      
      // Get content - use textContent to get full content including CDATA
      const contentNode = entry.querySelector('content');
      const content = contentNode?.textContent?.trim() || summary;
      
      const publishedStr = this.getTextContent(entry, 'published') || this.getTextContent(entry, 'updated');
      const authorName = this.getTextContent(entry, 'author > name');
      
      // Extract image URL from Atom feed
      const imageUrl = this.extractImageUrl(entry, summary, content);
      
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
        content: content || undefined,
        imageUrl: imageUrl || undefined
      };

      rssItems.push(rssItem);
    });

    return rssItems;
  }

  private extractImageUrl(element: Element, description: string, content?: string): string | null {
    // 0. Try YouTube video ID extraction (for YouTube feeds)
    const youtubeThumb = this.extractYouTubeThumbnail(element);
    if (youtubeThumb) {
      return youtubeThumb;
    }

    // 1. Try media:thumbnail (Media RSS)
    const mediaThumbnail = element.querySelector('media\\:thumbnail');
    if (mediaThumbnail) {
      const url = mediaThumbnail.getAttribute('url');
      if (url) {
        console.log('Found image in media:thumbnail:', url);
        return url;
      }
    }

    // 2. Try media:content (Media RSS) - get first media:content and check for url attribute
    const mediaContentElements = element.querySelectorAll('media\\:content');
    if (mediaContentElements.length > 0) {
      // Guardian feeds have multiple media:content with different sizes, take the first one
      for (let i = 0; i < mediaContentElements.length; i++) {
        const url = mediaContentElements[i].getAttribute('url');
        if (url) {
          console.log('Found image in media:content:', url);
          return url;
        }
      }
    }

    // 3. Try media:content with medium or type attribute (fallback)
    const mediaContentTyped = Array.from(element.querySelectorAll('media\\:content')).find(el => 
      el.getAttribute('medium') === 'image' || el.getAttribute('type')?.startsWith('image/')
    );
    if (mediaContentTyped) {
      const url = mediaContentTyped.getAttribute('url');
      if (url) {
        console.log('Found image in media:content[typed]:', url);
        return url;
      }
    }

    // 4. Try enclosure with image type
    const enclosure = element.querySelector('enclosure[type^="image"]');
    if (enclosure) {
      const url = enclosure.getAttribute('url');
      if (url) return url;
    }

    // 5. Try itunes:image
    const itunesImage = element.querySelector('itunes\\:image');
    if (itunesImage) {
      const href = itunesImage.getAttribute('href');
      if (href) return href;
    }

    // 6. Extract from content:encoded or description CDATA/HTML
    const htmlContent = content || description;
    if (htmlContent) {
      // Try multiple regex patterns to extract img src
      // Pattern 1: src="..." or src='...'
      let imgMatch = htmlContent.match(/<img[^>]*\ssrc=["']([^"']+)["']/i);
      if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
      }
      
      // Pattern 2: src=... (without quotes)
      imgMatch = htmlContent.match(/<img[^>]*\ssrc=([^\s>]+)/i);
      if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
      }
    }

    return null;
  }

  private extractYouTubeThumbnail(element: Element): string | null {
    let videoId: string | null = null;

    // 1. Try yt:videoId tag (YouTube official)
    const ytVideoIdElement = element.querySelector('yt\\:videoId');
    if (ytVideoIdElement?.textContent) {
      videoId = ytVideoIdElement.textContent.trim();
      console.log('Found YouTube video ID via yt:videoId:', videoId);
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }

    // 2. Try media:content with specific duration (YouTube structure)
    const mediaContent = element.querySelector('media\\:content[duration]');
    if (mediaContent?.getAttribute('url')) {
      const url = mediaContent.getAttribute('url');
      if (url) {
        videoId = this.extractVideoIdFromUrl(url);
        if (videoId) {
          console.log('Found YouTube video ID from media:content:', videoId);
          return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
      }
    }

    // 3. Try link elements for youtube.com URLs
    const linkElements = element.querySelectorAll('link');
    for (let i = 0; i < linkElements.length; i++) {
      const href = linkElements[i].getAttribute('href') || linkElements[i].textContent;
      if (href && (href.includes('youtube.com') || href.includes('youtu.be'))) {
        videoId = this.extractVideoIdFromUrl(href);
        if (videoId) {
          console.log('Found YouTube video ID from link:', videoId);
          return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
      }
    }

    // 4. Try description for YouTube URLs
    const description = element.querySelector('description')?.textContent || 
                       element.querySelector('summary')?.textContent;
    if (description && (description.includes('youtube.com') || description.includes('youtu.be'))) {
      // Try to extract YouTube URL from description HTML/text
      const urlMatch = description.match(/(https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s<>"]*)/i);
      if (urlMatch && urlMatch[0]) {
        videoId = this.extractVideoIdFromUrl(urlMatch[0]);
        if (videoId) {
          console.log('Found YouTube video ID from description:', videoId);
          return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
      }
    }

    return null;
  }

  private extractVideoIdFromUrl(url: string | null): string | null {
    if (!url) return null;

    // Handle youtube.com/watch?v=VIDEO_ID
    const matchWatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (matchWatch && matchWatch[1]) {
      return matchWatch[1];
    }

    // Handle youtu.be/VIDEO_ID
    const matchShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (matchShort && matchShort[1]) {
      return matchShort[1];
    }

    // Handle youtube.com/embed/VIDEO_ID
    const matchEmbed = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (matchEmbed && matchEmbed[1]) {
      return matchEmbed[1];
    }

    return null;
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
