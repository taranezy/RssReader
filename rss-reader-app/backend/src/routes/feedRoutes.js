/**
 * Feed Routes - Single Responsibility: Route all feed-related endpoints
 * Depends on FeedController and Middleware (Dependency Injection)
 * IMPORTANT: More specific routes must come before parameterized routes!
 */
module.exports = function createFeedRoutes(app, feedController, isAuthenticated) {
  
  /**
   * GET /api/feeds - Get all feeds for user
   */
  app.get('/api/feeds', isAuthenticated, (req, res) => {
    feedController.getAllFeeds(req, res);
  });

  /**
   * POST /api/feeds - Create new feed
   */
  app.post('/api/feeds', isAuthenticated, (req, res) => {
    feedController.addFeed(req, res);
  });

  /**
   * DELETE /api/feeds/delete-all - Delete all feeds for user
   * MUST come before /:id route to prevent :id from matching "delete-all"
   * WARNING: This action cannot be undone
   */
  app.delete('/api/feeds/delete-all', isAuthenticated, (req, res) => {
    console.log('[Routes] DELETE /api/feeds/delete-all matched - calling deleteAllFeeds');
    feedController.deleteAllFeeds(req, res);
  });

  /**
   * GET /api/feeds/:id - Get single feed
   */
  app.get('/api/feeds/:id', isAuthenticated, (req, res) => {
    console.log(`[Routes] GET /api/feeds/:id matched with id=${req.params.id}`);
    feedController.getFeed(req, res);
  });

  /**
   * PUT /api/feeds/:id - Update feed
   */
  app.put('/api/feeds/:id', isAuthenticated, (req, res) => {
    console.log(`[Routes] PUT /api/feeds/:id matched with id=${req.params.id}`);
    feedController.updateFeed(req, res);
  });

  /**
   * DELETE /api/feeds/:id - Delete feed
   */
  app.delete('/api/feeds/:id', isAuthenticated, (req, res) => {
    console.log(`[Routes] DELETE /api/feeds/:id matched with id=${req.params.id}`);
    feedController.deleteFeed(req, res);
  });
};
