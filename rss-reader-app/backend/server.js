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
const RssProxyService = require('./rss-proxy');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

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
  origin: isProduction ? false : [
    'http://localhost:4200',
    'http://192.168.100.10:4200',
    'http://127.0.0.1:4200',
    'http://192.168.100.10:3000',  // Allow direct backend calls from WebView
    'http://localhost:3000'         // Local backend
  ],
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
    httpOnly: false, // Allow JavaScript access for native app debugging  
    sameSite: 'lax', // Allow cookie to be sent on OAuth redirects
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: undefined // Don't restrict domain for local development
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';
console.log('Google OAuth Callback URL:', callbackURL);

// Function to populate initial feeds for new users
const populateInitialFeeds = (userId) => {
  const initialFeeds = [
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

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85929E', '#F06292', '#AED581'];

  initialFeeds.forEach((feed, index) => {
    try {
      db.createFeed({
        id: `feed-${Date.now()}-${index}`,
        url: feed.url,
        title: feed.title,
        description: feed.title,
        color: colors[index % colors.length],
        category: feed.category,
        isActive: true,
        addedDate: new Date().toISOString()
      }, userId);
    } catch (error) {
      console.error(`Error creating feed ${feed.title}:`, error.message);
    }
  });

  console.log(`Populated ${initialFeeds.length} initial feeds for new user`);
};

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL
  },
  (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = db.findUserByGoogleId(profile.id);
      let isNewUser = false;
      
      if (!user) {
        // Create new user
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const username = profile.displayName || email;
        const userId = db.createUser(email, username, profile.id);
        user = db.findUserById(userId);
        isNewUser = true;
        
        // Populate initial feeds for new user
        try {
          populateInitialFeeds(user.id);
        } catch (error) {
          console.error('Error populating initial feeds:', error.message);
        }
      }
      
      // Update last login for both new and existing users
      db.updateUserLastLogin(user.id);
      
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
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login` }),
  (req, res) => {
    // Successful authentication, redirect to frontend
    console.log('User authenticated successfully:', req.user);
    console.log('Session ID:', req.sessionID);
    res.redirect(FRONTEND_URL);
  }
);

// Demo login - creates or retrieves demo user with 100 pre-populated feeds
app.get('/api/auth/demo', async (req, res) => {
  try {
    // Get or create demo user
    let demoUser = db.findUserByEmail('demo@rssreader.local');
    let needsFeeds = false;
    
    if (!demoUser) {
      console.log('Creating new demo user...');
      demoUser = db.createUser('demo@rssreader.local', 'Demo User', null);
      needsFeeds = true;
      console.log('Demo user created:', demoUser);
    } else {
      console.log('Demo user found:', demoUser);
      // Check if user has feeds
      const existingFeeds = db.getAllFeeds(demoUser.id);
      console.log(`Demo user has ${existingFeeds ? existingFeeds.length : 0} feeds`);
      if (!existingFeeds || existingFeeds.length === 0) {
        console.log('Demo user exists but has no feeds, populating...');
        needsFeeds = true;
      } else {
        console.log('Demo user already has feeds, skipping population');
      }
    }

    if (needsFeeds) {
      console.log('Starting to populate demo feeds...');
      // Create 100 demo RSS feeds with diverse categories
      const demoFeeds = [
        // Tech & Programming (10)
        { url: 'https://news.ycombinator.com/rss', title: 'Hacker News', category: 'Tech' },
        { url: 'https://www.reddit.com/r/programming/.rss', title: 'r/programming', category: 'Tech' },
        { url: 'https://www.theverge.com/rss/index.xml', title: 'The Verge', category: 'Tech' },
        { url: 'https://techcrunch.com/feed/', title: 'TechCrunch', category: 'Tech' },
        { url: 'https://www.wired.com/feed/rss', title: 'Wired', category: 'Tech' },
        { url: 'https://arstechnica.com/feed/', title: 'Ars Technica', category: 'Tech' },
        { url: 'https://www.engadget.com/rss.xml', title: 'Engadget', category: 'Tech' },
        { url: 'https://www.cnet.com/rss/news/', title: 'CNET News', category: 'Tech' },
        { url: 'https://www.theguardian.com/technology/rss', title: 'Guardian Tech', category: 'Tech' },
        { url: 'https://www.bbc.com/news/technology/rss.xml', title: 'BBC Technology', category: 'Tech' },
        
        // Science (10)
        { url: 'https://www.sciencedaily.com/rss/all.xml', title: 'Science Daily', category: 'Science' },
        { url: 'https://www.nature.com/nature.rss', title: 'Nature', category: 'Science' },
        { url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', title: 'NASA News', category: 'Science' },
        { url: 'https://www.newscientist.com/feed/home', title: 'New Scientist', category: 'Science' },
        { url: 'https://phys.org/rss-feed/', title: 'Phys.org', category: 'Science' },
        { url: 'https://www.space.com/feeds/all', title: 'Space.com', category: 'Science' },
        { url: 'https://www.scientificamerican.com/feed/', title: 'Scientific American', category: 'Science' },
        { url: 'https://www.livescience.com/feeds/all', title: 'Live Science', category: 'Science' },
        { url: 'https://www.sciencemag.org/rss/news_current.xml', title: 'Science Magazine', category: 'Science' },
        { url: 'https://www.popsci.com/feed/', title: 'Popular Science', category: 'Science' },
        
        // News (15)
        { url: 'https://feeds.bbci.co.uk/news/rss.xml', title: 'BBC News', category: 'News' },
        { url: 'https://www.theguardian.com/world/rss', title: 'Guardian World', category: 'News' },
        { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', title: 'NY Times World', category: 'News' },
        { url: 'https://feeds.reuters.com/reuters/topNews', title: 'Reuters Top News', category: 'News' },
        { url: 'https://www.aljazeera.com/xml/rss/all.xml', title: 'Al Jazeera', category: 'News' },
        { url: 'https://rss.cnn.com/rss/edition.rss', title: 'CNN World', category: 'News' },
        { url: 'https://www.npr.org/rss/rss.php?id=1001', title: 'NPR News', category: 'News' },
        { url: 'https://www.politico.com/rss/politicopicks.xml', title: 'Politico', category: 'News' },
        { url: 'https://www.economist.com/the-world-this-week/rss.xml', title: 'The Economist', category: 'News' },
        { url: 'https://www.washingtonpost.com/news/world/?outputType=rss', title: 'Washington Post', category: 'News' },
        { url: 'https://www.ft.com/?format=rss', title: 'Financial Times', category: 'News' },
        { url: 'https://www.usatoday.com/rss/', title: 'USA Today', category: 'News' },
        { url: 'https://www.independent.co.uk/news/rss', title: 'The Independent', category: 'News' },
        { url: 'https://www.telegraph.co.uk/rss.xml', title: 'The Telegraph', category: 'News' },
        { url: 'https://www.foxnews.com/about/rss', title: 'Fox News', category: 'News' },
        
        // Development (12)
        { url: 'https://dev.to/feed', title: 'DEV Community', category: 'Development' },
        { url: 'https://www.smashingmagazine.com/feed', title: 'Smashing Magazine', category: 'Development' },
        { url: 'https://css-tricks.com/feed/', title: 'CSS-Tricks', category: 'Development' },
        { url: 'https://www.freecodecamp.org/news/rss/', title: 'freeCodeCamp', category: 'Development' },
        { url: 'https://stackoverflow.blog/feed/', title: 'Stack Overflow Blog', category: 'Development' },
        { url: 'https://github.blog/feed/', title: 'GitHub Blog', category: 'Development' },
        { url: 'https://medium.com/feed/tag/programming', title: 'Medium Programming', category: 'Development' },
        { url: 'https://www.reddit.com/r/webdev/.rss', title: 'r/webdev', category: 'Development' },
        { url: 'https://tympanus.net/codrops/feed/', title: 'Codrops', category: 'Development' },
        { url: 'https://www.sitepoint.com/feed/', title: 'SitePoint', category: 'Development' },
        { url: 'https://developer.mozilla.org/en-US/blog/rss.xml', title: 'MDN Blog', category: 'Development' },
        { url: 'https://www.reddit.com/r/javascript/.rss', title: 'r/javascript', category: 'Development' },
        
        // Business (10)
        { url: 'https://www.bloomberg.com/feed/podcast/businessweek', title: 'Bloomberg', category: 'Business' },
        { url: 'https://www.forbes.com/business/feed/', title: 'Forbes Business', category: 'Business' },
        { url: 'https://www.businessinsider.com/rss', title: 'Business Insider', category: 'Business' },
        { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', title: 'CNBC', category: 'Business' },
        { url: 'https://hbr.org/feed', title: 'Harvard Business Review', category: 'Business' },
        { url: 'https://www.entrepreneur.com/feed', title: 'Entrepreneur', category: 'Business' },
        { url: 'https://www.fastcompany.com/rss', title: 'Fast Company', category: 'Business' },
        { url: 'https://www.inc.com/rss/', title: 'Inc.com', category: 'Business' },
        { url: 'https://www.marketwatch.com/rss/', title: 'MarketWatch', category: 'Business' },
        { url: 'https://www.wsj.com/xml/rss/3_7085.xml', title: 'Wall Street Journal', category: 'Business' },
        
        // Sports (10)
        { url: 'https://www.espn.com/espn/rss/news', title: 'ESPN', category: 'Sports' },
        { url: 'https://www.bbc.com/sport/rss.xml', title: 'BBC Sport', category: 'Sports' },
        { url: 'https://www.theguardian.com/sport/rss', title: 'Guardian Sport', category: 'Sports' },
        { url: 'https://www.si.com/rss/si_topstories.rss', title: 'Sports Illustrated', category: 'Sports' },
        { url: 'https://bleacherreport.com/articles/feed', title: 'Bleacher Report', category: 'Sports' },
        { url: 'https://www.reddit.com/r/sports/.rss', title: 'r/sports', category: 'Sports' },
        { url: 'https://www.skysports.com/rss/12040', title: 'Sky Sports', category: 'Sports' },
        { url: 'https://www.cbssports.com/rss/headlines/', title: 'CBS Sports', category: 'Sports' },
        { url: 'https://www.foxsports.com/rss', title: 'Fox Sports', category: 'Sports' },
        { url: 'https://www.nfl.com/feeds/rss/news', title: 'NFL News', category: 'Sports' },
        
        // Entertainment (10)
        { url: 'https://www.ign.com/feed.rss', title: 'IGN', category: 'Entertainment' },
        { url: 'https://www.polygon.com/rss/index.xml', title: 'Polygon', category: 'Entertainment' },
        { url: 'https://www.reddit.com/r/movies/.rss', title: 'r/movies', category: 'Entertainment' },
        { url: 'https://www.hollywoodreporter.com/feed/', title: 'Hollywood Reporter', category: 'Entertainment' },
        { url: 'https://variety.com/feed/', title: 'Variety', category: 'Entertainment' },
        { url: 'https://ew.com/feed/', title: 'Entertainment Weekly', category: 'Entertainment' },
        { url: 'https://www.imdb.com/news/rss/', title: 'IMDb News', category: 'Entertainment' },
        { url: 'https://www.rollingstone.com/feed/', title: 'Rolling Stone', category: 'Entertainment' },
        { url: 'https://pitchfork.com/rss/', title: 'Pitchfork', category: 'Entertainment' },
        { url: 'https://www.reddit.com/r/gaming/.rss', title: 'r/gaming', category: 'Entertainment' },
        
        // Lifestyle (8)
        { url: 'https://www.lifehacker.com/rss', title: 'Lifehacker', category: 'Lifestyle' },
        { url: 'https://www.buzzfeed.com/index.xml', title: 'BuzzFeed', category: 'Lifestyle' },
        { url: 'https://www.reddit.com/r/LifeProTips/.rss', title: 'r/LifeProTips', category: 'Lifestyle' },
        { url: 'https://www.apartmenttherapy.com/main.rss', title: 'Apartment Therapy', category: 'Lifestyle' },
        { url: 'https://www.bonappetit.com/feed/rss', title: 'Bon Appétit', category: 'Lifestyle' },
        { url: 'https://www.seriouseats.com/feeds/latest', title: 'Serious Eats', category: 'Lifestyle' },
        { url: 'https://www.thekitchn.com/main.rss', title: 'The Kitchn', category: 'Lifestyle' },
        { url: 'https://www.gq.com/feed/rss', title: 'GQ', category: 'Lifestyle' },
        
        // Design (8)
        { url: 'https://www.behance.net/feeds/projects', title: 'Behance', category: 'Design' },
        { url: 'https://dribbble.com/stories.rss', title: 'Dribbble', category: 'Design' },
        { url: 'https://www.awwwards.com/blog/feed/', title: 'Awwwards', category: 'Design' },
        { url: 'https://abduzeedo.com/rss.xml', title: 'Abduzeedo', category: 'Design' },
        { url: 'https://www.creativebloq.com/feed', title: 'Creative Bloq', category: 'Design' },
        { url: 'https://www.designboom.com/feed/', title: 'Designboom', category: 'Design' },
        { url: 'https://www.dezeen.com/feed/', title: 'Dezeen', category: 'Design' },
        { url: 'https://www.fastcodesign.com/rss.xml', title: 'Fast Co.Design', category: 'Design' },
        
        // Machine Learning (7)
        { url: 'https://www.reddit.com/r/MachineLearning/.rss', title: 'r/MachineLearning', category: 'AI & ML' },
        { url: 'https://deepmind.com/blog/feed/basic/', title: 'DeepMind', category: 'AI & ML' },
        { url: 'https://openai.com/blog/rss/', title: 'OpenAI Blog', category: 'AI & ML' },
        { url: 'https://www.technologyreview.com/feed/', title: 'MIT Tech Review', category: 'AI & ML' },
        { url: 'https://blog.google/technology/ai/rss/', title: 'Google AI Blog', category: 'AI & ML' },
        { url: 'https://www.reddit.com/r/artificial/.rss', title: 'r/artificial', category: 'AI & ML' },
        { url: 'https://ai.googleblog.com/feeds/posts/default', title: 'Google AI Research', category: 'AI & ML' },
        
        // YouTube Channels (5) - Using official YouTube RSS feeds
        { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCXuqSBlHAE6Xw-yeJA7Pur0', title: 'Linus Tech Tips', category: 'YouTube' },
        { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ', title: 'MKBHD - Marques Brownlee', category: 'YouTube' },
        { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCJ1X_WBt-7DW-yEtNpamZZw', title: 'ElectroBOOM', category: 'YouTube' },
        { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCGiLAlstWyxwNZ5JwHikwNQ', title: 'Veritasium', category: 'YouTube' },
        { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCYO_jab_esuFRV4b-r-ccEw', title: '3Blue1Brown', category: 'YouTube' },
      ];

      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85929E', '#F06292', '#AED581'];

      // Create feeds for demo user
      demoFeeds.forEach((feed, index) => {
        const feedId = `demo-feed-${Date.now()}-${index}`;
        const color = colors[index % colors.length];
        
        try {
          db.createFeed({
            id: feedId,
            url: feed.url,
            title: feed.title,
            description: `Demo feed: ${feed.title}`,
            color: color,
            category: feed.category,
            isActive: true,
            addedDate: new Date().toISOString()
          }, demoUser.id);
        } catch (error) {
          console.error(`Error creating feed ${feed.title}:`, error.message);
        }
      });

      console.log(`Created demo user with ${demoFeeds.length} feeds`);
      console.log('Note: Demo feeds created. User should refresh feeds to fetch items.');
    } // End of if (needsFeeds)

    // Update last login for demo user
    try {
      db.updateUserLastLogin(demoUser.id);
      console.log('Updated last login for demo user');
    } catch (error) {
      console.error('Error updating last login:', error);
    }

    // Create session for demo user
    req.login(demoUser, (err) => {
      if (err) {
        console.error('Demo login error:', err);
        return res.redirect(`${FRONTEND_URL}/login?error=demo_failed`);
      }
      console.log('Demo user logged in successfully:', demoUser.email);
      
      // Save session before redirecting
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error:', saveErr);
          return res.redirect(`${FRONTEND_URL}/login?error=session_failed`);
        }
        console.log('Session saved, redirecting to frontend');
        res.redirect(FRONTEND_URL);
      });
    });
  } catch (error) {
    console.error('Error in demo login:', error);
    res.redirect(`${FRONTEND_URL}/login?error=demo_failed`);
  }
});

// ==================== ANDROID APP AUTHENTICATION ====================

/**
 * Endpoint for Android app to authenticate using Google ID token
 * Android app should POST: { email, idToken }
 */
app.post('/api/auth/native-app', async (req, res) => {
  try {
    const { email, idToken } = req.body;

    console.log('[Native App Auth] Received authentication request for:', email);

    if (!email || !idToken) {
      return res.status(400).json({ error: 'Email and idToken are required' });
    }

    // For now, we'll trust the token from the Android app
    // In production, you should verify the Google ID token here using google-auth-library
    // const { OAuth2Client } = require('google-auth-library');
    // const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    // const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });

    // Check if user exists in database, create if not
    let user = db.findUserByEmail(email);
    
    if (!user) {
      console.log('[Native App Auth] Creating new user:', email);
      const username = email.split('@')[0];
      const userId = db.createUser(email, username);
      user = db.findUserById(userId);
    }

    console.log('[Native App Auth] User found/created:', user);

    // Create session for the user
    req.login(user, (err) => {
      if (err) {
        console.error('[Native App Auth] Error creating session:', err);
        return res.status(500).json({ error: 'Failed to create session' });
      }

      console.log('[Native App Auth] Session created successfully');
      console.log('[Native App Auth] Session ID:', req.sessionID);
      console.log('[Native App Auth] User authenticated:', req.isAuthenticated());
      
      // Force session save
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('[Native App Auth] Error saving session:', saveErr);
        }
        
        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            username: user.username
          }
        });
      });
    });

  } catch (error) {
    console.error('[Native App Auth] Error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

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
          let redirectUrl = response.headers.location;
          
          // Handle relative URLs
          if (redirectUrl && !redirectUrl.startsWith('http')) {
            const urlObj = new URL(url);
            redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl.startsWith('/') ? '' : '/'}${redirectUrl}`;
          }
          
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

