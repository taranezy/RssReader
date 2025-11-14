// RSS Reader Backend - SOLID Architecture
const path = require('path');
const fs = require('fs');

// Services
const ConfigService = require('./src/services/ConfigService');
const AppBootstrapper = require('./src/services/AppBootstrapper');
const PassportService = require('./src/services/PassportService');
const FeedDataService = require('./src/services/FeedDataService');
const ProxyService = require('./src/services/ProxyService');
const RedisService = require('./src/services/RedisService');

// Database & Repositories  
const DatabaseService = require('./database');
const UserRepository = require('./src/services/UserRepository');
const SettingsRepository = require('./src/services/SettingsRepository');
const FeedRepository = require('./src/services/FeedRepository');
const ItemRepository = require('./src/services/ItemRepository');
const AuthenticationService = require('./src/services/AuthenticationService');

// Controllers
const AuthController = require('./src/controllers/AuthController');
const FeedController = require('./src/controllers/FeedController');
const ItemController = require('./src/controllers/ItemController');
const SettingsController = require('./src/controllers/SettingsController');
const ProxyController = require('./src/controllers/ProxyController');

// Routes
const createAuthRoutes = require('./src/routes/authRoutes');
const createFeedRoutes = require('./src/routes/feedRoutes');
const createItemRoutes = require('./src/routes/itemRoutes');
const createSettingsRoutes = require('./src/routes/settingsRoutes');
const createProxyRoutes = require('./src/routes/proxyRoutes');

// Proxy Service
const RssProxyService = require('./rss-proxy');

// Middleware
const isAuthenticated = require('./src/middleware/isAuthenticated');
const errorHandler = require('./src/middleware/errorHandler');

// Initialize
const config = new ConfigService();
config.logConfig();

if (!fs.existsSync(config.DATA_DIR)) {
  fs.mkdirSync(config.DATA_DIR, { recursive: true });
}

const db = new DatabaseService();

// Initialize Redis service
const redisService = new RedisService();
const initializeRedis = async () => {
  try {
    debugger;
    await redisService.initialize();
  } catch (error) {
    console.warn('[Server] Redis initialization failed, continuing without cache:', error.message);
  }
};

// Create all components
const userRepository = new UserRepository(db);
const settingsRepository = new SettingsRepository(db);
const feedRepository = new FeedRepository(db);
const itemRepository = new ItemRepository(db);
const authenticationService = new AuthenticationService(userRepository);
const feedDataService = new FeedDataService(feedRepository, config);
const passportService = new PassportService(config, userRepository, feedDataService);
const authController = new AuthController(authenticationService, config, feedRepository, feedDataService, userRepository);
const feedController = new FeedController(feedRepository, userRepository, redisService);
const itemController = new ItemController(itemRepository, feedRepository, redisService);
const settingsController = new SettingsController(settingsRepository);
const rssProxyService = new RssProxyService();
const proxyController = new ProxyController(rssProxyService);

// Bootstrap app
const appBootstrapper = new AppBootstrapper(config, passportService);
const app = appBootstrapper.bootstrap();

// Log startup configuration
console.log('\n========== SERVER STARTUP ==========');
console.log(`NODE_ENV: ${config.NODE_ENV}`);
console.log(`isProduction: ${config.isProduction}`);
console.log(`FRONTEND_URL: ${config.FRONTEND_URL}`);
console.log(`CORS_ORIGINS: ${JSON.stringify(config.CORS_ORIGINS)}`);
console.log(`SESSION_SECRET: ${config.SESSION_SECRET === 'your-secret-key-change-in-production' ? '⚠️ DEFAULT (NOT SECURE)' : '✓ Custom'}`);
console.log(`GOOGLE_CLIENT_ID: ${config.GOOGLE_CLIENT_ID ? '✓ Configured' : '✗ Missing'}`);
console.log(`GOOGLE_CLIENT_SECRET: ${config.GOOGLE_CLIENT_SECRET ? '✓ Configured' : '✗ Missing'}`);
console.log('====================================\n');

// Register routes
createAuthRoutes(app, authController, passportService.getPassport(), isAuthenticated, config);
createFeedRoutes(app, feedController, isAuthenticated);
createItemRoutes(app, itemController, isAuthenticated);
createSettingsRoutes(app, settingsController, isAuthenticated);
createProxyRoutes(app, proxyController);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    redis: {
      enabled: redisService.isEnabled(),
      connected: redisService.isEnabled()
    }
  });
});

// Debug endpoint - check config (development only)
if (!config.isProduction) {
  app.get('/api/debug/config', (req, res) => {
    res.json({
      NODE_ENV: config.NODE_ENV,
      FRONTEND_URL: config.FRONTEND_URL,
      GOOGLE_CLIENT_ID: config.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Missing',
      GOOGLE_CLIENT_SECRET: config.GOOGLE_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
      GOOGLE_CALLBACK_URL: config.GOOGLE_CALLBACK_URL,
      PORT: config.PORT,
      CORS_ORIGINS: config.CORS_ORIGINS
    });
  });
}

// Static files
if (config.isProduction) {
  const distPath = path.join(__dirname, '../dist/rss-reader-app/browser');
  appBootstrapper.setupStaticFiles(distPath);
} else {
  appBootstrapper.setupDevelopmentMode();
}

app.use(errorHandler);

process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down gracefully...');
  await redisService.close();
  db.close();
  process.exit(0);
});

app.listen(config.PORT, '0.0.0.0', () => {
});

// Initialize Redis
initializeRedis().catch(error => {
  console.error('[Server] Failed to initialize Redis:', error);
});

module.exports = app;
