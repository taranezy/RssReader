/**
 * Settings Routes - Single Responsibility: Route all settings/preferences endpoints
 * Depends on SettingsController and Middleware (Dependency Injection)
 */
module.exports = function createSettingsRoutes(app, settingsController, isAuthenticated) {
  
  /**
   * GET /api/user-settings - Get user settings
   */
  app.get('/api/user-settings', isAuthenticated, (req, res) => {
    settingsController.getSettings(req, res);
  });

  /**
   * PUT /api/user-settings - Update user settings
   */
  app.put('/api/user-settings', isAuthenticated, (req, res) => {
    settingsController.updateSettings(req, res);
  });

  /**
   * GET /api/preferences - Get user preferences
   */
  app.get('/api/preferences', isAuthenticated, (req, res) => {
    settingsController.getPreferences(req, res);
  });

  /**
   * PUT /api/preferences - Update user preferences
   */
  app.put('/api/preferences', isAuthenticated, (req, res) => {
    settingsController.updatePreferences(req, res);
  });
};