// Get saved items
app.get('/api/items/saved', isAuthenticated, (req, res) => {
  try {
    const items = db.getSavedItems(req.user.id);
    const convertedItems = items.map(i => db.convertItemFromDb(i));
    res.json(convertedItems);
  } catch (error) {
    console.error('Error fetching saved items:', error);
    res.status(500).json({ error: 'Failed to fetch saved items' });
  }
});

// Delete old items (older than 30 days)
app.post('/api/items/cleanup-old', isAuthenticated, (req, res) => {
  try {
    const deletedCount = db.deleteOldItems(req.user.id);
    res.status(200).json({ success: true, deletedCount });
  } catch (error) {
    console.error('Error cleaning up old items:', error);
    res.status(500).json({ error: 'Failed to cleanup old items' });
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

// ==================== EXPORT/IMPORT DATA ====================

// Export user's feeds and items as XML
app.get('/api/export', isAuthenticated, (req, res) => {
  try {
    const feeds = db.getAllFeeds(req.user.id);
    const items = db.getAllItems(req.user.id);
    const settings = db.getUserSettings(req.user.id);
    
    // Create XML structure
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rss-reader-backup>\n';
    xml += '  <export-date>' + new Date().toISOString() + '</export-date>\n';
    xml += '  <user-email>' + escapeXml(req.user.email) + '</user-email>\n';
    
    // Export settings
    xml += '  <settings>\n';
    xml += '    <font>' + escapeXml(settings.font) + '</font>\n';
    xml += '    <show-left-menu>' + settings.showLeftMenu + '</show-left-menu>\n';
    xml += '    <show-feed-images>' + settings.showFeedImages + '</show-feed-images>\n';
    xml += '    <header-color>' + escapeXml(settings.headerColor) + '</header-color>\n';
    xml += '  </settings>\n';
    
    // Export feeds
    xml += '  <feeds>\n';
    feeds.forEach(feed => {
      xml += '    <feed>\n';
      xml += '      <id>' + escapeXml(feed.id) + '</id>\n';
      xml += '      <url>' + escapeXml(feed.url) + '</url>\n';
      xml += '      <title>' + escapeXml(feed.title) + '</title>\n';
      xml += '      <description>' + escapeXml(feed.description || '') + '</description>\n';
      xml += '      <color>' + escapeXml(feed.color) + '</color>\n';
      xml += '      <category>' + escapeXml(feed.category || '') + '</category>\n';
      xml += '      <is-active>' + feed.isActive + '</is-active>\n';
      xml += '      <added-date>' + escapeXml(feed.addedDate || '') + '</added-date>\n';
      xml += '    </feed>\n';
    });
    xml += '  </feeds>\n';
    
    // Export items (read status)
    xml += '  <items>\n';
    items.forEach(item => {
      xml += '    <item>\n';
      xml += '      <feed-id>' + escapeXml(item.feedId) + '</feed-id>\n';
      xml += '      <title>' + escapeXml(item.title) + '</title>\n';
      xml += '      <link>' + escapeXml(item.link) + '</link>\n';
      xml += '      <is-read>' + item.isRead + '</is-read>\n';
      xml += '      <pub-date>' + escapeXml(item.pubDate || '') + '</pub-date>\n';
      xml += '    </item>\n';
    });
    xml += '  </items>\n';
    
    xml += '</rss-reader-backup>';
    
    // Send as downloadable file
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="rss-reader-backup-${Date.now()}.xml"`);
    res.send(xml);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Import user's feeds and items from XML
app.post('/api/import', isAuthenticated, (req, res) => {
  try {
    const xmlData = req.body.xmlData;
    
    if (!xmlData) {
      return res.status(400).json({ error: 'No XML data provided' });
    }
    
    // Parse XML (simple parsing for our specific format)
    const parseXmlValue = (xml, tag) => {
      const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
      const match = xml.match(regex);
      return match ? match[1].trim() : null;
    };
    
    const parseXmlBoolean = (xml, tag) => {
      const value = parseXmlValue(xml, tag);
      return value === 'true' || value === '1';
    };
    
    const parseXmlArray = (xml, containerTag, itemTag) => {
      const containerRegex = new RegExp(`<${containerTag}>(.*?)</${containerTag}>`, 's');
      const containerMatch = xml.match(containerRegex);
      if (!containerMatch) return [];
      
      const itemsXml = containerMatch[1];
      const itemRegex = new RegExp(`<${itemTag}>(.*?)</${itemTag}>`, 'gs');
      const items = [];
      let match;
      
      while ((match = itemRegex.exec(itemsXml)) !== null) {
        items.push(match[1]);
      }
      
      return items;
    };
    
    // Delete all existing data for this user
    db.deleteAllUserData(req.user.id);
    
    // Import settings
    const settingsXml = parseXmlValue(xmlData, 'settings');
    if (settingsXml) {
      const settings = {
        font: parseXmlValue(settingsXml, 'font') || 'default',
        showLeftMenu: parseXmlBoolean(settingsXml, 'show-left-menu'),
        showFeedImages: parseXmlBoolean(settingsXml, 'show-feed-images'),
        headerColor: parseXmlValue(settingsXml, 'header-color') || 'purple'
      };
      db.updateUserSettings(req.user.id, settings);
    }
    
    // Import feeds
    const feedsXml = parseXmlArray(xmlData, 'feeds', 'feed');
    const feedMap = new Map(); // Map old feed IDs to new ones
    
    feedsXml.forEach(feedXml => {
      const oldId = parseXmlValue(feedXml, 'id');
      const newId = `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const feed = {
        id: newId,
        url: parseXmlValue(feedXml, 'url'),
        title: parseXmlValue(feedXml, 'title'),
        description: parseXmlValue(feedXml, 'description'),
        color: parseXmlValue(feedXml, 'color'),
        category: parseXmlValue(feedXml, 'category'),
        isActive: parseXmlBoolean(feedXml, 'is-active'),
        addedDate: parseXmlValue(feedXml, 'added-date') || new Date().toISOString()
      };
      
      db.createFeed(feed, req.user.id);
      feedMap.set(oldId, newId);
    });
    
    // Import items
    const itemsXml = parseXmlArray(xmlData, 'items', 'item');
    itemsXml.forEach(itemXml => {
      const oldFeedId = parseXmlValue(itemXml, 'feed-id');
      const newFeedId = feedMap.get(oldFeedId);
      
      if (newFeedId) {
        const item = {
          feedId: newFeedId,
          title: parseXmlValue(itemXml, 'title'),
          link: parseXmlValue(itemXml, 'link'),
          description: '',
          pubDate: parseXmlValue(itemXml, 'pub-date'),
          isRead: parseXmlBoolean(itemXml, 'is-read')
        };
        
        try {
          db.addItem(req.user.id, item);
        } catch (err) {
          // Ignore duplicate items
          console.log('Skipping duplicate item:', item.link);
        }
      }
    });
    
    res.json({ 
      success: true, 
      feedsImported: feedsXml.length,
      itemsImported: itemsXml.length
    });
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ error: 'Failed to import data: ' + error.message });
  }
});

