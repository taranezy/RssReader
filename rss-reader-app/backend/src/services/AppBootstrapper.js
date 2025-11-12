/**
 * AppBootstrapper.js
 * Responsibility: Orchestrate application initialization and setup
 * SOLID: Single Responsibility - only orchestrates setup, delegates to services
 * Dependency Injection: All dependencies passed in constructor
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const fs = require('fs');

class AppBootstrapper {
  constructor(config, passportService) {
    this.config = config;
    this.passportService = passportService;
    this.app = express();
  }

  /**
   * Execute complete application bootstrap sequence
   */
  bootstrap() {
    this.ensureDataDirectory();
    this.setupMiddleware();
    this.setupAuthentication();
    return this.app;
  }

  /**
   * Ensure data directory exists
   */
  ensureDataDirectory() {
    if (!fs.existsSync(this.config.DATA_DIR)) {
      fs.mkdirSync(this.config.DATA_DIR, { recursive: true });
    }
  }

  /**
   * Setup all Express middleware
   */
  setupMiddleware() {
    // Trust proxy - CRITICAL for secure cookies behind reverse proxy
    // Allows express to trust X-Forwarded-* headers from nginx
    this.app.set('trust proxy', 1);
    
    // Request logging
    this.app.use(this.loggerMiddleware());

    // CORS - with dynamic origin checking
    const corsOptions = {
      origin: (origin, callback) => {
        const allowedOrigins = this.config.CORS_ORIGINS;
        
        // Allow requests with no origin (mobile apps, curl requests)
        if (!origin) {
          return callback(null, true);
        }
        
        // Check if origin is in allowed list
        const isAllowed = allowedOrigins.includes(origin);
        
        if (isAllowed) {
          callback(null, true);
        } else {
          console.warn(`[CORS] Rejected origin: ${origin}`);
          console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      optionsSuccessStatus: 200
    };
    
    this.app.use(cors(corsOptions));

    // Body parsing
    this.app.use(bodyParser.json({ limit: this.config.BODY_PARSER_LIMIT }));
    this.app.use(bodyParser.urlencoded({ extended: true, limit: this.config.BODY_PARSER_LIMIT }));
    this.app.use(cookieParser());

    // Session
    let cookieDomain = undefined;
    let cookieSecure = this.config.isProduction;
    
    if (this.config.isProduction && this.config.FRONTEND_URL) {
      try {
        const url = new URL(this.config.FRONTEND_URL);
        cookieDomain = url.hostname;
        cookieSecure = url.protocol === 'https:';
      } catch (err) {
        console.warn('[AppBootstrapper] Warning: Could not parse FRONTEND_URL for cookie domain:', err.message);
      }
    }

    const sessionCookieConfig = {
      secure: cookieSecure,
      httpOnly: true,  // CRITICAL: Must be true for security
      sameSite: 'lax',
      maxAge: this.config.SESSION_MAX_AGE,
      path: '/',
      ...(cookieDomain && { domain: cookieDomain })
    };

    console.log('[AppBootstrapper] Session cookie config:', sessionCookieConfig);
    
    this.app.use(session({
      secret: this.config.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      cookie: sessionCookieConfig
    }));

    // Debug middleware - log session info
    this.app.use((req, res, next) => {
      if (req.path.startsWith('/api/')) {
        console.log(`[Session] ${req.method} ${req.path}:`);
        console.log(`  - SessionID: ${req.sessionID}`);
        console.log(`  - User: ${req.user ? req.user.email || req.user.id : 'none'}`);
        console.log(`  - Cookies: ${Object.keys(req.cookies).join(', ') || 'none'}`);
      }
      next();
    });
  }

  /**
   * Setup Passport authentication
   */
  setupAuthentication() {
    this.passportService.initialize();

    this.app.use(passport.initialize());
    this.app.use(passport.session());

  }

  /**
   * Register routes with controllers
   */
  registerRoutes(routeFactory) {
    routeFactory(this.app);
  }

  /**
   * Register error handling middleware
   */
  registerErrorHandler(errorMiddleware) {
    this.app.use(errorMiddleware);
  }

  /**
   * Setup static file serving
   */
  setupStaticFiles(distPath) {
    this.app.use(express.static(distPath));
    this.app.use((req, res) => {
      res.sendFile(distPath + '/index.html');
    });
  }

  /**
   * Setup development mode (Angular routing redirect)
   */
  setupDevelopmentMode() {
    this.app.use((req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.status(404).send(`
        <html>
          <head><title>Development Mode</title></head>
          <body>
            <h1>RSS Reader - Development Mode</h1>
            <p>Backend is running on port ${this.config.PORT}.</p>
            <p><strong>Please access the application at: <a href="${this.config.FRONTEND_URL}">${this.config.FRONTEND_URL}</a></strong></p>
            <p>The Angular development server serves the frontend on port 4200.</p>
          </body>
        </html>
      `);
    });
  }

  /**
   * Get the Express app instance
   */
  getApp() {
    return this.app;
  }

  /**
   * Simple request logger middleware
   */
  loggerMiddleware() {
    return (req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
      });
      next();
    };
  }
}

module.exports = AppBootstrapper;
