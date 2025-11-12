/**
 * UserRepository - Single Responsibility: User data access operations
 * Wraps existing database.js methods and provides consistent interface
 * Adapter pattern for legacy database service
 */
class UserRepository {
  constructor(databaseService) {
    this.db = databaseService;
  }

  /**
   * Find user by email
   */
  findByEmail(email) {
    try {
      return this.db.findUserByEmail(email);
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Find user by Google ID
   */
  findByGoogleId(googleId) {
    try {
      return this.db.findUserByGoogleId(googleId);
    } catch (error) {
      throw new Error(`Failed to find user by Google ID: ${error.message}`);
    }
  }

  /**
   * Find user by ID
   */
  findById(id) {
    try {
      return this.db.findUserById(id);
    } catch (error) {
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  }

  /**
   * Create new user
   */
  create(userData) {
    try {
      const userId = this.db.createUser(
        userData.email,
        userData.username,
        userData.googleId || null
      );

      return { lastInsertRowid: userId };
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Update user last login timestamp
   */
  updateLastLogin(userId) {
    try {
      this.db.updateUserLastLogin(userId);
      return true;
    } catch (error) {
      throw new Error(`Failed to update last login: ${error.message}`);
    }
  }

  /**
   * Get user with all related data
   */
  getUserWithData(userId) {
    try {
      const user = this.db.findUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        ...user,
        feeds: this.db.getAllFeeds(userId),
        items: this.db.getAllItems(userId),
        preferences: this.db.getPreferences(userId),
        settings: this.db.getUserSettings(userId)
      };
    } catch (error) {
      throw new Error(`Failed to get user with data: ${error.message}`);
    }
  }

  /**
   * Get user feeds
   */
  getUserFeeds(userId) {
    try {
      return this.db.getAllFeeds(userId);
    } catch (error) {
      throw new Error(`Failed to get user feeds: ${error.message}`);
    }
  }

  /**
   * Get user preferences
   */
  getUserPreferences(userId) {
    try {
      return this.db.getPreferences(userId);
    } catch (error) {
      throw new Error(`Failed to get user preferences: ${error.message}`);
    }
  }

  /**
   * Get user settings
   */
  getUserSettings(userId) {
    try {
      return this.db.getUserSettings(userId);
    } catch (error) {
      throw new Error(`Failed to get user settings: ${error.message}`);
    }
  }
}

module.exports = UserRepository;