// Helper function to escape XML special characters
function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ==================== HEALTH CHECK ====================

app.get('/api/proxy/feed', async (req, res) => {
  try {
    const { url, format = 'rss' } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log(`[RSS Proxy] Processing URL: ${url} (Format: ${format})`);

    const proxy = new RssProxyService();

    // Check if it's already a standard feed
    const isStandard = await proxy.isStandardFeed(url);

    if (isStandard) {
      console.log(`[RSS Proxy] URL is a standard feed, passing through directly`);
      // For standard feeds, fetch and return as-is
      const response = await require('axios').get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });
      res.type(format === 'json' ? 'application/json' : 'application/rss+xml').send(response.data);
    } else {
      console.log(`[RSS Proxy] URL is not a standard feed, converting HTML...`);
      // Try to detect a feed URL first
      const feedUrl = await proxy.detectFeedUrl(url);
      
      if (feedUrl && feedUrl !== url) {
        console.log(`[RSS Proxy] Found feed URL: ${feedUrl}`);
        const response = await require('axios').get(feedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 15000
        });
        return res.type(format === 'json' ? 'application/json' : 'application/rss+xml').send(response.data);
      }

      // Convert HTML to RSS/JSON feed
      const rssFeed = await proxy.convertHtmlToRss(url);
      
      if (format === 'json') {
        const $ = require('cheerio').load(rssFeed);
        const articles = [];
        $('item').each((i, elem) => {
          articles.push({
            title: $(elem).find('title').text(),
            link: $(elem).find('link').text(),
            description: $(elem).find('description').text(),
            pubDate: $(elem).find('pubDate').text(),
            author: $(elem).find('author').text()
          });
        });
        const title = $('channel > title').text();
        const jsonFeed = proxy.generateJsonFeed(title, url, articles);
        res.type('application/json').json(jsonFeed);
      } else {
        res.type('application/rss+xml').send(rssFeed);
      }
    }
  } catch (error) {
    console.error('[RSS Proxy] Error processing URL:', error.message);
    res.status(500).json({ 
      error: 'Failed to convert to RSS feed',
      message: error.message 
    });
  }
});

