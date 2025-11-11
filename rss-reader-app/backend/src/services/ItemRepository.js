/**
 * ItemRepository - Single Responsibility: Feed item/article data access operations
 * Handles all database operations related to RSS items/articles
 * Encapsulates SQL queries for items
 */
class ItemRepository {
  constructor(database) {
    this.db = database;
  }

  /**
   * Get all items for a feed
   */
  getItemsByFeed(feedId, userId, options = {}) {
    try {
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      const onlyUnread = options.onlyUnread || false;

      let query = `
        SELECT fi.id, fi.feed_id, fi.title, fi.description, fi.link,
               fi.author, fi.published_date, fi.guid, fi.is_read,
               fi.is_saved, fi.created_at, f.title as feed_title
        FROM feed_items fi
        JOIN feeds f ON fi.feed_id = f.id
        WHERE fi.feed_id = ? AND f.user_id = ?
      `;

      const params = [feedId, userId];

      if (onlyUnread) {
        query += ` AND fi.is_read = 0`;
      }

      query += ` ORDER BY fi.published_date DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      return this.db.prepare(query).all(...params);
    } catch (error) {
      throw new Error(`Failed to get items by feed: ${error.message}`);
    }
  }

  /**
   * Get all items for a user
   */
  getUserItems(userId, options = {}) {
    try {
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      const onlyUnread = options.onlyUnread || false;

      let query = `
        SELECT fi.id, fi.feed_id, fi.title, fi.description, fi.link,
               fi.author, fi.published_date, fi.guid, fi.is_read,
               fi.is_saved, fi.created_at, f.title as feed_title, f.id as feed_id
        FROM feed_items fi
        JOIN feeds f ON fi.feed_id = f.id
        WHERE f.user_id = ?
      `;

      const params = [userId];

      if (onlyUnread) {
        query += ` AND fi.is_read = 0`;
      }

      query += ` ORDER BY fi.published_date DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      return this.db.prepare(query).all(...params);
    } catch (error) {
      throw new Error(`Failed to get user items: ${error.message}`);
    }
  }

  /**
   * Get single item by ID
   */
  getItem(itemId, userId) {
    try {
      const item = this.db.prepare(`
        SELECT fi.id, fi.feed_id, fi.title, fi.description, fi.link,
               fi.author, fi.published_date, fi.guid, fi.is_read,
               fi.is_saved, fi.created_at, f.title as feed_title
        FROM feed_items fi
        JOIN feeds f ON fi.feed_id = f.id
        WHERE fi.id = ? AND f.user_id = ?
      `).get(itemId, userId);

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
  addItem(feedId, itemData) {
    try {
      const result = this.db.prepare(`
        INSERT INTO feed_items (feed_id, title, description, link, author, published_date, guid)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        feedId,
        itemData.title,
        itemData.description || null,
        itemData.link,
        itemData.author || null,
        itemData.publishedDate || new Date().toISOString(),
        itemData.guid || itemData.link
      );

      return result.lastInsertRowid;
    } catch (error) {
      throw new Error(`Failed to add item: ${error.message}`);
    }
  }

  /**
   * Mark item as read/unread
   */
  markItemAsRead(itemId, userId, isRead = true) {
    try {
      // Verify item belongs to user
      this.getItem(itemId, userId);

      this.db.prepare(`
        UPDATE feed_items
        SET is_read = ?
        WHERE id = ?
      `).run(isRead ? 1 : 0, itemId);

      return this.getItem(itemId, userId);
    } catch (error) {
      throw new Error(`Failed to mark item as read: ${error.message}`);
    }
  }

  /**
   * Mark all items in feed as read
   */
  markFeedAsRead(feedId, userId) {
    try {
      // Verify feed belongs to user
      this.db.prepare(`
        SELECT id FROM feeds WHERE id = ? AND user_id = ?
      `).get(feedId, userId);

      this.db.prepare(`
        UPDATE feed_items
        SET is_read = 1
        WHERE feed_id = ?
      `).run(feedId);

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

      this.db.prepare(`
        UPDATE feed_items
        SET is_saved = ?
        WHERE id = ?
      `).run(newStatus, itemId);

      return this.getItem(itemId, userId);
    } catch (error) {
      throw new Error(`Failed to toggle item saved: ${error.message}`);
    }
  }

  /**
   * Search items
   */
  searchItems(userId, searchQuery, options = {}) {
    try {
      const limit = options.limit || 50;
      const offset = options.offset || 0;

      const query = `
        SELECT fi.id, fi.feed_id, fi.title, fi.description, fi.link,
               fi.author, fi.published_date, fi.guid, fi.is_read,
               fi.is_saved, fi.created_at, f.title as feed_title
        FROM feed_items fi
        JOIN feeds f ON fi.feed_id = f.id
        WHERE f.user_id = ? AND (
          fi.title LIKE ? OR fi.description LIKE ? OR fi.author LIKE ?
        )
        ORDER BY fi.published_date DESC
        LIMIT ? OFFSET ?
      `;

      const searchPattern = `%${searchQuery}%`;
      return this.db.prepare(query).all(
        userId,
        searchPattern,
        searchPattern,
        searchPattern,
        limit,
        offset
      );
    } catch (error) {
      throw new Error(`Failed to search items: ${error.message}`);
    }
  }

  /**
   * Get saved items for user
   */
  getSavedItems(userId, options = {}) {
    try {
      const limit = options.limit || 100;
      const offset = options.offset || 0;

      return this.db.prepare(`
        SELECT fi.id, fi.feed_id, fi.title, fi.description, fi.link,
               fi.author, fi.published_date, fi.guid, fi.is_read,
               fi.is_saved, fi.created_at, f.title as feed_title
        FROM feed_items fi
        JOIN feeds f ON fi.feed_id = f.id
        WHERE f.user_id = ? AND fi.is_saved = 1
        ORDER BY fi.published_date DESC
        LIMIT ? OFFSET ?
      `).all(userId, limit, offset);
    } catch (error) {
      throw new Error(`Failed to get saved items: ${error.message}`);
    }
  }

  /**
   * Get unread count for user
   */
  getUnreadCount(userId) {
    try {
      const result = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM feed_items fi
        JOIN feeds f ON fi.feed_id = f.id
        WHERE f.user_id = ? AND fi.is_read = 0
      `).get(userId);

      return result.count || 0;
    } catch (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }
  }

  /**
   * Delete items older than specified date
   */
  deleteOldItems(feedId, userId, daysOld = 30) {
    try {
      // Verify feed belongs to user
      this.db.prepare(`
        SELECT id FROM feeds WHERE id = ? AND user_id = ?
      `).get(feedId, userId);

      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

      const result = this.db.prepare(`
        DELETE FROM feed_items
        WHERE feed_id = ? AND published_date < ? AND is_saved = 0
      `).run(feedId, cutoffDate);

      return result.changes;
    } catch (error) {
      throw new Error(`Failed to delete old items: ${error.message}`);
    }
  }

  /**
   * Check if item exists by GUID
   */
  itemExists(feedId, guid) {
    try {
      const item = this.db.prepare(`
        SELECT id FROM feed_items
        WHERE feed_id = ? AND guid = ?
      `).get(feedId, guid);

      return !!item;
    } catch (error) {
      throw new Error(`Failed to check if item exists: ${error.message}`);
    }
  }
}

module.exports = ItemRepository;
