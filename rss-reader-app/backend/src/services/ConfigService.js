/**
 * ConfigService.js
 * Responsibility: Centralize all configuration values
 * SOLID: Single Responsibility - manages environment and app config only
 */

const path = require('path');

class ConfigService {
  constructor() {
    // Load environment variables from .env file
    // Try multiple paths for flexibility (backend/.env or rss-reader-app/.env)
    const backendEnvPath = path.join(__dirname, '../../.env');
    const parentEnvPath = path.join(__dirname, '../../../.env');
    
    let envLoaded = false;
    
    // Try backend/.env first (most common in development)
    if (require('fs').existsSync(backendEnvPath)) {
      console.log(`[ConfigService] Loading .env from: ${backendEnvPath}`);
      require('dotenv').config({ path: backendEnvPath });
      envLoaded = true;
    } 
    // Fall back to parent directory
    else if (require('fs').existsSync(parentEnvPath)) {
      console.log(`[ConfigService] Loading .env from: ${parentEnvPath}`);
      require('dotenv').config({ path: parentEnvPath });
      envLoaded = true;
    }
    
    if (!envLoaded) {
      console.warn('[ConfigService] ⚠️  No .env file found. Using environment variables or defaults.');
    }

    // Server config
    this.PORT = process.env.PORT || 3000;
    this.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';
    this.NODE_ENV = process.env.NODE_ENV || 'development';
    this.isProduction = this.NODE_ENV === 'production';

    // Database config
    this.DB_PATH = path.join(__dirname, '../../data/rss-reader.db');
    this.DATA_DIR = path.join(__dirname, '../../data');

    // Session config
    this.SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';
    this.SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

    // OAuth config
    this.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    this.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    this.GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';

    // Log OAuth config for debugging
    console.log(`[ConfigService] GOOGLE_CLIENT_ID: ${this.GOOGLE_CLIENT_ID ? '✓ Loaded' : '✗ Missing'}`);
    console.log(`[ConfigService] GOOGLE_CLIENT_SECRET: ${this.GOOGLE_CLIENT_SECRET ? '✓ Loaded' : '✗ Missing'}`);
    console.log(`[ConfigService] GOOGLE_CALLBACK_URL: ${this.GOOGLE_CALLBACK_URL}`);

    // CORS config
    if (this.isProduction) {
      // Production: Use FRONTEND_URL from .env, or default to common DDNS domains
      const frontendUrl = process.env.FRONTEND_URL;
      this.CORS_ORIGINS = frontendUrl 
        ? [frontendUrl]
        : [
          'https://taranezy.ddns.net:8444',
          'https://taranezy.ddns.net',
          'http://taranezy.ddns.net:8444',
          'http://taranezy.ddns.net'
        ];
    } else {
      // Development: Allow local URLs
      this.CORS_ORIGINS = [
        'http://localhost:4200',
        'http://192.168.100.10:4200',
        'http://127.0.0.1:4200',
        'http://192.168.100.10:3000',
        'http://localhost:3000'
      ];
    }

    // Body parser config
    this.BODY_PARSER_LIMIT = '10mb';

    // Feed config
    this.INITIAL_FEEDS = [
      // Tech & Programming (5)
      { url: 'https://news.ycombinator.com/rss', title: 'Hacker News', category: 'Tech' },
      { url: 'https://www.theverge.com/rss/index.xml', title: 'The Verge', category: 'Tech' },
      { url: 'https://techcrunch.com/feed/', title: 'TechCrunch', category: 'Tech' },
      { url: 'https://arstechnica.com/feed/', title: 'Ars Technica', category: 'Tech' },
      { url: 'https://www.wired.com/feed/rss', title: 'Wired', category: 'Tech' },

      // Science (3)
      { url: 'https://www.sciencedaily.com/rss/all.xml', title: 'Science Daily', category: 'Science' },
      { url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', title: 'NASA News', category: 'Science' },
      { url: 'https://phys.org/rss-feed/', title: 'Phys.org', category: 'Science' },

      // News (4)
      { url: 'https://feeds.bbci.co.uk/news/rss.xml', title: 'BBC News', category: 'News' },
      { url: 'https://www.theguardian.com/world/rss', title: 'Guardian World', category: 'News' },
      { url: 'https://feeds.reuters.com/reuters/topNews', title: 'Reuters Top News', category: 'News' },
      { url: 'https://www.aljazeera.com/xml/rss/all.xml', title: 'Al Jazeera', category: 'News' },

      // YouTube Channels (3)
      { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCXuqSBlHAE6Xw-yeJA7Pur0', title: 'Linus Tech Tips', category: 'YouTube' },
      { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ', title: 'MKBHD - Marques Brownlee', category: 'YouTube' },
      { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCJ1X_WBt-7DW-yEtNpamZZw', title: 'ElectroBOOM', category: 'YouTube' },
    ];

    this.FEED_COLORS = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85929E', '#F06292', '#AED581'
    ];
  }

  /**
   * Validate required OAuth credentials
   */
  validateOAuthConfig() {
    if (!this.GOOGLE_CLIENT_ID || !this.GOOGLE_CLIENT_SECRET) {
      console.warn('⚠️ Google OAuth credentials not configured. OAuth login will not work.');
      return false;
    }
    return true;
  }

  /**
   * Log current configuration (safe - no secrets)
   */
  logConfig() {
    // Configuration logging disabled
  }

  /**
   * Get color for a feed by index
   */
  getFeedColor(index) {
    return this.FEED_COLORS[index % this.FEED_COLORS.length];
  }
}

module.exports = ConfigService;
