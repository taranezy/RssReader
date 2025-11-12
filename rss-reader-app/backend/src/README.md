# Backend src/ Directory - SOLID Architecture Components

## 📋 Overview

This directory contains the refactored backend components following SOLID principles and design patterns. All code is organized into three layers: **Services**, **Controllers**, and **Routes**, with **Middleware** for cross-cutting concerns.

## 📁 Directory Structure

```
src/
├── services/          ← Data Access & Business Logic Layer
├── controllers/       ← HTTP Request Handler Layer
├── routes/            ← Endpoint Organization Layer
└── middleware/        ← Cross-Cutting Concerns Layer
```

## 🔧 Services Layer

### Location: `src/services/`

Contains data access repositories and business logic services.

**Files:**
- **DatabaseService.js** (165 lines)
  - Handles database initialization
  - Creates tables and indexes
  - Provides migration helpers
  - Dependency: better-sqlite3

- **UserRepository.js** (108 lines)
  - User data access layer
  - Methods: findByEmail, findByGoogleId, findById, create, updateLastLogin, getUserWithData
  - Wraps: database.js user methods
  - Depends on: DatabaseService

- **FeedRepository.js** (109 lines)
  - Feed data access layer
  - Methods: getAllFeeds, getFeed, addFeed, updateFeed, deleteFeed, hasDuplicateFeed
  - Wraps: database.js feed methods
  - Depends on: DatabaseService

- **ItemRepository.js** (200 lines)
  - Item/Article data access layer
  - Methods: getItemsByFeed, getUserItems, getItem, addItem, markItemAsRead, markFeedAsRead, toggleItemSaved, getSavedItems, getUnreadCount, searchItems, deleteOldItems
  - Wraps: database.js item methods
  - Depends on: DatabaseService

- **SettingsRepository.js** (91 lines)
  - Settings & preferences data access layer
  - Methods: getSettings, updateSettings, getPreferences, updatePreferences, formatSettings, formatPreferences
  - Wraps: database.js settings methods
  - Depends on: DatabaseService

- **AuthenticationService.js** (70 lines)
  - Authentication business logic service
  - Methods: authenticateByEmail, authenticateGoogleUser, formatUserResponse
  - No database dependency (uses UserRepository)
  - Depends on: UserRepository

### Usage Example:

```javascript
const db = new DatabaseService();
const userRepo = new UserRepository(db);
const authService = new AuthenticationService(userRepo);

// Services can be used independently or injected into controllers
const user = authService.authenticateByEmail('user@example.com');
```

---

## 🎮 Controllers Layer

### Location: `src/controllers/`

Contains HTTP request handlers that call services/repositories and format responses.

