/**
 * Auth Routes - Single Responsibility: Route all authentication-related endpoints
 * Depends on AuthController and Middleware (Dependency Injection)
 */
module.exports = function createAuthRoutes(app, authController, passport, isAuthenticated, config) {
  
  /**
   * GET /api/auth/google - Start Google OAuth flow
   */
  app.get('/api/auth/google', (req, res, next) => {
    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(503).json({
        success: false,
        error: 'Google OAuth not configured',
        message: 'Google OAuth credentials are missing. Please contact the administrator.',
        code: 'OAUTH_NOT_CONFIGURED'
      });
    }
    
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  });

  /**
   * GET /api/auth/google/callback - Google OAuth callback
   */
  app.get('/api/auth/google/callback',
    passport.authenticate('google', { 
      failureRedirect: `${config.FRONTEND_URL}/?error=auth_failed`,
      failureMessage: true 
    }),
    (req, res) => {
      authController.googleAuthCallback(req, res);
    }
  );

  /**
   * GET /api/auth/demo - Demo login (development only)
   */
  app.get('/api/auth/demo', async (req, res) => {
    authController.demoLogin(req, res);
  });

  /**
   * POST /api/auth/native-app - Native app authentication
   */
  app.post('/api/auth/native-app', async (req, res) => {
    authController.authenticateNativeApp(req, res);
  });

  /**
   * GET /api/auth/user - Get current user
   */
  app.get('/api/auth/user', (req, res) => {
    authController.getCurrentUser(req, res);
  });

  /**
   * POST /api/auth/logout - Logout
   */
  app.post('/api/auth/logout', (req, res) => {
    authController.logout(req, res);
  });
};
