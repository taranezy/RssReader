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

const DatabaseService = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new DatabaseService();

// Middleware
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: isProduction ? false : 'http://localhost:4200',
  credentials: true
}));
// Increase body parser limit to handle feed items with images
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    sameSite: 'lax', // Allow cookie to be sent on OAuth redirects
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback'
  },
  (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = db.findUserByGoogleId(profile.id);
      
      if (!user) {
        // Create new user
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const username = profile.displayName || email;
        const userId = db.createUser(email, username, profile.id);
        user = db.findUserById(userId);
      } else {
        // Update last login
        db.updateUserLastLogin(user.id);
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser((id, done) => {
  try {
    const user = db.findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== AUTH ENDPOINTS ====================

// Google OAuth login
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:4200/login' }),
  (req, res) => {
    // Successful authentication, redirect to frontend
    console.log('User authenticated successfully:', req.user);
    console.log('Session ID:', req.sessionID);
    res.redirect('http://localhost:4200');
  }
);

// Get current user
app.get('/api/auth/user', (req, res) => {
  console.log('Auth check - Session ID:', req.sessionID, 'Authenticated:', req.isAuthenticated());
  if (req.isAuthenticated()) {
    console.log('Returning user:', req.user);
    res.json({
      id: req.user.id,
      email: req.user.email,
      username: req.user.username
    });
  } else {
    console.log('User not authenticated');
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// ==================== CORS PROXY ENDPOINT ====================

// CORS Proxy for fetching RSS feeds
app.get('/api/proxy/fetch-feed', isAuthenticated, async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate URL
    let feedUrl;
    try {
      feedUrl = new URL(url);
      if (!['http:', 'https:'].includes(feedUrl.protocol)) {
        return res.status(400).json({ error: 'Invalid URL protocol. Only http and https are allowed.' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log(`Fetching RSS feed from: ${url}`);

    // Use Node.js native fetch (available in Node 18+) or require node-fetch
    const https = require('https');
    const http = require('http');
    
    const client = feedUrl.protocol === 'https:' ? https : http;

    const fetchPromise = new Promise((resolve, reject) => {
      const request = client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*'
        },
        timeout: 15000 // 15 second timeout
      }, (response) => {
        let data = '';

        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          console.log(`Following redirect to: ${redirectUrl}`);
          
          // Recursive call for redirect
          const redirectClient = redirectUrl.startsWith('https') ? https : http;
          redirectClient.get(redirectUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*'
            }
          }, (redirectResponse) => {
            let redirectData = '';
            redirectResponse.on('data', chunk => redirectData += chunk);
            redirectResponse.on('end', () => resolve({ data: redirectData, statusCode: redirectResponse.statusCode }));
          }).on('error', reject);
          return;
        }

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          resolve({ data, statusCode: response.statusCode });
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    const { data, statusCode } = await fetchPromise;

    if (statusCode >= 400) {
      return res.status(statusCode).json({ error: `Feed server returned status ${statusCode}` });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(data);

  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    res.status(500).json({ 
      error: 'Failed to fetch RSS feed',
      message: error.message 
    });
  }
});

// ==================== FEEDS ENDPOINTS ====================

// Get all feeds
app.get('/api/feeds', isAuthenticated, (req, res) => {
  try {
    const feeds = db.getAllFeeds(req.user.id);
    const convertedFeeds = feeds.map(f => db.convertFeedFromDb(f));
    res.json(convertedFeeds);
  } catch (error) {
    console.error('Error getting feeds:', error);
    res.status(500).json({ error: 'Failed to get feeds' });
  }
});

// Get single feed
app.get('/api/feeds/:id', isAuthenticated, (req, res) => {
  try {
    const feed = db.getFeedById(req.params.id, req.user.id);
    if (!feed) {
      return res.status(404).json({ error: 'Feed not found' });
    }
    res.json(db.convertFeedFromDb(feed));
  } catch (error) {
    console.error('Error getting feed:', error);
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

// Create feed
app.post('/api/feeds', isAuthenticated, (req, res) => {
  try {
    const feed = req.body;
    db.createFeed(feed, req.user.id);
    res.status(201).json(feed);
  } catch (error) {
    console.error('Error creating feed:', error);
    if (error.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ error: 'Feed URL already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create feed' });
    }
  }
});

// Update feed
app.put('/api/feeds/:id', isAuthenticated, (req, res) => {
  try {
    const updates = req.body;
    db.updateFeed(req.params.id, req.user.id, updates);
    const updatedFeed = db.getFeedById(req.params.id, req.user.id);
    res.json(db.convertFeedFromDb(updatedFeed));
  } catch (error) {
    console.error('Error updating feed:', error);
    res.status(500).json({ error: 'Failed to update feed' });
  }
});

// Delete feed
app.delete('/api/feeds/:id', isAuthenticated, (req, res) => {
  try {
    db.deleteFeed(req.params.id, req.user.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting feed:', error);
    res.status(500).json({ error: 'Failed to delete feed' });
  }
});

// ==================== ITEMS ENDPOINTS ====================

// Get all items
app.get('/api/items', isAuthenticated, (req, res) => {
  try {
    const items = db.getAllItems(req.user.id);
    const convertedItems = items.map(i => db.convertItemFromDb(i));
    res.json(convertedItems);
  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).json({ error: 'Failed to get items' });
  }
});

// Get items by feed
app.get('/api/feeds/:feedId/items', isAuthenticated, (req, res) => {
  try {
    const items = db.getItemsByFeed(req.params.feedId, req.user.id);
    const convertedItems = items.map(i => db.convertItemFromDb(i));
    res.json(convertedItems);
  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).json({ error: 'Failed to get items' });
  }
});

// Create single item
app.post('/api/items', isAuthenticated, (req, res) => {
  try {
    const item = req.body;
    db.createItem(item, req.user.id);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Create multiple items (bulk insert)
app.post('/api/items/bulk', isAuthenticated, (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Expected an array of items' });
    }
    db.createItems(items, req.user.id);
    res.status(201).json({ created: items.length });
  } catch (error) {
    console.error('Error creating items:', error);
    res.status(500).json({ error: 'Failed to create items' });
  }
});

// Update item
app.put('/api/items/:id', isAuthenticated, (req, res) => {
  try {
    const updates = req.body;
    db.updateItem(req.params.id, req.user.id, updates);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Mark all as read
app.post('/api/items/mark-all-read', isAuthenticated, (req, res) => {
  try {
    const { feedId } = req.body;
    db.markAllAsRead(req.user.id, feedId || null);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking items as read:', error);
    res.status(500).json({ error: 'Failed to mark items as read' });
  }
});

// ==================== PREFERENCES ENDPOINTS ====================

// Get preferences
app.get('/api/preferences', isAuthenticated, (req, res) => {
  try {
    const preferences = db.getPreferences(req.user.id);
    res.json(preferences || {
      viewType: 'list',
      selectedFeeds: [],
      showOnlyUnread: false
    });
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update preferences
app.put('/api/preferences', isAuthenticated, (req, res) => {
  try {
    const preferences = req.body;
    db.updatePreferences(req.user.id, preferences);
    res.json(preferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// ==================== USER SETTINGS ENDPOINTS ====================

// Get user settings
app.get('/api/user-settings', isAuthenticated, (req, res) => {
  try {
    const settings = db.getUserSettings(req.user.id);
    res.json(settings);
  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({ error: 'Failed to get user settings' });
  }
});

// Update user settings
app.put('/api/user-settings', isAuthenticated, (req, res) => {
  try {
    const settings = req.body;
    db.updateUserSettings(req.user.id, settings);
    res.json(settings);
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from Angular build in production
if (isProduction) {
  const distPath = path.join(__dirname, '../dist/rss-reader-app/browser');
  app.use(express.static(distPath));
  
  // Serve index.html for all other routes (Angular routing)
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`RSS Reader Backend running on http://localhost:${PORT}`);
  console.log(`Database location: ${path.join(dataDir, 'rss-reader.db')}`);
});

module.exports = app;
