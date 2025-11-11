/**
 * REFACTORED SERVER.JS - SOLID Architecture
 * Responsibility: Express app setup, middleware, and route registration
 * All business logic moved to Services and Controllers
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import Services (data access layer)
const DatabaseService = require('./src/services/DatabaseService');
const UserRepository = require('./src/services/UserRepository');
const SettingsRepository = require('./src/services/SettingsRepository');
const FeedRepository = require('./src/services/FeedRepository');
const ItemRepository = require('./src/services/ItemRepository');
const AuthenticationService = require('./src/services/AuthenticationService');

// Import Controllers (business logic layer)
const AuthController = require('./src/controllers/AuthController');
const FeedController = require('./src/controllers/FeedController');
const ItemController = require('./src/controllers/ItemController');
const SettingsController = require('./src/controllers/SettingsController');

// Import Routes (endpoint organization)
const createAuthRoutes = require('./src/routes/authRoutes');
const createFeedRoutes = require('./src/routes/feedRoutes');
const createItemRoutes = require('./src/routes/itemRoutes');
const createSettingsRoutes = require('./src/routes/settingsRoutes');

// Import Middleware
const isAuthenticated = require('./src/middleware/isAuthenticated');
const errorHandler = require('./src/middleware/errorHandler');
const loggerMiddleware = require('./src/middleware/logger');

// Import legacy services
const RssProxyService = require('./rss-proxy');

// ============================================
// INITIALIZATION
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';
const isProduction = process.env.NODE_ENV === 'production';

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ============================================
// DEPENDENCY INJECTION
// ============================================

// Initialize database service
const db = new DatabaseService();

// Create repositories (data access layer)
const userRepository = new UserRepository(db.getDatabase());
const settingsRepository = new SettingsRepository(db.getDatabase());
const feedRepository = new FeedRepository(db.getDatabase());
const itemRepository = new ItemRepository(db.getDatabase());

// Create services (business logic layer)
const authenticationService = new AuthenticationService(userRepository);

// Create controllers (request handlers)
const authController = new AuthController(authenticationService);
const feedController = new FeedController(feedRepository, userRepository);
const itemController = new ItemController(itemRepository, feedRepository);
const settingsController = new SettingsController(settingsRepository);

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

app.use(loggerMiddleware);

app.use(cors({
  origin: isProduction ? false : [
    'http://localhost:4200',
    'http://192.168.100.10:4200',
    'http://127.0.0.1:4200',
    'http://192.168.100.10:3000',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    domain: undefined
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ============================================
// PASSPORT CONFIGURATION
// ============================================

// Function to populate initial feeds for new users
const populateInitialFeeds = (userId) => {
  const initialFeeds = [
    { url: 'https://news.ycombinator.com/rss', title: 'Hacker News', category: 'Tech' },
    { url: 'https://www.theverge.com/rss/index.xml', title: 'The Verge', category: 'Tech' },
    { url: 'https://techcrunch.com/feed/', title: 'TechCrunch', category: 'Tech' },
    { url: 'https://arstechnica.com/feed/', title: 'Ars Technica', category: 'Tech' },
    { url: 'https://www.wired.com/feed/rss', title: 'Wired', category: 'Tech' },
    { url: 'https://www.sciencedaily.com/rss/all.xml', title: 'Science Daily', category: 'Science' },
    { url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', title: 'NASA News', category: 'Science' },
    { url: 'https://phys.org/rss-feed/', title: 'Phys.org', category: 'Science' },
    { url: 'https://feeds.bbci.co.uk/news/rss.xml', title: 'BBC News', category: 'News' },
    { url: 'https://www.theguardian.com/world/rss', title: 'Guardian World', category: 'News' },
    { url: 'https://feeds.reuters.com/reuters/topNews', title: 'Reuters Top News', category: 'News' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', title: 'Al Jazeera', category: 'News' },
    { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCXuqSBlHAE6Xw-yeJA7Pur0', title: 'Linus Tech Tips', category: 'YouTube' },
    { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ', title: 'MKBHD - Marques Brownlee', category: 'YouTube' },
    { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCJ1X_WBt-7DW-yEtNpamZZw', title: 'ElectroBOOM', category: 'YouTube' },
  ];

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85929E', '#F06292', '#AED581'];

  initialFeeds.forEach((feed, index) => {
    try {
      feedRepository.addFeed(userId, {
        url: feed.url,
        title: feed.title,
        description: feed.title,
        updateFrequency: 3600
      });
    } catch (error) {
      console.error(`Error creating feed ${feed.title}:`, error.message);
    }
  });

  console.log(`Populated ${initialFeeds.length} initial feeds for new user`);
};

// Google OAuth Strategy
const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';
console.log('Google OAuth Callback URL:', callbackURL);

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL
  },
  (accessToken, refreshToken, profile, done) => {
    try {
      let user = userRepository.findByGoogleId(profile.id);
      let isNewUser = false;

      if (!user) {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const username = profile.displayName || email;
        const result = userRepository.create({
          email,
          username,
          googleId: profile.id
        });

        user = userRepository.findById(result.lastInsertRowid);
        isNewUser = true;

        try {
          populateInitialFeeds(user.id);
        } catch (error) {
          console.error('Error populating initial feeds:', error.message);
        }
      }

      userRepository.updateLastLogin(user.id);
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  try {
    const user = userRepository.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ============================================
// REGISTER ROUTES
// ============================================

createAuthRoutes(app, authController, passport, isAuthenticated);
createFeedRoutes(app, feedController, isAuthenticated);
createItemRoutes(app, itemController, isAuthenticated);
createSettingsRoutes(app, settingsController, isAuthenticated);

// ============================================
// LEGACY ROUTES (Export/Import/Proxy)
// ============================================

// Placeholder for export functionality (to be refactored)
app.get('/api/export', isAuthenticated, (req, res) => {
  res.status(501).json({ error: 'Export functionality will be refactored' });
});

// Placeholder for import functionality (to be refactored)
app.post('/api/import', isAuthenticated, (req, res) => {
  res.status(501).json({ error: 'Import functionality will be refactored' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use(errorHandler);

// ============================================
// SERVER START
// ============================================

app.listen(PORT, () => {
  console.log(`RSS Reader API server running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
});

module.exports = app;
