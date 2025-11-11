/**
 * AuthenticationService - Single Responsibility: Authentication business logic
 * Handles user authentication and session management
 * Depends on UserRepository (Dependency Injection)
 */
class AuthenticationService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Authenticate user by email
   */
  authenticateByEmail(email) {
    const user = this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new Error('User not found');
    }

    this.userRepository.updateLastLogin(user.id);
    return this.formatUserResponse(user);
  }

  /**
   * Authenticate or create user via Google OAuth
   */
  authenticateGoogleUser(googleProfile) {
    let user = this.userRepository.findByGoogleId(googleProfile.id);

    if (!user) {
      // Create new user from Google profile
      const result = this.userRepository.create({
        email: googleProfile.emails[0].value,
        username: googleProfile.displayName,
        googleId: googleProfile.id
      });

      user = this.userRepository.findById(result.lastInsertRowid);
    } else {
      this.userRepository.updateLastLogin(user.id);
    }

    return this.formatUserResponse(user);
  }

  /**
   * Format user response for API
   */
  formatUserResponse(user) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.created_at,
      lastLogin: user.last_login
    };
  }
}

module.exports = AuthenticationService;
