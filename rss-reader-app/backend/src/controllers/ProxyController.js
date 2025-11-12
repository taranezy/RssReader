/**
 * ProxyController - Single Responsibility: Handle HTTP requests for RSS feed proxying
 * Depends on RssProxyService (Dependency Injection)
 */
class ProxyController {
  constructor(rssProxyService) {
    this.rssProxyService = rssProxyService;
  }

  /**
   * GET /api/proxy/test?url=... - Test if URL is a standard feed
   */
  async testFeedUrl(req, res) {
    try {
      const url = req.query.url;
      
      if (!url) {
        return res.status(400).json({
          success: false,
          error: 'URL parameter is required'
        });
      }

      const isStandardFeed = await this.rssProxyService.isStandardFeed(url);
      
      res.json({
        success: true,
        data: {
          url,
          isStandardFeed
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/proxy/fetch-feed?url=... - Fetch RSS/Atom feed with CORS proxy
   */
  async fetchStandardFeed(req, res) {
    try {
      const url = req.query.url;
      
      if (!url) {
        return res.status(400).json({
          success: false,
          error: 'URL parameter is required'
        });
      }

      // First check if it's a standard feed
      const isStandard = await this.rssProxyService.isStandardFeed(url);
      
      let feedContent;
      if (isStandard) {
        // It's a standard feed, fetch it directly using axios
        const axios = require('axios');
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 15000,
          responseType: 'text'
        });
        feedContent = response.data;
      } else {
        // Try to convert HTML to RSS
        feedContent = await this.rssProxyService.convertHtmlToRss(url);
      }
      
      // Return as XML/RSS content type
      res.set('Content-Type', 'application/rss+xml; charset=utf-8');
      res.send(feedContent);
    } catch (error) {
      console.error('Error fetching standard feed:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/proxy/feed?url=... - Convert HTML page to RSS feed
   */
  async convertToRssFeed(req, res) {
    try {
      const url = req.query.url;
      const siteTitle = req.query.title;
      
      if (!url) {
        return res.status(400).json({
          success: false,
          error: 'URL parameter is required'
        });
      }

      const feedContent = await this.rssProxyService.convertHtmlToRss(url, siteTitle);
      
      // Return as XML/RSS content type
      res.set('Content-Type', 'application/rss+xml; charset=utf-8');
      res.send(feedContent);
    } catch (error) {
      console.error('Error converting HTML to RSS:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/proxy/article?url=... - Fetch full article content
   */
  async fetchArticleContent(req, res) {
    try {
      const url = req.query.url;
      
      if (!url) {
        return res.status(400).json({
          success: false,
          error: 'URL parameter is required'
        });
      }

      const content = await this.rssProxyService.fetchFullArticleContent(url);
      
      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = ProxyController;
