/**
 * PassportService.js
 * Responsibility: Encapsulate all Passport OAuth strategy setup and serialization
 * SOLID: Single Responsibility - handles authentication strategy configuration only
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

class PassportService {
  constructor(config, userRepository, feedDataService) {
    this.config = config;
    this.userRepository = userRepository;
    this.feedDataService = feedDataService;
  }

  /**
   * Initialize Passport with Google OAuth strategy
   */
  initialize() {
    this.setupGoogleStrategy();
    this.setupSerialization();
  }

  /**
   * Setup Google OAuth Strategy
   * Handles user creation and login via Google
   */
  setupGoogleStrategy() {
    // Only setup if credentials are present
    if (!this.config.GOOGLE_CLIENT_ID || !this.config.GOOGLE_CLIENT_SECRET) {
      console.warn('⚠️  Google OAuth credentials not configured. Google login will be unavailable.');
      return;
    }

    passport.use(
      new GoogleStrategy(
        {
          clientID: this.config.GOOGLE_CLIENT_ID,
          clientSecret: this.config.GOOGLE_CLIENT_SECRET,
          callbackURL: this.config.GOOGLE_CALLBACK_URL
        },
        (accessToken, refreshToken, profile, done) => {
          try {
            let user = this.userRepository.findByGoogleId(profile.id);
            let isNewUser = false;

            if (!user) {
              // Create new user
              const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
              const username = profile.displayName || email;

              const result = this.userRepository.create({
                email,
                username,
                googleId: profile.id
              });

              user = this.userRepository.findById(result.lastInsertRowid);
              isNewUser = true;

              // Populate initial feeds
              try {
                this.feedDataService.populateInitialFeeds(user.id);
              } catch (error) {
                console.error('❌ Error populating initial feeds:', error.message);
              }
            }

            // Update last login
            this.userRepository.updateLastLogin(user.id);
            return done(null, user);
          } catch (error) {
            console.error('❌ Google OAuth error:', error);
            return done(error, null);
          }
        }
      )
    );
  }

  /**
   * Setup Passport serialization
   * Determines what user data to store in session
   */
  setupSerialization() {
    // Store reference to 'this' for use in arrow functions
    const userRepository = this.userRepository;

    passport.serializeUser((user, done) => {
      done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
      try {
        
        // For demo user, return the demo object directly
        if (id === 'demo-user') {
          return done(null, {
            id: 'demo-user',
            email: 'demo@example.com',
            username: 'Demo User',
            created_at: new Date().toISOString()
          });
        }

        // For real users, fetch from database
        if (!id) {
          return done(null, false);
        }

        const user = userRepository.findById(id);
        
        if (!user) {
          return done(null, false);
        }

        done(null, user);
      } catch (error) {
        console.error('❌ Deserialization error:', error.message);
        // Don't pass the error, just return false
        done(null, false);
      }
    });
  }

  /**
   * Get configured Passport instance
   */
  getPassport() {
    return passport;
  }
}

module.exports = PassportService;
