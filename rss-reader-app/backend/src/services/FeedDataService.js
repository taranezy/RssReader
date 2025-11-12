/**
 * FeedDataService.js
 * Responsibility: Populate initial feeds for new users
 * SOLID: Single Responsibility - handles feed initialization only
 */

class FeedDataService {
  constructor(feedRepository, config) {
    this.feedRepository = feedRepository;
    this.config = config;
  }

  /**
   * Populate initial feeds for a new user
   */
  populateInitialFeeds(userId) {
    const feeds = this.config.INITIAL_FEEDS;

    feeds.forEach((feed, index) => {
      try {
        const color = this.config.getFeedColor(index);
        this.feedRepository.addFeed(userId, {
          url: feed.url,
          title: feed.title,
          description: feed.title,
          color: color,
          category: feed.category,
          isActive: true,
          addedDate: new Date().toISOString()
        });
      } catch (error) {
        console.error(`❌ Error creating feed ${feed.title}:`, error.message);
      }
    });

  }
}

module.exports = FeedDataService;
