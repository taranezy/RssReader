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
   * Returns count of feeds successfully created
   */
  populateInitialFeeds(userId) {
    const feeds = this.config.INITIAL_FEEDS;
    let createdCount = 0;

    console.log(`[FeedDataService] Starting to populate ${feeds.length} initial feeds for user ${userId}`);

    feeds.forEach((feed, index) => {
      try {
        const color = this.config.getFeedColor(index);
        const createdFeed = this.feedRepository.addFeed(userId, {
          url: feed.url,
          title: feed.title,
          description: feed.title,
          color: color,
          category: feed.category,
          isActive: true,
          addedDate: new Date().toISOString()
        });
        
        if (createdFeed) {
          createdCount++;
          console.log(`[FeedDataService] ✓ Created feed: ${feed.title} (ID: ${createdFeed.id})`);
        }
      } catch (error) {
        console.error(`[FeedDataService] ❌ Error creating feed ${feed.title}:`, error.message);
      }
    });

    console.log(`[FeedDataService] Successfully created ${createdCount}/${feeds.length} initial feeds for user ${userId}`);
    return createdCount;
  }
}

module.exports = FeedDataService;
