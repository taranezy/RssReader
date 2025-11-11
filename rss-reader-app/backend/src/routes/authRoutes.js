/**
 * Auth Routes - Single Responsibility: Route all authentication-related endpoints
 * Depends on AuthController and Middleware (Dependency Injection)
 */
module.exports = function createAuthRoutes(app, authController, passport, isAuthenticated) {
  
  /**
   * GET /api/auth/google - Start Google OAuth flow
   */
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  /**
   * GET /api/auth/google/callback - Google OAuth callback
   */
  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
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
