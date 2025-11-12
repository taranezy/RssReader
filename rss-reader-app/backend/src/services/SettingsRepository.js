/**
 * SettingsRepository - Single Responsibility: User settings data access
 * Wraps existing database.js methods and provides consistent interface
 * Adapter pattern for legacy database service
 */
class SettingsRepository {
  constructor(databaseService) {
    this.db = databaseService;
  }

  /**
   * Get user settings
   */
  getSettings(userId) {
    try {
      // Note: database.js already returns formatted settings with proper booleans
      // So we just pass it through without re-formatting
      const settings = this.db.getUserSettings(userId);
      return settings;  // Already formatted by database.js
    } catch (error) {
      console.error('[SettingsRepository] Error:', error.message);
      throw new Error(`Failed to get settings: ${error.message}`);
    }
  }

  /**
   * Update user settings
   */
  updateSettings(userId, settings) {
    try {
      this.db.updateUserSettings(userId, settings);
      return this.getSettings(userId);
    } catch (error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }
  }

  /**
   * Format database settings to API format (convert SQL integers to booleans)
   */
  formatSettings(settings) {
    if (!settings) {
      return {
        font: 'default',
        showLeftMenu: true,
        showFeedImages: true,
        headerColor: 'purple',
        darkMode: false,
        enablePIP: true
      };
    }

    return {
      font: settings.font || 'default',
      showLeftMenu: settings.show_left_menu === 1,
      showFeedImages: settings.show_feed_images === 1,
      headerColor: settings.header_color || 'purple',
      darkMode: settings.dark_mode === 1,
      enablePIP: settings.enable_pip === 1
    };
  }

  /**
   * Get preferences for user
   */
  getPreferences(userId) {
    try {
      // Note: database.js already returns formatted preferences
      return this.db.getPreferences(userId);
    } catch (error) {
      throw new Error(`Failed to get preferences: ${error.message}`);
    }
  }

  /**
   * Update preferences
   */
  updatePreferences(userId, preferences) {
    try {
      this.db.updatePreferences(userId, preferences);
      return this.getPreferences(userId);
    } catch (error) {
      throw new Error(`Failed to update preferences: ${error.message}`);
    }
  }

  /**
   * Format preferences from database to API format
   */
  formatPreferences(prefs) {
    if (!prefs) {
      return {
        viewType: 'list',
        selectedFeeds: [],
        showOnlyUnread: false
      };
    }

    return {
      viewType: prefs.view_type || 'list',
      selectedFeeds: prefs.selected_feeds ? JSON.parse(prefs.selected_feeds) : [],
      showOnlyUnread: prefs.show_only_unread === 1 || false
    };
  }
}

module.exports = SettingsRepository;
