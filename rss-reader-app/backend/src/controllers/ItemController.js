/**
 * ItemController - Single Responsibility: Handle HTTP requests related to feed items/articles
 * Depends on ItemRepository and FeedRepository (Dependency Injection)
 */
class ItemController {
  constructor(itemRepository, feedRepository) {
    this.itemRepository = itemRepository;
    this.feedRepository = feedRepository;
  }

  /**
   * GET /api/items - Get all items for authenticated user
   */
  getUserItems(req, res) {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit) : undefined;  // No default limit
      const offset = parseInt(req.query.offset) || 0;
      const onlyUnread = req.query.unread === 'true';

      const items = this.itemRepository.getUserItems(userId, {
        limit,
        offset,
        onlyUnread
      });

      res.json({
        success: true,
        data: items,
        count: items.length,
        pagination: { limit, offset }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/feeds/:feedId/items - Get items for specific feed
   */
  getFeedItems(req, res) {
    try {
      const userId = req.user.id;
      const feedId = req.params.feedId;
      const limit = req.query.limit ? parseInt(req.query.limit) : undefined;  // No default limit
      const offset = parseInt(req.query.offset) || 0;
      const onlyUnread = req.query.unread === 'true';

      // Verify feed belongs to user
      this.feedRepository.getFeed(feedId, userId);

      const items = this.itemRepository.getItemsByFeed(feedId, userId, {
        limit,
        offset,
        onlyUnread
      });

      res.json({
        success: true,
        data: items,
        count: items.length,
        pagination: { limit, offset }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PUT /api/items/:id - Mark item as read/unread
   */
  markItemAsRead(req, res) {
    try {
      const userId = req.user.id;
      const itemId = req.params.id;
      const { isRead } = req.body;

      const item = this.itemRepository.markItemAsRead(itemId, userId, isRead);

      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/items/mark-all-read - Mark all items as read for a feed
   */
  markFeedAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { feedId } = req.body;

      if (!feedId) {
        return res.status(400).json({
          success: false,
          error: 'Feed ID is required'
        });
      }

      // Verify feed belongs to user
      this.feedRepository.getFeed(feedId, userId);

      this.itemRepository.markFeedAsRead(feedId, userId);

      res.json({
        success: true,
        message: 'All items marked as read'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/items/:id/toggle-save - Toggle item saved status
   */
  toggleItemSaved(req, res) {
    try {
      const userId = req.user.id;
      const itemId = req.params.id;

      const item = this.itemRepository.toggleItemSaved(itemId, userId);

      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/items/saved - Get saved items
   */
  getSavedItems(req, res) {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit) : undefined;  // No default limit
      const offset = parseInt(req.query.offset) || 0;

      const items = this.itemRepository.getSavedItems(userId, {
        limit,
        offset
      });

      res.json({
        success: true,
        data: items,
        count: items.length,
        pagination: { limit, offset }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/items/unread-count - Get unread items count
   */
  getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = this.itemRepository.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/items/search - Search items
   */
  searchItems(req, res) {
    try {
      const userId = req.user.id;
      const { query } = req.query;
      const limit = req.query.limit ? parseInt(req.query.limit) : undefined;  // No default limit
      const offset = parseInt(req.query.offset) || 0;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const items = this.itemRepository.searchItems(userId, query, {
        limit,
        offset
      });

      res.json({
        success: true,
        data: items,
        count: items.length,
        pagination: { limit, offset }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/items/cleanup-old - Delete old items
   */
  cleanupOldItems(req, res) {
    try {
      const userId = req.user.id;
      const { feedId, daysOld } = req.body;

      if (!feedId) {
        return res.status(400).json({
          success: false,
          error: 'Feed ID is required'
        });
      }

      // Verify feed belongs to user
      this.feedRepository.getFeed(feedId, userId);

      const deletedCount = this.itemRepository.deleteOldItems(
        feedId,
        userId,
        daysOld || 30
      );

      res.json({
        success: true,
        message: `Deleted ${deletedCount} old items`,
        data: { deletedCount }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Bulk create items
   */
  createItems(req, res) {
    try {
      const userId = req.user.id;
      const items = req.body;

      if (!Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          error: 'Request body must be an array of items'
        });
      }

      if (items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Items array cannot be empty'
        });
      }

      const createdItemIds = this.itemRepository.createItems(userId, items);

      res.status(201).json({
        success: true,
        data: createdItemIds,
        count: createdItemIds.length,
        message: `Created ${createdItemIds.length} items`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = ItemController;
