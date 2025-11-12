/**
 * AuthController - Single Responsibility: Handle HTTP requests related to authentication
 * Depends on AuthenticationService (Dependency Injection)
 */
class AuthController {
  constructor(authenticationService, config, feedRepository, feedDataService, userRepository) {
    this.authenticationService = authenticationService;
    this.config = config;
    this.feedRepository = feedRepository;
    this.feedDataService = feedDataService;
    this.userRepository = userRepository;
  }

  /**
   * GET /api/auth/user - Get current authenticated user
   */
  getCurrentUser(req, res) {
    try {
      console.log('[AuthController.getCurrentUser] Session ID:', req.sessionID);
      console.log('[AuthController.getCurrentUser] User:', req.user);
      console.log('[AuthController.getCurrentUser] Cookies:', req.cookies);
      
      if (!req.user) {
        console.warn('[AuthController.getCurrentUser] ⚠️ No user in session');
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      res.json({
        success: true,
        data: {
          id: req.user.id,
          email: req.user.email,
          username: req.user.username,
          createdAt: req.user.created_at
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/auth/logout - Logout user
   */
  logout(req, res) {
    try {
      req.logout((err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err.message
          });
        }
        
        res.json({
          success: true,
          message: 'Logged out successfully'
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/auth/demo - Demo login (for development)
   */
  demoLogin(req, res) {
    try {
      const DEMO_EMAIL = 'demo@example.com';
      
      let demoUserRecord = this.userRepository.findByEmail(DEMO_EMAIL);
      
      // If demo user doesn't exist in database, create it
      if (!demoUserRecord) {
        try {
          console.log('[AuthController] Demo user not found, creating new demo user...');
          this.userRepository.create({
            email: DEMO_EMAIL,
            username: 'Demo User',
            googleId: null
          });
          demoUserRecord = this.userRepository.findByEmail(DEMO_EMAIL);
          console.log(`[AuthController] Demo user created with ID: ${demoUserRecord?.id}`);
        } catch (createError) {
          console.error('[AuthController] Error creating demo user:', createError.message);
          throw createError;
        }
      } else {
        console.log(`[AuthController] Demo user already exists with ID: ${demoUserRecord.id}`);
      }
      
      // Get the numeric user ID from database record
      const demoUserId = demoUserRecord.id;

      // Create session user object with ID from database
      const demoUser = {
        id: demoUserId,
        email: DEMO_EMAIL,
        username: 'Demo User',
        isDemoUser: true,
        created_at: new Date().toISOString()
      };

      // Always check and ensure demo user has feeds
      // This handles cases where database is reset or feeds are deleted
      let existingFeeds = this.feedRepository.getAllFeeds(demoUserId);
      console.log(`[AuthController] Found ${existingFeeds?.length || 0} existing feeds for demo user`);
      
      if (!existingFeeds || existingFeeds.length === 0) {
        console.log('[AuthController] No feeds found, populating initial feeds...');
        const feedsCreated = this.feedDataService.populateInitialFeeds(demoUserId);
        console.log(`[AuthController] Populated ${feedsCreated} initial feeds`);
        
        // Verify feeds were actually created
        existingFeeds = this.feedRepository.getAllFeeds(demoUserId);
        console.log(`[AuthController] Verification: Now have ${existingFeeds?.length || 0} feeds in database`);
        
        if (!existingFeeds || existingFeeds.length === 0) {
          console.error('[AuthController] ❌ CRITICAL: Feeds were not persisted to database!');
        }
      }

      req.login(demoUser, (err) => {
        if (err) {
          console.error('[AuthController] Login error:', err.message);
          const errorUrl = `${this.config.FRONTEND_URL}/?error=demo_login_failed`;
          return res.redirect(errorUrl);
        }

        console.log(`[AuthController] Demo user logged in successfully with ID: ${demoUserId}`);
        // Redirect to frontend /list
        const redirectUrl = `${this.config.FRONTEND_URL}/list`;
        res.redirect(redirectUrl);
      });
    } catch (error) {
      console.error('❌ Error in demoLogin:', error.message);
      const errorUrl = `${this.config.FRONTEND_URL}/?error=demo_login_error`;
      res.redirect(errorUrl);
    }
  }

  /**
   * POST /api/auth/native-app - Authenticate native app user
   */
  authenticateNativeApp(req, res) {
    try {
      const { email, password } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const user = this.authenticationService.authenticateByEmail(email);

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err.message
          });
        }

        res.json({
          success: true,
          message: 'Authentication successful',
          data: user
        });
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle Google OAuth callback (called from routes)
   * Should redirect to frontend after successful authentication
   */
  googleAuthCallback(req, res) {
    try {
      if (!req.user) {
        const errorUrl = `${this.config.FRONTEND_URL}/?error=auth_failed`;
        return res.redirect(errorUrl);
      }

      // Redirect to frontend /list
      const redirectUrl = `${this.config.FRONTEND_URL}/list`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ Error in googleAuthCallback:', error.message);
      const errorUrl = `${this.config.FRONTEND_URL}/?error=auth_error`;
      res.redirect(errorUrl);
    }
  }
}

module.exports = AuthController;
