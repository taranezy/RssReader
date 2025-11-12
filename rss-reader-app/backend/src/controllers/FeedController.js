/**
 * FeedController - Single Responsibility: Handle HTTP requests related to feeds
 * Depends on FeedRepository and UserRepository (Dependency Injection)
 */
class FeedController {
  constructor(feedRepository, userRepository) {
    this.feedRepository = feedRepository;
    this.userRepository = userRepository;
  }

  /**
   * GET /api/feeds - Get all feeds for authenticated user
   */
  getAllFeeds(req, res) {
    try {
      const userId = req.user.id;
      const feeds = this.feedRepository.getAllFeeds(userId);
      
      res.json({
        success: true,
        data: feeds,
        count: feeds ? feeds.length : 0
      });
    } catch (error) {
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
  addFeed(req, res) {
    try {
      const userId = req.user.id;
      const { url, title, description, faviconUrl, updateFrequency } = req.body;

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
        updateFrequency
      });

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
  updateFeed(req, res) {
    try {
      const userId = req.user.id;
      const feedId = req.params.id;
      const { title, description, faviconUrl, updateFrequency } = req.body;

      const feed = this.feedRepository.updateFeed(feedId, userId, {
        title,
        description,
        faviconUrl,
        updateFrequency
      });

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
  deleteFeed(req, res) {
    try {
      const userId = req.user.id;
      const feedId = req.params.id;

      const deleted = this.feedRepository.deleteFeed(feedId, userId);

      if (deleted) {
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
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = FeedController;
