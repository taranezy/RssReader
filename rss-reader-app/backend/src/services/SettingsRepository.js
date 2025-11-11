/**
 * SettingsRepository - Single Responsibility: User settings data access
 * Manages all user-related settings in the database
 */
class SettingsRepository {
  constructor(database) {
    this.db = database.getDb();
  }

  /**
   * Get user settings, create default if not found
   */
  getSettings(userId) {
    const stmt = this.db.prepare('SELECT * FROM user_settings WHERE user_id = ?');
    let settings = stmt.get(userId);

    if (!settings) {
      settings = this.createDefaultSettings(userId);
    }

    return this.formatSettings(settings);
  }

  /**
   * Create default settings for new user
   */
  createDefaultSettings(userId) {
    const stmt = this.db.prepare(`
      INSERT INTO user_settings (user_id, font, show_left_menu, show_feed_images, header_color, dark_mode, enable_pip)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(userId, 'default', 1, 1, 'purple', 0, 1);
    return this.getSettings(userId);
  }

  /**
   * Update user settings
   */
  updateSettings(userId, settings) {
    const stmt = this.db.prepare(`
      UPDATE user_settings 
      SET font = ?, show_left_menu = ?, show_feed_images = ?, header_color = ?, dark_mode = ?, enable_pip = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);

    stmt.run(
      settings.font || 'default',
      settings.showLeftMenu ? 1 : 0,
      settings.showFeedImages ? 1 : 0,
      settings.headerColor || 'purple',
      settings.darkMode ? 1 : 0,
      settings.enablePIP ? 1 : 0,
      userId
    );

    return this.getSettings(userId);
  }

  /**
   * Format database settings to API format (convert SQL integers to booleans)
   */
  formatSettings(settings) {
    return {
      font: settings.font,
      showLeftMenu: settings.show_left_menu === 1,
      showFeedImages: settings.show_feed_images === 1,
      headerColor: settings.header_color || 'purple',
      darkMode: settings.dark_mode === 1 || false,
      enablePIP: settings.enable_pip === 1 || true
    };
  }

  /**
   * Get preferences for user
   */
  getPreferences(userId) {
    const stmt = this.db.prepare('SELECT * FROM user_preferences WHERE user_id = ?');
    let prefs = stmt.get(userId);

    if (!prefs) {
      prefs = this.createDefaultPreferences(userId);
    }

    return this.formatPreferences(prefs);
  }

  /**
   * Create default preferences for new user
   */
  createDefaultPreferences(userId) {
    const stmt = this.db.prepare(`
      INSERT INTO user_preferences (user_id, view_type, selected_feeds, show_only_unread, open_in_new_tab)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(userId, 'list', '[]', 0, 1);
    return this.getPreferences(userId);
  }

  /**
   * Update preferences
   */
  updatePreferences(userId, preferences) {
    const stmt = this.db.prepare(`
      UPDATE user_preferences 
      SET view_type = ?, selected_feeds = ?, show_only_unread = ?, open_in_new_tab = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);

    stmt.run(
      preferences.viewType || 'list',
      JSON.stringify(preferences.selectedFeeds || []),
      preferences.showOnlyUnread ? 1 : 0,
      preferences.openInNewTab ? 1 : 0,
      userId
    );

    return this.getPreferences(userId);
  }

  /**
   * Format preferences from database to API format
   */
  formatPreferences(prefs) {
    return {
      viewType: prefs.view_type,
      selectedFeeds: prefs.selected_feeds ? JSON.parse(prefs.selected_feeds) : [],
      showOnlyUnread: prefs.show_only_unread === 1,
      openInNewTab: prefs.open_in_new_tab === 1
    };
  }
}

module.exports = SettingsRepository;
