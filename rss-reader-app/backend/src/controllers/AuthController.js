/**
 * AuthController - Single Responsibility: Handle HTTP requests related to authentication
 * Depends on AuthenticationService (Dependency Injection)
 */
class AuthController {
  constructor(authenticationService) {
    this.authenticationService = authenticationService;
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

      req.login(demoUser, (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err.message
          });
        }

        res.json({
          success: true,
          message: 'Demo login successful',
          data: {
            id: demoUser.id,
            email: demoUser.email,
            username: demoUser.username
          }
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
   */
  googleAuthCallback(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Google authentication failed'
        });
      }

      res.json({
        success: true,
        message: 'Google authentication successful',
        data: req.user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = AuthController;
