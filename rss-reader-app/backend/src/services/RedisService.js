/**
 * RedisService.js
 * Responsibility: Handle all Redis caching operations
 * SOLID: Single Responsibility - manages cache operations only
 */

class RedisService {
  constructor() {
    this.redis = null;
    this.enabled = false;
    this.ttl = {
      feeds: 10 * 60, // 10 minutes for feed list - only refresh if older than this
      feedItems: 10 * 60, // 10 minutes for feed items
      userFeeds: 15 * 60, // 15 minutes for user's feeds
      searchResults: 5 * 60 // 5 minutes for search results
    };
  }

  /**
   * Initialize Redis client
   */
  async initialize() {
    try {
      // Try to import redis client
      const redis = require('redis');
      
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = parseInt(process.env.REDIS_PORT || '6379');
      
      console.log(`[RedisService] Environment - REDIS_HOST=${redisHost}, REDIS_PORT=${redisPort}`);
      console.log(`[RedisService] Attempting to connect to Redis at ${redisHost}:${redisPort}`);
      
      // Create client with correct v4 API - use url format
      this.redis = redis.createClient({
        url: `redis://${redisHost}:${redisPort}`,
        socket: {
          reconnectStrategy: false // Disable auto-reconnect to avoid spam
        }
      });

      // Set up event handlers - suppress error logs initially
      let errorLogged = false;
      this.redis.on('error', (err) => {
        if (!errorLogged) {
          console.warn('[RedisService] Connection failed:', err.message);
          console.warn(`[RedisService] Failed to connect to ${redisHost}:${redisPort}`);
          errorLogged = true;
        }
        this.enabled = false;
      });

      this.redis.on('connect', () => {
        console.log('[RedisService] ✓ Connected to Redis at', redisHost);
        this.enabled = true;
      });

      this.redis.on('ready', () => {
        console.log('[RedisService] ✓ Redis ready');
        this.enabled = true;
      });

      // Connect with timeout
      const connectPromise = this.redis.connect();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timeout after 5s')), 5000)
      );

      try {
        await Promise.race([connectPromise, timeoutPromise]);
        this.enabled = true;
        console.log('[RedisService] ✓ Redis initialized successfully');
      } catch (timeoutError) {
        console.warn('[RedisService]', timeoutError.message, '- disabling Redis');
        this.enabled = false;
        if (this.redis) {
          try {
            await this.redis.disconnect();
          } catch (e) {
            // Ignore disconnect errors
          }
          this.redis = null;
        }
      }
    } catch (error) {
      console.warn('[RedisService] Redis initialization failed:', error.message);
      console.warn('[RedisService] Continuing without cache - app will work normally');
      this.enabled = false;
      this.redis = null;
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    if (!this.enabled || !this.redis) {
      return null;
    }
    try {
      const value = await this.redis.get(key);
      if (value) {
        console.log(`[RedisService] Cache HIT: ${key}`);
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error(`[RedisService] Error getting cache ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key, value, ttlOverride = null) {
    if (!this.enabled || !this.redis) {
      return false;
    }
    try {
      const ttl = ttlOverride || this.ttl.feeds;
      await this.redis.setEx(key, ttl, JSON.stringify(value));
      console.log(`[RedisService] Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error(`[RedisService] Error setting cache ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete cache key
   */
  async delete(key) {
    if (!this.enabled || !this.redis) {
      return false;
    }
    try {
      await this.redis.del(key);
      console.log(`[RedisService] Cache DELETED: ${key}`);
      return true;
    } catch (error) {
      console.error(`[RedisService] Error deleting cache ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete multiple cache keys by pattern
   */
  async deletePattern(pattern) {
    if (!this.enabled || !this.redis) {
      return 0;
    }
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
        console.log(`[RedisService] Cache DELETED ${keys.length} keys matching: ${pattern}`);
      }
      return keys.length;
    } catch (error) {
      console.error(`[RedisService] Error deleting cache pattern ${pattern}:`, error.message);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async flush() {
    if (!this.enabled || !this.redis) {
      return false;
    }
    try {
      await this.redis.flushAll();
      console.log('[RedisService] Cache FLUSHED - all keys cleared');
      return true;
    } catch (error) {
      console.error('[RedisService] Error flushing cache:', error.message);
      return false;
    }
  }

  /**
   * Generate cache key for user feeds
   */
  getUserFeedsKey(userId) {
    return `user:${userId}:feeds`;
  }

  /**
   * Generate cache key for user feed items
   */
  getUserFeedItemsKey(userId, feedId) {
    return `user:${userId}:feed:${feedId}:items`;
  }

  /**
   * Generate cache key for user saved items
   */
  getUserSavedItemsKey(userId) {
    return `user:${userId}:saved:items`;
  }

  /**
   * Generate cache key for search results
   */
  getSearchKey(userId, query) {
    return `user:${userId}:search:${query}`;
  }

  /**
   * Invalidate user-related caches
   */
  async invalidateUserCache(userId) {
    if (!this.enabled || !this.redis) {
      return 0;
    }
    const pattern = `user:${userId}:*`;
    return this.deletePattern(pattern);
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.redis && this.enabled) {
      try {
        await this.redis.disconnect();
        console.log('[RedisService] Disconnected from Redis');
      } catch (error) {
        console.error('[RedisService] Error closing Redis connection:', error.message);
      }
    }
  }

  /**
   * Check if Redis is enabled and available
   */
  isEnabled() {
    return this.enabled && this.redis !== null;
  }
}

module.exports = RedisService;