**Files:**
- **AuthController.js** (93 lines)
  - Handles: /api/auth/* endpoints
  - Methods: getCurrentUser, logout, demoLogin, authenticateNativeApp, googleAuthCallback
  - Depends on: AuthenticationService

- **FeedController.js** (117 lines)
  - Handles: /api/feeds/* endpoints
  - Methods: getAllFeeds, getFeed, addFeed, updateFeed, deleteFeed
  - Depends on: FeedRepository, UserRepository

- **ItemController.js** (198 lines)
  - Handles: /api/items/* endpoints
  - Methods: getUserItems, getFeedItems, markItemAsRead, markFeedAsRead, toggleItemSaved, getSavedItems, getUnreadCount, searchItems, cleanupOldItems
  - Depends on: ItemRepository, FeedRepository

- **SettingsController.js** (66 lines)
  - Handles: /api/user-settings/* and /api/preferences/* endpoints
  - Methods: getSettings, updateSettings, getPreferences, updatePreferences
  - Depends on: SettingsRepository

### Controller Pattern:

All controllers follow this pattern:
```javascript
class SomeController {
  constructor(repository, otherDependencies) {
    this.repository = repository;
  }
  
  methodName(req, res) {
    try {
      // Extract from request
      const data = req.body;
      const userId = req.user.id;
      
      // Call repository/service
      const result = this.repository.doSomething(userId, data);
      
      // Format response
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
```

### Usage Example:

```javascript
const feedController = new FeedController(feedRepository, userRepository);
app.get('/api/feeds', isAuthenticated, (req, res) => {
  feedController.getAllFeeds(req, res);
});
```

---

## 🛣️ Routes Layer

### Location: `src/routes/`

Organizes endpoints by domain and maps them to controller methods.

**Files:**
- **authRoutes.js** (42 lines)
  - Endpoints: /api/auth/*
  - GET /api/auth/google
  - GET /api/auth/google/callback
  - GET /api/auth/demo
  - POST /api/auth/native-app
  - GET /api/auth/user
  - POST /api/auth/logout

- **feedRoutes.js** (42 lines)
  - Endpoints: /api/feeds/*
  - GET /api/feeds
  - GET /api/feeds/:id
  - POST /api/feeds
  - PUT /api/feeds/:id
  - DELETE /api/feeds/:id

- **itemRoutes.js** (50 lines)
  - Endpoints: /api/items/* and /api/feeds/:feedId/items
  - GET /api/items
  - GET /api/feeds/:feedId/items
  - PUT /api/items/:id
  - POST /api/items/mark-all-read
  - POST /api/items/:id/toggle-save
  - GET /api/items/saved
  - GET /api/items/unread-count
  - GET /api/items/search
  - POST /api/items/cleanup-old

- **settingsRoutes.js** (27 lines)
  - Endpoints: /api/user-settings/* and /api/preferences/*
  - GET /api/user-settings
  - PUT /api/user-settings
  - GET /api/preferences
  - PUT /api/preferences

### Route Pattern:

All routes follow this function pattern:
```javascript
module.exports = function createSomeRoutes(app, controller, middleware) {
  app.get('/api/some', middleware, (req, res) => {
    controller.methodName(req, res);
  });
  
  app.post('/api/some', middleware, (req, res) => {
    controller.otherMethod(req, res);
  });
};
```

### Registration in server-refactored.js:

```javascript
createAuthRoutes(app, authController, passport, isAuthenticated);
createFeedRoutes(app, feedController, isAuthenticated);
createItemRoutes(app, itemController, isAuthenticated);
createSettingsRoutes(app, settingsController, isAuthenticated);
```

---

## 🔒 Middleware Layer

### Location: `src/middleware/`

Handles cross-cutting concerns like authentication, error handling, and logging.

**Files:**
- **isAuthenticated.js** (19 lines)
  - Verifies user session exists
  - Allows demo and proxy routes
  - Returns 401 if not authenticated
  - Usage: `app.use(isAuthenticated)` or per-route

- **errorHandler.js** (43 lines)
  - Catches all errors from routes/controllers
  - Formats error responses consistently
  - Includes stack trace in development mode
  - Usage: `app.use(errorHandler)` (must be last)

- **logger.js** (21 lines)
  - Logs incoming HTTP requests
  - Logs outgoing responses with timing
  - Useful for performance monitoring
  - Usage: `app.use(logger)` (must be first)

### Middleware Pattern:

```javascript
// Middleware function
function middlewareName(req, res, next) {
  // Do something
  next(); // Pass to next middleware/route
}

// Or error handler (must have 4 params)
function errorHandler(err, req, res, next) {
  // Handle error
  res.status(500).json({ error: error.message });
}
```

### Middleware Order in server-refactored.js:

```javascript
app.use(logger);                      // Log all requests first
app.use(cors());                      // CORS configuration
app.use(bodyParser.json());           // Parse JSON bodies
app.use(cookieParser());              // Parse cookies
app.use(session());                   // Session management
app.use(passport.initialize());       // Passport setup
app.use(passport.session());          // Passport sessions
// Routes use isAuthenticated as needed
app.use(createAuthRoutes);
app.use(createFeedRoutes);
app.use(createItemRoutes);
app.use(createSettingsRoutes);
app.use(errorHandler);                // Error handling last
```

---

## 🔄 Data Flow Example

### Example: Get all feeds

```
1. Browser Request
   GET /api/feeds
   Header: Authorization, Cookie with session

2. Logger Middleware
   Log: "GET /api/feeds"

3. isAuthenticated Middleware
   ✓ Check: req.isAuthenticated()
   ✓ Verified: User is logged in

4. Feed Route Handler
   Called: feedController.getAllFeeds(req, res)

5. FeedController.getAllFeeds()
   • Extract: userId = req.user.id
   • Call: feedRepository.getAllFeeds(userId)
   • Format: res.json({ success, data, count })

6. FeedRepository.getAllFeeds()
   • Call: this.db.getAllFeeds(userId)

7. database.js
   • Execute SQL query
   • Return results

8. FeedRepository returns to FeedController

9. FeedController formats and sends response
   { success: true, data: [...feeds], count: 10 }

10. Logger Middleware
    Log: "GET /api/feeds 200 45ms"

11. Browser receives response and displays
```

---

## 🧪 Testing

### Unit Test Example:

```javascript
// Mock repository
const mockFeedRepo = {
  getAllFeeds: () => [{ id: 1, title: 'Test Feed' }]
};

// Create controller with mock
const controller = new FeedController(mockFeedRepo);

// Mock request/response
const req = { user: { id: 1 } };
const res = { json: jest.fn() };

// Test
controller.getAllFeeds(req, res);

// Verify
expect(res.json).toHaveBeenCalledWith({
  success: true,
  data: [{ id: 1, title: 'Test Feed' }],
  count: 1
});
```

---

## 🚀 Adding New Features

### To add a new endpoint:

1. **Add method to repository** (if needed)
   ```javascript
   // src/services/FeedRepository.js
   archiveFeed(feedId, userId) {
     return this.db.updateFeed(feedId, userId, { isActive: false });
   }
   ```

2. **Add method to controller**
   ```javascript
   // src/controllers/FeedController.js
   archiveFeed(req, res) {
     const feedId = req.params.id;
     this.feedRepository.archiveFeed(feedId, req.user.id);
     res.json({ success: true });
   }
   ```

3. **Add route**
   ```javascript
   // src/routes/feedRoutes.js
   app.post('/api/feeds/:id/archive', isAuthenticated, (req, res) => {
     feedController.archiveFeed(req, res);
   });
   ```

---

## 📚 Documentation

- **ARCHITECTURE.md** - Complete architecture documentation
- **REFACTORING_GUIDE.md** - Quick reference guide
- **VISUAL_GUIDE.md** - Diagrams and visual explanations
- **COMPLETION_SUMMARY.md** - What was completed
- **IMPLEMENTATION_CHECKLIST.md** - Implementation status

---

## 🎯 SOLID Principles in src/

1. **Single Responsibility**: Each file has one reason to change
2. **Open/Closed**: Easy to extend without modification
3. **Liskov Substitution**: Repositories are interchangeable
4. **Interface Segregation**: Only expose needed methods
5. **Dependency Inversion**: Depend on abstractions via DI

---

## ✨ Benefits of This Structure

- ✅ **Testable**: Every component can be mocked
- ✅ **Maintainable**: Clear file organization
- ✅ **Scalable**: Easy to add new features
- ✅ **Reusable**: Components used across codebase
- ✅ **Professional**: Follows industry standards
- ✅ **Documented**: Well-commented code
- ✅ **Flexible**: Easy to swap implementations

---

## 📝 Notes

- All repositories wrap the legacy `database.js` service
- All controllers follow consistent error handling
- All routes use dependency injection
- All middleware follows Express conventions
- No circular dependencies
- Each file imports only what it needs

**Ready for testing and production deployment!** ✅