// Test endpoint to check if URL can be converted
app.get('/api/proxy/test', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const proxy = new RssProxyService();
    const isStandard = await proxy.isStandardFeed(url);
    const feedUrl = isStandard ? url : await proxy.detectFeedUrl(url);

    res.json({
      url,
      isStandardFeed: isStandard,
      detectedFeedUrl: feedUrl,
      canConvert: !isStandard
    });
  } catch (error) {
    console.error('[RSS Proxy] Error testing URL:', error.message);
    res.status(500).json({ 
      error: 'Failed to test URL',
      message: error.message 
    });
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
} else {
  // In development, redirect non-API routes to Angular dev server
  app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // For Angular routes, send a helpful message
    res.status(404).send(`
      <html>
        <head><title>Development Mode</title></head>
        <body>
          <h1>RSS Reader - Development Mode</h1>
          <p>Backend is running on port 3000.</p>
          <p><strong>Please access the application at: <a href="http://localhost:4200">http://localhost:4200</a></strong></p>
          <p>The Angular development server serves the frontend on port 4200.</p>
        </body>
      </html>
    `);
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

// Start server - bind to 0.0.0.0 for Docker
app.listen(PORT, '0.0.0.0', () => {
  console.log(`RSS Reader Backend running on http://0.0.0.0:${PORT}`);
  console.log(`Database location: ${path.join(dataDir, 'rss-reader.db')}`);
});

module.exports = app;
