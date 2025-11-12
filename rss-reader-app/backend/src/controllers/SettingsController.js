/**
 * SettingsController - Single Responsibility: Handle HTTP requests related to user settings
 * Depends on SettingsRepository (Dependency Injection)
 */
class SettingsController {
  constructor(settingsRepository) {
    this.settingsRepository = settingsRepository;
  }

  /**
   * GET /api/user-settings - Get user settings
   */
  getSettings(req, res) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        console.error('[SettingsController] ERROR: userId is not set!');
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }
      
      const settings = this.settingsRepository.getSettings(userId);

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('[SettingsController] Error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PUT /api/user-settings - Update user settings
   */
  updateSettings(req, res) {
    try {
      const userId = req.user.id;
      const settings = req.body;

      const updatedSettings = this.settingsRepository.updateSettings(userId, settings);

      res.json({
        success: true,
        data: updatedSettings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/preferences - Get user preferences
   */
  getPreferences(req, res) {
    try {
      const userId = req.user.id;
      
      const preferences = this.settingsRepository.getPreferences(userId);

      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PUT /api/preferences - Update user preferences
   */
  updatePreferences(req, res) {
    try {
      const userId = req.user.id;
      const preferences = req.body;

      const updatedPreferences = this.settingsRepository.updatePreferences(userId, preferences);

      res.json({
        success: true,
        data: updatedPreferences
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = SettingsController;
