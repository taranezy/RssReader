/**
 * Item Routes - Single Responsibility: Route all item/article-related endpoints
 * Depends on ItemController and Middleware (Dependency Injection)
 */
module.exports = function createItemRoutes(app, itemController, isAuthenticated) {
  
  /**
   * GET /api/items - Get user items
   */
  app.get('/api/items', isAuthenticated, (req, res) => {
    itemController.getUserItems(req, res);
  });

  /**
   * POST /api/items/bulk - Bulk create items
   */
  app.post('/api/items/bulk', isAuthenticated, (req, res) => {
    itemController.createItems(req, res);
  });

  /**
   * GET /api/feeds/:feedId/items - Get items for specific feed
   */
  app.get('/api/feeds/:feedId/items', isAuthenticated, (req, res) => {
    itemController.getFeedItems(req, res);
  });

  /**
   * PUT /api/items/:id - Mark item as read/unread
   */
  app.put('/api/items/:id', isAuthenticated, (req, res) => {
    itemController.markItemAsRead(req, res);
  });

  /**
   * POST /api/items/mark-all-read - Mark feed items as read
   */
  app.post('/api/items/mark-all-read', isAuthenticated, (req, res) => {
    itemController.markFeedAsRead(req, res);
  });

  /**
   * POST /api/items/:id/toggle-save - Toggle item saved
   */
  app.post('/api/items/:id/toggle-save', isAuthenticated, (req, res) => {
    itemController.toggleItemSaved(req, res);
  });

  /**
   * GET /api/items/saved - Get saved items
   */
  app.get('/api/items/saved', isAuthenticated, (req, res) => {
    itemController.getSavedItems(req, res);
  });

  /**
   * GET /api/items/unread-count - Get unread count
   */
  app.get('/api/items/unread-count', isAuthenticated, (req, res) => {
    itemController.getUnreadCount(req, res);
  });

  /**
   * GET /api/items/search - Search items
   */
  app.get('/api/items/search', isAuthenticated, (req, res) => {
    itemController.searchItems(req, res);
  });

  /**
   * POST /api/items/cleanup-old - Cleanup old items
   */
  app.post('/api/items/cleanup-old', isAuthenticated, (req, res) => {
    itemController.cleanupOldItems(req, res);
  });
};
