/**
 * Feed Routes - Single Responsibility: Route all feed-related endpoints
 * Depends on FeedController and Middleware (Dependency Injection)
 */
module.exports = function createFeedRoutes(app, feedController, isAuthenticated) {
  
  /**
   * GET /api/feeds - Get all feeds for user
   */
  app.get('/api/feeds', isAuthenticated, (req, res) => {
    feedController.getAllFeeds(req, res);
  });

  /**
   * GET /api/feeds/:id - Get single feed
   */
  app.get('/api/feeds/:id', isAuthenticated, (req, res) => {
    feedController.getFeed(req, res);
  });

  /**
   * POST /api/feeds - Create new feed
   */
  app.post('/api/feeds', isAuthenticated, (req, res) => {
    feedController.addFeed(req, res);
  });

  /**
   * PUT /api/feeds/:id - Update feed
   */
  app.put('/api/feeds/:id', isAuthenticated, (req, res) => {
    feedController.updateFeed(req, res);
  });

  /**
   * DELETE /api/feeds/:id - Delete feed
   */
  app.delete('/api/feeds/:id', isAuthenticated, (req, res) => {
    feedController.deleteFeed(req, res);
  });
};
