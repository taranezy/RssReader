/**
 * CacheRefreshScheduler.js
 * Responsibility: Schedule automatic cache invalidation every 10 minutes
 * SOLID: Single Responsibility - manages scheduled cache refresh only
 */

class CacheRefreshScheduler {
  constructor(redisService) {
    this.redisService = redisService;
    this.refreshIntervalMs = 10 * 60 * 1000; // 10 minutes
    this.intervalId = null;
  }

  /**
   * Start the scheduler to refresh cache every 10 minutes
   */
  start() {
    if (!this.redisService.isEnabled()) {
      console.log('[CacheRefreshScheduler] Redis not enabled, scheduler not started');
      return;
    }

    console.log('[CacheRefreshScheduler] Starting automatic cache refresh every 10 minutes');

    this.intervalId = setInterval(() => {
      this.refreshCache();
    }, this.refreshIntervalMs);
  }

  /**
   * Refresh cache by clearing old entries
   * Forces feeds to be re-fetched and cached fresh
   */
  async refreshCache() {
    try {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[CacheRefreshScheduler] Running cache refresh at ${timestamp}`);

      if (!this.redisService.isEnabled()) {
        return;
      }

      // Clear all feed caches to force fresh data on next request
      const feedsCleared = await this.redisService.deletePattern('user:*:feeds');
      console.log(`[CacheRefreshScheduler] Cleared ${feedsCleared} feed list caches`);

      // Clear feed items caches
      const itemsCleared = await this.redisService.deletePattern('user:*:feed:*:items');
      console.log(`[CacheRefreshScheduler] Cleared ${itemsCleared} feed item caches`);

      // Clear saved items caches
      const savedCleared = await this.redisService.deletePattern('user:*:saved:items');
      console.log(`[CacheRefreshScheduler] Cleared ${savedCleared} saved item caches`);

      const totalCleared = feedsCleared + itemsCleared + savedCleared;
      console.log(`[CacheRefreshScheduler] ✓ Cache refresh complete (${totalCleared} entries cleared)`);

    } catch (error) {
      console.error('[CacheRefreshScheduler] Error during refresh:', error.message);
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[CacheRefreshScheduler] Scheduler stopped');
    }
  }
}

module.exports = CacheRefreshScheduler;
