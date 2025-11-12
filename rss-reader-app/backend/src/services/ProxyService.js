const axios = require('axios');

/**
 * ProxyService - Wrapper around RssProxyService
 * Provides proxy functionality for RSS feeds
 */
class ProxyService {
  constructor(rssProxyService) {
    this.rssProxyService = rssProxyService;
    this.timeout = 15000;
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
  }

  /**
   * Test if URL is a standard feed
   */
  async isStandardFeed(url) {
    return await this.rssProxyService.isStandardFeed(url);
  }

  /**
   * Fetch standard RSS/Atom feed
   */
  async fetchStandardFeed(url) {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: this.timeout,
        responseType: 'text'
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching feed from ${url}:`, error.message);
      throw new Error(`Failed to fetch feed: ${error.message}`);
    }
  }

  /**
   * Convert HTML page to RSS feed
   */
  async convertHtmlToRss(url, siteTitle = null) {
    return await this.rssProxyService.convertHtmlToRss(url, siteTitle);
  }

  /**
   * Fetch full article content
   */
  async fetchFullArticleContent(url) {
    return await this.rssProxyService.fetchFullArticleContent(url);
  }
}

module.exports = ProxyService;
