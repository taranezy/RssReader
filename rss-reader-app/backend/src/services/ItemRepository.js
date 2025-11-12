/**
 * ItemRepository - Single Responsibility: Feed item/article data access operations
 * Wraps existing database.js methods and provides consistent interface
 * Adapter pattern for legacy database service
 */
class ItemRepository {
  constructor(databaseService) {
    this.db = databaseService;
  }

  /**
   * Get all items for a feed
   */
  getItemsByFeed(feedId, userId, options = {}) {
    try {
      const items = this.db.getItemsByFeed(feedId, userId);
      const limit = options.limit || items.length;
      const offset = options.offset || 0;

      return items.slice(offset, offset + limit);
    } catch (error) {
      throw new Error(`Failed to get items by feed: ${error.message}`);
    }
  }

  /**
   * Get all items for a user
   */
  getUserItems(userId, options = {}) {
    try {
      const items = this.db.getAllItems(userId);
      const limit = options.limit || items.length;
      const offset = options.offset || 0;

      return items.slice(offset, offset + limit);
    } catch (error) {
      throw new Error(`Failed to get user items: ${error.message}`);
    }
  }

  /**
   * Get single item by ID
   */
  getItem(itemId, userId) {
    try {
      const items = this.db.getAllItems(userId);
      const item = items.find(i => i.id === itemId);

      if (!item) {
        throw new Error('Item not found');
      }

      return item;
    } catch (error) {
      throw new Error(`Failed to get item: ${error.message}`);
    }
  }

  /**
   * Add new item (article) to feed
   */
  addItem(feedId, itemData, userId) {
    try {
      const item = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        feed_id: feedId,
        title: itemData.title,
        link: itemData.link,
        description: itemData.description || '',
        pub_date: itemData.publishedDate || new Date().toISOString(),
        is_read: 0,
        author: itemData.author || '',
        categories: itemData.categories || '',
        content: itemData.content || '',
        image_url: itemData.imageUrl || ''
      };

      this.db.createItem(item, userId);
      return item.id;
    } catch (error) {
      throw new Error(`Failed to add item: ${error.message}`);
    }
  }

  /**
   * Mark item as read/unread
   */
  markItemAsRead(itemId, userId, isRead = true) {
    try {
      const item = this.getItem(itemId, userId);
      this.db.updateItem(itemId, userId, { is_read: isRead ? 1 : 0 });
      return { ...item, is_read: isRead ? 1 : 0 };
    } catch (error) {
      throw new Error(`Failed to mark item as read: ${error.message}`);
    }
  }

  /**
   * Mark all items in feed as read
   */
  markFeedAsRead(feedId, userId) {
    try {
      this.db.markAllAsRead(userId, feedId);
      return true;
    } catch (error) {
      throw new Error(`Failed to mark feed as read: ${error.message}`);
    }
  }

  /**
   * Toggle item saved status
   */
  toggleItemSaved(itemId, userId) {
    try {
      const item = this.getItem(itemId, userId);
      const newStatus = item.is_saved ? 0 : 1;
      this.db.toggleSavedStatus(itemId, userId, newStatus);
      return { ...item, is_saved: newStatus };
    } catch (error) {
      throw new Error(`Failed to toggle item saved: ${error.message}`);
    }
  }

  /**
   * Get saved items for user
   */
  getSavedItems(userId, options = {}) {
    try {
      const items = this.db.getSavedItems(userId);
      const limit = options.limit || items.length;
      const offset = options.offset || 0;

      return items.slice(offset, offset + limit);
    } catch (error) {
      throw new Error(`Failed to get saved items: ${error.message}`);
    }
  }

  /**
   * Get unread count for user
   */
  getUnreadCount(userId) {
    try {
      const items = this.db.getAllItems(userId);
      return items.filter(item => !item.is_read).length;
    } catch (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }
  }

  /**
   * Search items
   */
  searchItems(userId, searchQuery, options = {}) {
    try {
      const items = this.db.getAllItems(userId);
      const query = searchQuery.toLowerCase();

      const results = items.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.author?.toLowerCase().includes(query)
      );

      const limit = options.limit || results.length;
      const offset = options.offset || 0;

      return results.slice(offset, offset + limit);
    } catch (error) {
      throw new Error(`Failed to search items: ${error.message}`);
    }
  }

  /**
   * Delete items older than specified date
   */
  deleteOldItems(feedId, userId, daysOld = 30) {
    try {
      const deletedCount = this.db.deleteOldItemsByFeed(feedId, userId, daysOld);
      return deletedCount;
    } catch (error) {
      throw new Error(`Failed to delete old items: ${error.message}`);
    }
  }

  /**
   * Check if item exists by GUID
   */
  itemExists(feedId, guid) {
    try {
      const items = this.db.getItemsByFeed(feedId);
      return items.some(item => item.id === guid);
    } catch (error) {
      throw new Error(`Failed to check if item exists: ${error.message}`);
    }
  }

  /**
   * Bulk create items
   */
  createItems(userId, items) {
    try {
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Items must be a non-empty array');
      }

      // Transform items to database format
      const formattedItems = items.map(item => ({
        id: item.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        feedId: item.feedId || item.feed_id,
        feedTitle: item.feedTitle || item.feed_title || '',
        title: item.title || '',
        link: item.link || '',
        description: item.description || '',
        pubDate: item.pubDate || item.pub_date || new Date().toISOString(),
        isRead: item.isRead ? 1 : 0,
        author: item.author || '',
        categories: item.categories || [],
        content: item.content || '',
        imageUrl: item.imageUrl || item.image_url || ''
      }));

      this.db.createItems(formattedItems, userId);
      return formattedItems.map(item => item.id);
    } catch (error) {
      throw new Error(`Failed to create items: ${error.message}`);
    }
  }
}

module.exports = ItemRepository;
