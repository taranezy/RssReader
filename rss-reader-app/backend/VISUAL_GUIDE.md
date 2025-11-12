# Backend SOLID Architecture - Visual Guide

## 🏗️ Layered Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  HTTP REQUESTS                       │
│            (Browser / Frontend / Client)             │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              MIDDLEWARE LAYER                        │
├─────────────────────────────────────────────────────┤
│  • Logger - Logs request/response (timing)          │
│  • Authentication - Verifies user session           │
│  • Error Handler - Catches and formats errors       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                ROUTES LAYER                          │
├─────────────────────────────────────────────────────┤
│  • authRoutes.js   → /api/auth/*                     │
│  • feedRoutes.js   → /api/feeds/*                    │
│  • itemRoutes.js   → /api/items/*                    │
│  • settingsRoutes.js → /api/user-settings/*          │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              CONTROLLERS LAYER                       │
├─────────────────────────────────────────────────────┤
│  AuthController    → Handles auth requests          │
│  FeedController    → Handles feed requests          │
│  ItemController    → Handles item requests          │
│  SettingsController → Handles settings requests     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│          SERVICES & REPOSITORIES LAYER              │
├─────────────────────────────────────────────────────┤
│  • AuthenticationService → Auth business logic      │
│  • UserRepository → User data access                │
│  • FeedRepository → Feed data access                │
│  • ItemRepository → Item data access                │
│  • SettingsRepository → Settings data access        │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│           LEGACY DATABASE LAYER                      │
├─────────────────────────────────────────────────────┤
│  • database.js → SQLite wrapper (still used)         │
│  • rss-proxy.js → RSS fetching service              │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                  DATABASE LAYER                      │
├─────────────────────────────────────────────────────┤
│  • SQLite (better-sqlite3)                           │
│  • Location: data/rss-reader.db                      │
│  • Tables: users, feeds, items, settings, etc       │
└──────────────────────────────────────────────────────┘
```

## 📊 Component Interaction Diagram

```
┌──────────────┐
│   Frontend   │
│  (Angular)   │
└──────┬───────┘
       │ HTTP GET /api/feeds
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ server-refactored.js (Express App)                        │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Logger Middleware                                   │ │
│  │ → Log: "GET /api/feeds"                             │ │
│  └────────────────┬────────────────────────────────────┘ │
│                   │                                       │
│  ┌────────────────▼────────────────────────────────────┐ │
│  │ isAuthenticated Middleware                          │ │
│  │ → Check: req.isAuthenticated()                      │ │
│  └────────────────┬────────────────────────────────────┘ │
│                   │                                       │
│  ┌────────────────▼────────────────────────────────────┐ │
│  │ feedRoutes → Route Handler                          │ │
│  │ → Call: feedController.getAllFeeds(req, res)        │ │
│  └────────────────┬────────────────────────────────────┘ │
│                   │                                       │
│  ┌────────────────▼────────────────────────────────────┐ │
│  │ FeedController.getAllFeeds()                        │ │
│  │ → Call: feedRepository.getAllFeeds(userId)          │ │
│  │ → Format: res.json({ success, data, count })        │ │
│  └────────────────┬────────────────────────────────────┘ │
│                   │                                       │
│  ┌────────────────▼────────────────────────────────────┐ │
│  │ FeedRepository.getAllFeeds()                        │ │
│  │ → Call: db.getAllFeeds(userId)                      │ │
│  └────────────────┬────────────────────────────────────┘ │
│                   │                                       │
│  ┌────────────────▼────────────────────────────────────┐ │
│  │ database.js (Legacy Service)                        │ │
│  │ → Execute: SELECT * FROM feeds WHERE user_id = ?    │ │
│  └────────────────┬────────────────────────────────────┘ │
└─────────────────┼──────────────────────────────────────────┘
                  │ SQLite Database
                  │
                  ▼
            ┌────────────────┐
            │  rss-reader.db │
            │  (SQLite)       │
            └────────────────┘
                  │
                  │ Return: feeds []
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ Response Processing                                       │
│ ┌────────────────────────────────────────────────────┐  │
│ │ FeedRepository → return feeds                      │  │
│ │ FeedController → res.json()                        │  │
│ │ Logger Middleware → Log: "GET /api/feeds 200 45ms"│  │
│ │ Express → Send JSON to client                      │  │
│ └────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   Frontend   │
                  │  (Display)   │
                  └──────────────┘
```

## 🔀 Dependency Injection Flow

```
┌───────────────────────────────────────────────────────────┐
│         server-refactored.js Initialization               │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  1. Create Database Service                               │
│     ┌─────────────────────────────────────┐              │
│     │ db = new DatabaseService()          │              │
│     │ ✓ Initialize SQLite connection      │              │
│     │ ✓ Create tables if needed           │              │
│     └─────────────────────────────────────┘              │
│              │                                             │
│              ▼                                             │
│  2. Create Repositories (Inject db)                       │
│     ┌─────────────────────────────────────┐              │
│     │ userRepository = new UserRepository(db)           │
│     │ feedRepository = new FeedRepository(db)           │
│     │ itemRepository = new ItemRepository(db)           │
│     │ settingsRepository = new SettingsRepository(db)   │
│     └─────────────────────────────────────┘              │
│              │                                             │
│              ▼                                             │
│  3. Create Services (Inject Repositories)                 │
│     ┌─────────────────────────────────────┐              │
│     │ authService = new AuthenticationService(         │
│     │   userRepository                                  │
│     │ )                                                 │
│     └─────────────────────────────────────┘              │
│              │                                             │
│              ▼                                             │
│  4. Create Controllers (Inject Repositories/Services)     │
│     ┌─────────────────────────────────────┐              │
│     │ authController = new AuthController(             │
│     │   authService                                    │
│     │ )                                                 │
│     │ feedController = new FeedController(             │
│     │   feedRepository, userRepository                 │
│     │ )                                                 │
│     │ itemController = new ItemController(             │
│     │   itemRepository, feedRepository                 │
│     │ )                                                 │
│     │ settingsController = new SettingsController(     │
│     │   settingsRepository                             │
│     │ )                                                 │
│     └─────────────────────────────────────┘              │
│              │                                             │
│              ▼                                             │
│  5. Register Routes (Inject Controllers)                  │
│     ┌─────────────────────────────────────┐              │
│     │ createAuthRoutes(app, authController, ...)       │
│     │ createFeedRoutes(app, feedController, ...)       │
│     │ createItemRoutes(app, itemController, ...)       │
│     │ createSettingsRoutes(app, settingsController, ..)│
│     └─────────────────────────────────────┘              │
│              │                                             │
│              ▼                                             │
│  ✅ All dependencies injected, server ready!             │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

## 📁 File Organization

```
backend/
│
├── server.js ─────────────────────────────────────────────── Legacy (working)
├── server-refactored.js ──────────────────────────────────── NEW (SOLID)
├── database.js ────────────────────────────────────────────── Legacy (wrapped by repos)
├── rss-proxy.js ───────────────────────────────────────────── Legacy service
│
├── data/
│   └── rss-reader.db ──────────────────────────────────────── SQLite database
│
└── src/
    │
    ├── services/ ──────────────────────────────────────────── Data & Business Logic
    │   ├── DatabaseService.js ──────────────────────────── Database initialization
    │   ├── UserRepository.js ───────────────────────────── User data access
    │   ├── FeedRepository.js ───────────────────────────── Feed data access
    │   ├── ItemRepository.js ───────────────────────────── Item data access
    │   ├── SettingsRepository.js ────────────────────────── Settings data access
    │   └── AuthenticationService.js ────────────────────── Auth business logic
    │
    ├── controllers/ ───────────────────────────────────────── Request Handlers
    │   ├── AuthController.js ───────────────────────────── Auth HTTP handlers
    │   ├── FeedController.js ───────────────────────────── Feed HTTP handlers
    │   ├── ItemController.js ───────────────────────────── Item HTTP handlers
    │   └── SettingsController.js ───────────────────────── Settings HTTP handlers
    │
    ├── routes/ ────────────────────────────────────────────── Endpoint Organization
    │   ├── authRoutes.js ────────────────────────────────── /api/auth/* endpoints
    │   ├── feedRoutes.js ────────────────────────────────── /api/feeds/* endpoints
    │   ├── itemRoutes.js ────────────────────────────────── /api/items/* endpoints
    │   └── settingsRoutes.js ────────────────────────────── /api/user-settings/*
    │
    └── middleware/ ─────────────────────────────────────────── Cross-Cutting Concerns
        ├── isAuthenticated.js ──────────────────────────── Auth verification
        ├── errorHandler.js ─────────────────────────────── Error handling
        └── logger.js ───────────────────────────────────── Request logging
```

## 🔄 Request Lifecycle

```
1. Browser/Client sends HTTP request
   GET /api/feeds with Authorization header

2. Express receives request, passes to middleware chain

3. Logger Middleware
   ✓ Log incoming request
   ✓ Start timer

4. isAuthenticated Middleware
   ✓ Check req.isAuthenticated()
   ✓ Verify user session exists
   ✓ Reject with 401 if not authenticated

5. Route Matching (feedRoutes.js)
   ✓ Match: GET /api/feeds → feedController.getAllFeeds()

6. FeedController.getAllFeeds(req, res)
   ✓ Extract userId from req.user.id
   ✓ Call: feedRepository.getAllFeeds(userId)
   ✓ Format response
   ✓ res.json({ success: true, data: feeds })

7. FeedRepository.getAllFeeds(userId)
   ✓ Validate userId
   ✓ Call: db.getAllFeeds(userId)
   ✓ Return feeds array

8. database.js.getAllFeeds(userId)
   ✓ Build SQL query
   ✓ Execute: SELECT * FROM rss_feeds WHERE user_id = ?
   ✓ Return results

9. SQLite Returns Data
   ✓ Query database
   ✓ Return rows

10. Response builds back up the chain
    FeedRepository ← database.js
    FeedController ← FeedRepository
    Express response ← FeedController

11. Logger Middleware
    ✓ Log response status (200)
    ✓ Log response time (45ms)
    ✓ Log response size

12. Express sends HTTP response to client
    { success: true, data: [...feeds], count: 10 }

13. Browser/Client receives and displays data
```

## ✨ Key Concepts

### Single Responsibility
```
❌ Before:
class MonolithicServer {
  // handles routing, auth, controllers, data access, error handling
  // 1088 lines in one file
}

✅ After:
class FeedRepository {
  // handles ONLY feed data access
}

class FeedController {
  // handles ONLY feed HTTP requests
}

class Logger {
  // handles ONLY logging
}
```

### Dependency Injection
```
❌ Before:
class Controller {
  constructor() {
    this.db = new Database(); // Creates its own dependency
  }
}

✅ After:
class Controller {
  constructor(repository) {
    this.repository = repository; // Receives dependency
  }
}

// Can easily mock for testing
const mockRepo = { getAllFeeds: () => [...] };
const controller = new Controller(mockRepo);
```

### Layered Architecture
```
┌─────────────────────────┐
│   HTTP Layer (Routes)   │ ← Easy to test, isolated
├─────────────────────────┤
│   Controller Layer      │ ← Business logic orchestration
├─────────────────────────┤
│   Service/Repository    │ ← Data access abstraction
├─────────────────────────┤
│   Database Layer        │ ← Data persistence
└─────────────────────────┘

Each layer can be tested independently with mocks above/below
```

## 🎯 Benefits Summary

```
┌──────────────────────────────────────────────────────┐
│ ✅ TESTABILITY                                        │
│ • Mock repositories for unit tests                   │
│ • Test controllers in isolation                      │
│ • 100% test coverage possible                        │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ ✅ MAINTAINABILITY                                    │
│ • Clear file organization                            │
│ • Each file has single responsibility                │
│ • Easy to find and fix bugs                          │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ ✅ SCALABILITY                                        │
│ • Add new endpoints without touching old code        │
│ • Add new repositories for new entities              │
│ • Add new middleware without modification            │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ ✅ FLEXIBILITY                                        │
│ • Easy to swap database (SQLite → PostgreSQL)        │
│ • Easy to add caching layer                          │
│ • Easy to add new authentication methods             │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ ✅ REUSABILITY                                        │
│ • Repositories reused by multiple controllers        │
│ • Services reused by multiple controllers            │
│ • Middleware reused across all routes                │
└──────────────────────────────────────────────────────┘
```
