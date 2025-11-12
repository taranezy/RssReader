/**
 * Proxy Routes - Single Responsibility: Route all proxy-related endpoints
 * Depends on ProxyController (Dependency Injection)
 */
module.exports = function createProxyRoutes(app, proxyController) {
  
  /**
   * GET /api/proxy/test?url=... - Test if URL is a standard feed
   */
  app.get('/api/proxy/test', async (req, res) => {
    await proxyController.testFeedUrl(req, res);
  });

  /**
   * GET /api/proxy/fetch-feed?url=... - Fetch standard RSS/Atom feed
   */
  app.get('/api/proxy/fetch-feed', async (req, res) => {
    await proxyController.fetchStandardFeed(req, res);
  });

  /**
   * GET /api/proxy/feed?url=... - Convert HTML page to RSS feed
   */
  app.get('/api/proxy/feed', async (req, res) => {
    await proxyController.convertToRssFeed(req, res);
  });

  /**
   * GET /api/proxy/article?url=... - Fetch full article content
   */
  app.get('/api/proxy/article', async (req, res) => {
    await proxyController.fetchArticleContent(req, res);
  });
};
