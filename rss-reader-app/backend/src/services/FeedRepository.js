/**
 * FeedRepository - Single Responsibility: Feed data access operations
 * Wraps existing database.js methods and provides consistent interface
 * Adapter pattern for legacy database service
 */
class FeedRepository {
  constructor(databaseService) {
    this.db = databaseService;
  }

  /**
   * Get all feeds for a user
   */
  getAllFeeds(userId) {
    try {
      return this.db.getAllFeeds(userId);
    } catch (error) {
      throw new Error(`Failed to get feeds: ${error.message}`);
    }
  }

  /**
   * Get single feed by ID
   */
  getFeed(feedId, userId) {
    try {
      const feed = this.db.getFeedById(feedId, userId);
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
      const feed = {
        id: `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: feedData.url,
        title: feedData.title,
        description: feedData.description || '',
        color: feedData.color || '#4ECDC4',
        category: feedData.category || '',
        isActive: true,
        addedDate: new Date().toISOString()
      };

      this.db.createFeed(feed, userId);
      return this.db.getFeedById(feed.id, userId);
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

      const updates = {};
      if (feedData.title !== undefined) updates.title = feedData.title;
      if (feedData.description !== undefined) updates.description = feedData.description;
      if (feedData.color !== undefined) updates.color = feedData.color;
      if (feedData.category !== undefined) updates.category = feedData.category;

      this.db.updateFeed(feedId, userId, updates);
      return this.db.getFeedById(feedId, userId);
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
      this.db.deleteFeed(feedId, userId);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete feed: ${error.message}`);
    }
  }

  /**
   * Check if user has duplicate feed URL
   */
  hasDuplicateFeed(userId, feedUrl) {
    try {
      const feeds = this.db.getAllFeeds(userId);
      return feeds.some(feed => feed.url === feedUrl);
    } catch (error) {
      throw new Error(`Failed to check duplicate feed: ${error.message}`);
    }
  }
}

module.exports = FeedRepository;
