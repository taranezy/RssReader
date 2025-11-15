/**
 * FeedController - Single Responsibility: Handle HTTP requests related to feeds
 * Depends on FeedRepository, UserRepository, and RedisService (Dependency Injection)
 */
class FeedController {
  constructor(feedRepository, userRepository, redisService = null) {
    this.feedRepository = feedRepository;
    this.userRepository = userRepository;
    this.redisService = redisService;
  }

  /**
   * GET /api/feeds - Get all feeds for authenticated user
   * Smart caching strategy: Only refreshes if cache is older than 10 minutes
   * - Cache HIT (< 10 min): Returns instantly from Redis
   * - Cache MISS (> 10 min): Fetches from database and updates Redis
   * - No automatic refresh: Only refreshes on actual requests
   * Safe to call on every login/page load - won't waste resources
   */
  async getAllFeeds(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }
      
      // Try to get from cache
      if (this.redisService && this.redisService.isEnabled()) {
        const cacheKey = this.redisService.getUserFeedsKey(userId);
        const cachedFeeds = await this.redisService.get(cacheKey);
        if (cachedFeeds) {
          console.log('[FeedController.getAllFeeds] Cache HIT - returning cached feeds for userId:', userId);
          return res.json({
            success: true,
            data: cachedFeeds,
            count: cachedFeeds.length,
            cached: true
          });
        }
        console.log('[FeedController.getAllFeeds] Cache MISS for cacheKey:', cacheKey, '(cache expired or was invalidated - TTL: 10 minutes)');
      }

      // Cache miss or Redis disabled - get from database
      const feeds = this.feedRepository.getAllFeeds(userId);
      
      // Cache the fresh result
      if (this.redisService && this.redisService.isEnabled()) {
        const cacheKey = this.redisService.getUserFeedsKey(userId);
        await this.redisService.set(cacheKey, feeds, this.redisService.ttl.feeds);
        console.log('[FeedController.getAllFeeds] Updated Redis cache with fresh feeds');
      }
      
      res.json({
        success: true,
        data: feeds,
        count: feeds ? feeds.length : 0,
        cached: false
      });
    } catch (error) {
      console.error('[FeedController.getAllFeeds] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/feeds/:id - Get single feed by ID
   */
  getFeed(req, res) {
    try {
      const userId = req.user.id;
      const feedId = req.params.id;

      const feed = this.feedRepository.getFeed(feedId, userId);
      
      res.json({
        success: true,
        data: feed
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/feeds - Add new feed
   */
  async addFeed(req, res) {
    try {
      const userId = req.user.id;
      const { url, title, description, faviconUrl, updateFrequency, category, color } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          error: 'Feed URL is required'
        });
      }

      // Check for duplicate
      if (this.feedRepository.hasDuplicateFeed(userId, url)) {
        return res.status(409).json({
          success: false,
          error: 'Feed URL already exists'
        });
      }

      const feed = this.feedRepository.addFeed(userId, {
        url,
        title,
        description,
        faviconUrl,
        updateFrequency,
        category,
        color
      });

      // Invalidate user's feeds cache
      if (this.redisService && this.redisService.isEnabled()) {
        await this.redisService.invalidateUserCache(userId);
      }

      res.status(201).json({
        success: true,
        data: feed
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PUT /api/feeds/:id - Update feed
   */
  async updateFeed(req, res) {
    try {
      const userId = req.user.id;
      const feedId = req.params.id;
      const { title, description, faviconUrl, updateFrequency, category, color } = req.body;

      const feed = this.feedRepository.updateFeed(feedId, userId, {
        title,
        description,
        faviconUrl,
        updateFrequency,
        category,
        color
      });

      // Invalidate user's feeds cache
      if (this.redisService && this.redisService.isEnabled()) {
        await this.redisService.invalidateUserCache(userId);
      }

      res.json({
        success: true,
        data: feed
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/feeds/:id - Delete feed
   */
  async deleteFeed(req, res) {
    try {
      const userId = req.user.id;
      const feedId = req.params.id;
      
      console.log(`[FeedController.deleteFeed] Called with feedId: ${feedId}, userId: ${userId}`);

      const deleted = this.feedRepository.deleteFeed(feedId, userId);

      if (deleted) {
        // Invalidate user's feeds cache
        if (this.redisService && this.redisService.isEnabled()) {
          await this.redisService.invalidateUserCache(userId);
        }

        res.json({
          success: true,
          message: 'Feed deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Feed not found'
        });
      }
    } catch (error) {
      console.error(`[FeedController.deleteFeed] Error:`, error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/feeds/delete-all - Delete all feeds for authenticated user
   * WARNING: This action cannot be undone
   */
  async deleteAllFeeds(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      console.log(`[FeedController.deleteAllFeeds] Deleting all feeds for userId: ${userId}`);

      // Delete all feeds for this user (cascade will delete items too)
      const count = this.feedRepository.deleteAllFeeds(userId);
      console.log(`[FeedController.deleteAllFeeds] Database delete returned count: ${count}`);

      // Invalidate user's cache IMMEDIATELY
      if (this.redisService && this.redisService.isEnabled()) {
        console.log(`[FeedController.deleteAllFeeds] Invalidating Redis cache for userId: ${userId}`);
        await this.redisService.invalidateUserCache(userId);
        console.log(`[FeedController.deleteAllFeeds] Redis cache invalidated`);
      }

      console.log(`[FeedController.deleteAllFeeds] Successfully deleted ${count} feeds for userId: ${userId}`);

      res.json({
        success: true,
        message: `All ${count} feeds have been deleted successfully`,
        deletedCount: count
      });
    } catch (error) {
      console.error('[FeedController.deleteAllFeeds] Error:', error.message);
      console.error('[FeedController.deleteAllFeeds] Stack:', error.stack);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = FeedController;
