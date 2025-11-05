const Database = require('better-sqlite3');
const path = require('path');

class DatabaseService {
  constructor() {
    // Database will be created in user's data directory
    const dbPath = path.join(__dirname, 'data', 'rss-reader.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeTables();
  }

  initializeTables() {
    // Create users table
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

    // Create feeds table with user_id
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
    
    // Add category column if it doesn't exist (migration for existing databases)
    try {
      this.db.exec(`ALTER TABLE rss_feeds ADD COLUMN category TEXT;`);
    } catch (err) {
      // Column already exists, ignore error
    }
    // Create items table with user_id
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

    // Create preferences table with user_id
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        view_type TEXT NOT NULL DEFAULT 'list',
        selected_feeds TEXT,
        show_only_unread INTEGER NOT NULL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create user settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        font TEXT NOT NULL DEFAULT 'default',
        show_left_menu INTEGER NOT NULL DEFAULT 1,
        show_feed_images INTEGER NOT NULL DEFAULT 1,
        header_color TEXT NOT NULL DEFAULT 'purple',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Add header_color column if it doesn't exist (migration for existing databases)
    try {
      this.db.exec(`ALTER TABLE user_settings ADD COLUMN header_color TEXT NOT NULL DEFAULT 'purple';`);
    } catch (err) {
      // Column already exists, ignore error
    }

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
      CREATE INDEX IF NOT EXISTS idx_feeds_user_id ON rss_feeds(user_id);
      CREATE INDEX IF NOT EXISTS idx_items_user_id ON rss_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_items_feed_id ON rss_items(feed_id);
      CREATE INDEX IF NOT EXISTS idx_items_pub_date ON rss_items(pub_date DESC);
      CREATE INDEX IF NOT EXISTS idx_items_is_read ON rss_items(is_read);
      CREATE INDEX IF NOT EXISTS idx_feeds_is_active ON rss_feeds(is_active);
      CREATE INDEX IF NOT EXISTS idx_prefs_user_id ON user_preferences(user_id);
      CREATE INDEX IF NOT EXISTS idx_settings_user_id ON user_settings(user_id);
    `);
  }

  // User operations
  findUserByEmail(email) {
    return this.db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  findUserByGoogleId(googleId) {
    return this.db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
  }

  findUserById(id) {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  createUser(email, username, googleId) {
    const stmt = this.db.prepare(`
      INSERT INTO users (email, username, google_id, last_login)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    const result = stmt.run(email, username, googleId);
    
    // Create default preferences for new user
    this.db.prepare(`
      INSERT INTO user_preferences (user_id, view_type, selected_feeds, show_only_unread)
      VALUES (?, ?, ?, ?)
    `).run(result.lastInsertRowid, 'list', '[]', 0);
    
    // Create default settings for new user
    this.db.prepare(`
      INSERT INTO user_settings (user_id, font, show_left_menu)
      VALUES (?, ?, ?)
    `).run(result.lastInsertRowid, 'default', 1);
    
    return result.lastInsertRowid;
  }

  updateUserLastLogin(userId) {
    return this.db.prepare(`
      UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
    `).run(userId);
  }

  // Feed operations (with user_id)
  getAllFeeds(userId) {
    return this.db.prepare(`
      SELECT * FROM rss_feeds WHERE user_id = ? ORDER BY added_date DESC
    `).all(userId);
  }

  getFeedById(id, userId) {
    return this.db.prepare('SELECT * FROM rss_feeds WHERE id = ? AND user_id = ?').get(id, userId);
  }

  createFeed(feed, userId) {
    const stmt = this.db.prepare(`
      INSERT INTO rss_feeds (id, user_id, url, title, description, color, category, is_active, last_fetched, added_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      feed.id,
      userId,
      feed.url,
      feed.title,
      feed.description || null,
      feed.color,
      feed.category || null,
      feed.isActive ? 1 : 0,
      feed.lastFetched || null,
      feed.addedDate
    );
  }

  updateFeed(id, userId, updates) {
    const fields = [];
    const values = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category || null);
    }
    if (updates.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.isActive ? 1 : 0);
    }
    if (updates.lastFetched !== undefined) {
      fields.push('last_fetched = ?');
      values.push(updates.lastFetched);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    values.push(userId);

    const stmt = this.db.prepare(`
      UPDATE rss_feeds SET ${fields.join(', ')} WHERE id = ? AND user_id = ?
    `);

    return stmt.run(...values);
  }

  deleteFeed(id, userId) {
    // This will cascade delete items due to foreign key constraint
    return this.db.prepare('DELETE FROM rss_feeds WHERE id = ? AND user_id = ?').run(id, userId);
  }

  // Item operations (with user_id)
  getAllItems(userId) {
    return this.db.prepare(`
      SELECT * FROM rss_items WHERE user_id = ? ORDER BY pub_date DESC
    `).all(userId);
  }

  getItemsByFeed(feedId, userId) {
    return this.db.prepare(`
      SELECT * FROM rss_items WHERE feed_id = ? AND user_id = ? ORDER BY pub_date DESC
    `).all(feedId, userId);
  }

  createItem(item, userId) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO rss_items 
      (id, user_id, feed_id, feed_title, title, link, description, pub_date, is_read, author, categories, content, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      item.id,
      userId,
      item.feedId,
      item.feedTitle,
      item.title,
      item.link,
      item.description || null,
      item.pubDate,
      item.isRead ? 1 : 0,
      item.author || null,
      item.categories ? JSON.stringify(item.categories) : null,
      item.content || null,
      item.imageUrl || null
    );
  }

  createItems(items, userId) {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO rss_items 
      (id, user_id, feed_id, feed_title, title, link, description, pub_date, is_read, author, categories, content, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((items) => {
      for (const item of items) {
        insert.run(
          item.id,
          userId,
          item.feedId,
          item.feedTitle,
          item.title,
          item.link,
          item.description || null,
          item.pubDate,
          item.isRead ? 1 : 0,
          item.author || null,
          item.categories ? JSON.stringify(item.categories) : null,
          item.content || null,
          item.imageUrl || null
        );
      }
    });

    return insertMany(items);
  }

  updateItem(id, userId, updates) {
    const fields = [];
    const values = [];

    if (updates.isRead !== undefined) {
      fields.push('is_read = ?');
      values.push(updates.isRead ? 1 : 0);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    values.push(userId);

    const stmt = this.db.prepare(`
      UPDATE rss_items SET ${fields.join(', ')} WHERE id = ? AND user_id = ?
    `);

    return stmt.run(...values);
  }

  markAllAsRead(userId, feedId = null) {
    if (feedId) {
      return this.db.prepare(`
        UPDATE rss_items SET is_read = 1, updated_at = CURRENT_TIMESTAMP 
        WHERE feed_id = ? AND user_id = ?
      `).run(feedId, userId);
    } else {
      return this.db.prepare(`
        UPDATE rss_items SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
      `).run(userId);
    }
  }

  deleteItemsByFeed(feedId, userId) {
    return this.db.prepare('DELETE FROM rss_items WHERE feed_id = ? AND user_id = ?').run(feedId, userId);
  }

  // Preferences operations (with user_id)
  getPreferences(userId) {
    const prefs = this.db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId);
    if (!prefs) return null;

    return {
      viewType: prefs.view_type,
      selectedFeeds: JSON.parse(prefs.selected_feeds || '[]'),
      showOnlyUnread: prefs.show_only_unread === 1
    };
  }

  updatePreferences(userId, preferences) {
    const stmt = this.db.prepare(`
      UPDATE user_preferences 
      SET view_type = ?, selected_feeds = ?, show_only_unread = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);

    return stmt.run(
      preferences.viewType || 'list',
      JSON.stringify(preferences.selectedFeeds || []),
      preferences.showOnlyUnread ? 1 : 0,
      userId
    );
  }

  // User settings operations
  getUserSettings(userId) {
    const settings = this.db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
    if (!settings) {
      // Create default settings if not found
      this.db.prepare(`
        INSERT INTO user_settings (user_id, font, show_left_menu, show_feed_images, header_color)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, 'default', 1, 1, 'purple');
      return { font: 'default', showLeftMenu: true, showFeedImages: true, headerColor: 'purple' };
    }

    return {
      font: settings.font,
      showLeftMenu: settings.show_left_menu === 1,
      showFeedImages: settings.show_feed_images === 1,
      headerColor: settings.header_color || 'purple'
    };
  }

  updateUserSettings(userId, settings) {
    const stmt = this.db.prepare(`
      UPDATE user_settings 
      SET font = ?, show_left_menu = ?, show_feed_images = ?, header_color = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);

    return stmt.run(
      settings.font || 'default',
      settings.showLeftMenu ? 1 : 0,
      settings.showFeedImages ? 1 : 0,
      settings.headerColor || 'purple',
      userId
    );
  }

  // Utility methods
  close() {
    this.db.close();
  }

  // Convert database rows to application format
  convertFeedFromDb(dbFeed) {
    if (!dbFeed) return null;
    return {
      id: dbFeed.id,
      url: dbFeed.url,
      title: dbFeed.title,
      description: dbFeed.description,
      color: dbFeed.color,
      category: dbFeed.category,
      isActive: dbFeed.is_active === 1,
      lastFetched: dbFeed.last_fetched,
      addedDate: dbFeed.added_date
    };
  }

  convertItemFromDb(dbItem) {
    if (!dbItem) return null;
    return {
      id: dbItem.id,
      feedId: dbItem.feed_id,
      feedTitle: dbItem.feed_title,
      title: dbItem.title,
      link: dbItem.link,
      description: dbItem.description,
      pubDate: dbItem.pub_date,
      isRead: dbItem.is_read === 1,
      author: dbItem.author,
      categories: dbItem.categories ? JSON.parse(dbItem.categories) : undefined,
      content: dbItem.content,
      imageUrl: dbItem.image_url
    };
  }
}

module.exports = DatabaseService;
