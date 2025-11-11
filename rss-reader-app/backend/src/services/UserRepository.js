/**
 * UserRepository - Single Responsibility: User data access
 * Implements Repository Pattern for user operations
 */
class UserRepository {
  constructor(database) {
    this.db = database.getDb();
  }

  /**
   * Find user by email
   */
  findByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  /**
   * Find user by Google ID
   */
  findByGoogleId(googleId) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE google_id = ?');
    return stmt.get(googleId);
  }

  /**
   * Find user by ID
   */
  findById(id) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * Create new user
   */
  create(user) {
    const stmt = this.db.prepare(`
      INSERT INTO users (email, username, google_id)
      VALUES (?, ?, ?)
    `);
    return stmt.run(user.email, user.username, user.googleId || null);
  }

  /**
   * Update last login timestamp
   */
  updateLastLogin(userId) {
    const stmt = this.db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(userId);
  }

  /**
   * Get user with all related data
   */
  getUserWithData(userId) {
    const user = this.findById(userId);
    if (!user) return null;

    return {
      ...user,
      feeds: this.getUserFeeds(userId),
      preferences: this.getUserPreferences(userId),
      settings: this.getUserSettings(userId)
    };
  }

  /**
   * Get user feeds
   */
  getUserFeeds(userId) {
    const stmt = this.db.prepare('SELECT * FROM rss_feeds WHERE user_id = ? AND is_active = 1 ORDER BY added_date DESC');
    return stmt.all(userId);
  }

  /**
   * Get user preferences
   */
  getUserPreferences(userId) {
    const stmt = this.db.prepare('SELECT * FROM user_preferences WHERE user_id = ?');
    return stmt.get(userId);
  }

  /**
   * Get user settings
   */
  getUserSettings(userId) {
    const stmt = this.db.prepare('SELECT * FROM user_settings WHERE user_id = ?');
    return stmt.get(userId);
  }
}

module.exports = UserRepository;
