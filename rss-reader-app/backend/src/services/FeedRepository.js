/**
 * FeedRepository - Single Responsibility: Feed data access operations
 * Handles all database operations related to RSS feeds
 * Encapsulates SQL queries for feeds
 */
class FeedRepository {
  constructor(database) {
    this.db = database;
  }

  /**
   * Get all feeds for a user
   */
  getAllFeeds(userId) {
    try {
      const feeds = this.db.prepare(`
        SELECT id, user_id, title, url, description, favicon_url, 
               last_updated, created_at, update_frequency
        FROM feeds
        WHERE user_id = ?
        ORDER BY title ASC
      `).all(userId);

      return feeds;
    } catch (error) {
      throw new Error(`Failed to get feeds: ${error.message}`);
    }
  }

  /**
   * Get single feed by ID
   */
  getFeed(feedId, userId) {
    try {
      const feed = this.db.prepare(`
        SELECT id, user_id, title, url, description, favicon_url,
               last_updated, created_at, update_frequency
        FROM feeds
        WHERE id = ? AND user_id = ?
      `).get(feedId, userId);

      if (!feed) {
        throw new Error('Feed not found');
      }

      return feed;
    } catch (error) {
      throw new Error(`Failed to get feed: ${error.message}`);
    }
  }

  /**
   * Add new feed for user
   */
  addFeed(userId, feedData) {
    try {
      const result = this.db.prepare(`
        INSERT INTO feeds (user_id, title, url, description, favicon_url, update_frequency)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        feedData.title,
        feedData.url,
        feedData.description || null,
        feedData.faviconUrl || null,
        feedData.updateFrequency || 3600
      );

      return this.getFeed(result.lastInsertRowid, userId);
    } catch (error) {
      throw new Error(`Failed to add feed: ${error.message}`);
    }
  }

  /**
   * Update feed information
   */
  updateFeed(feedId, userId, feedData) {
    try {
      // Verify feed belongs to user
      this.getFeed(feedId, userId);

      this.db.prepare(`
        UPDATE feeds
        SET title = ?, description = ?, favicon_url = ?, update_frequency = ?, last_updated = ?
        WHERE id = ? AND user_id = ?
      `).run(
        feedData.title || undefined,
        feedData.description || undefined,
        feedData.faviconUrl || undefined,
        feedData.updateFrequency || undefined,
        new Date().toISOString(),
        feedId,
        userId
      );

      return this.getFeed(feedId, userId);
    } catch (error) {
      throw new Error(`Failed to update feed: ${error.message}`);
    }
  }

  /**
   * Delete feed
   */
  deleteFeed(feedId, userId) {
    try {
      // Verify feed belongs to user
      this.getFeed(feedId, userId);

      // Delete associated items
      this.db.prepare(`
        DELETE FROM feed_items
        WHERE feed_id = ?
      `).run(feedId);

      // Delete feed
      const result = this.db.prepare(`
        DELETE FROM feeds
        WHERE id = ? AND user_id = ?
      `).run(feedId, userId);

      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to delete feed: ${error.message}`);
    }
  }

  /**
   * Update feed's last_updated timestamp
   */
  updateFeedTimestamp(feedId, userId) {
    try {
      // Verify feed belongs to user
      this.getFeed(feedId, userId);

      this.db.prepare(`
        UPDATE feeds
        SET last_updated = ?
        WHERE id = ? AND user_id = ?
      `).run(new Date().toISOString(), feedId, userId);

      return this.getFeed(feedId, userId);
    } catch (error) {
      throw new Error(`Failed to update feed timestamp: ${error.message}`);
    }
  }

  /**
   * Get feeds that need updating
   */
  getFeedsToUpdate(maxAgeSeconds = 3600) {
    try {
      const cutoffTime = new Date(Date.now() - maxAgeSeconds * 1000).toISOString();
      
      const feeds = this.db.prepare(`
        SELECT id, user_id, title, url, description, favicon_url,
               last_updated, created_at, update_frequency
        FROM feeds
        WHERE last_updated IS NULL OR last_updated < ?
        ORDER BY last_updated ASC
      `).all(cutoffTime);

      return feeds;
    } catch (error) {
      throw new Error(`Failed to get feeds to update: ${error.message}`);
    }
  }

  /**
   * Check if user has duplicate feed URL
   */
  hasDuplicateFeed(userId, feedUrl) {
    try {
      const feed = this.db.prepare(`
        SELECT id FROM feeds
        WHERE user_id = ? AND url = ?
      `).get(userId, feedUrl);

      return !!feed;
    } catch (error) {
      throw new Error(`Failed to check duplicate feed: ${error.message}`);
    }
  }
}

module.exports = FeedRepository;
