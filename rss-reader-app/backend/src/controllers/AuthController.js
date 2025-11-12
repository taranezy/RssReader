/**
 * AuthController - Single Responsibility: Handle HTTP requests related to authentication
 * Depends on AuthenticationService (Dependency Injection)
 */
class AuthController {
  constructor(authenticationService, config, feedRepository, feedDataService) {
    this.authenticationService = authenticationService;
    this.config = config;
    this.feedRepository = feedRepository;
    this.feedDataService = feedDataService;
  }

  /**
   * GET /api/auth/user - Get current authenticated user
   */
  getCurrentUser(req, res) {
    try {
      if (!req.user) {
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
      const demoUser = {
        id: 'demo-user',
        email: 'demo@example.com',
        username: 'Demo User',
        created_at: new Date().toISOString()
      };

      // Check if demo user has feeds, if not populate them
      const existingFeeds = this.feedRepository.getAllFeeds('demo-user');
      if (!existingFeeds || existingFeeds.length === 0) {
        this.feedDataService.populateInitialFeeds('demo-user');
      }

      req.login(demoUser, (err) => {
        if (err) {
          const errorUrl = `${this.config.FRONTEND_URL}/?error=demo_login_failed`;
          return res.redirect(errorUrl);
        }

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
