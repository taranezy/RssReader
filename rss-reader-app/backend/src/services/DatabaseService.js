const Database = require('better-sqlite3');
const path = require('path');

/**
 * DatabaseService - Single Responsibility: Database operations
 * Handles all database initialization and CRUD operations
 */
class DatabaseService {
  constructor() {
    const dbPath = path.join(__dirname, '../../data', 'rss-reader.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeTables();
  }

  /**
   * Initialize all database tables
   */
  initializeTables() {
    this.createUsersTables();
    this.createFeedsTables();
    this.createItemsTables();
    this.createPreferencesTables();
    this.createSettingsTables();
    this.createIndexes();
  }

  /**
   * Create users table
   */
  createUsersTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL,
        google_id TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  /**
   * Create feeds table with migrations
   */
  createFeedsTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rss_feeds (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL,
        category TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        last_fetched TEXT,
        added_date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, url)
      );
    `);
    
    // Migration: Add category column if missing
    this.addColumnIfNotExists('rss_feeds', 'category', 'TEXT');
  }

  /**
   * Create items table with migrations
   */
  createItemsTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rss_items (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        feed_id TEXT NOT NULL,
        feed_title TEXT NOT NULL,
        title TEXT NOT NULL,
        link TEXT NOT NULL,
        description TEXT,
        pub_date TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        author TEXT,
        categories TEXT,
        content TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (feed_id) REFERENCES rss_feeds(id) ON DELETE CASCADE
      );
    `);

    // Migration: Add is_saved column
    this.addColumnIfNotExists('rss_items', 'is_saved', 'INTEGER NOT NULL DEFAULT 0');
  }

  /**
   * Create preferences table
   */
  createPreferencesTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        view_type TEXT NOT NULL DEFAULT 'list',
        selected_feeds TEXT,
        show_only_unread INTEGER NOT NULL DEFAULT 0,
        open_in_new_tab INTEGER NOT NULL DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  }

  /**
   * Create settings table with migrations
   */
  createSettingsTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        font TEXT NOT NULL DEFAULT 'default',
        show_left_menu INTEGER NOT NULL DEFAULT 1,
        show_feed_images INTEGER NOT NULL DEFAULT 1,
        header_color TEXT NOT NULL DEFAULT 'purple',
        dark_mode INTEGER NOT NULL DEFAULT 0,
        enable_pip INTEGER NOT NULL DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  }

  /**
   * Create database indexes
   */
  createIndexes() {
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
      CREATE INDEX IF NOT EXISTS idx_feeds_user_id ON rss_feeds(user_id);
      CREATE INDEX IF NOT EXISTS idx_items_user_id ON rss_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_items_feed_id ON rss_items(feed_id);
      CREATE INDEX IF NOT EXISTS idx_items_pub_date ON rss_items(pub_date DESC);
      CREATE INDEX IF NOT EXISTS idx_items_is_read ON rss_items(is_read);
      CREATE INDEX IF NOT EXISTS idx_items_is_saved ON rss_items(is_saved);
      CREATE INDEX IF NOT EXISTS idx_feeds_is_active ON rss_feeds(is_active);
      CREATE INDEX IF NOT EXISTS idx_prefs_user_id ON user_preferences(user_id);
      CREATE INDEX IF NOT EXISTS idx_settings_user_id ON user_settings(user_id);
    `);
  }

  /**
   * Helper: Add column if it doesn't exist (for migrations)
   */
  addColumnIfNotExists(table, column, type) {
    try {
      this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.error(`Error adding ${column} to ${table}:`, err);
      }
    }
  }

  /**
   * Get database instance
   */
  getDb() {
    return this.db;
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

module.exports = DatabaseService;
