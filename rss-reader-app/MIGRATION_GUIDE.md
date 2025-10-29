# Migration from localStorage to SQLite

This document explains the changes made to migrate from browser localStorage to SQLite database.

## What Changed

### Before (localStorage)
- Data stored in browser's localStorage
- Limited to ~5-10 MB
- Browser-specific (data lost when clearing browser)
- Simple key-value storage
- Client-side only

### After (SQLite)
- Data stored in local SQLite database file
- No size limits
- Persistent across browsers
- Relational database with SQL queries
- Backend API with Express.js

## Architecture Changes

### New Components

1. **Backend Server** (`backend/server.js`)
   - Express.js REST API
   - Runs on port 3000
   - Handles all data operations

2. **Database Service** (`backend/database.js`)
   - SQLite operations
   - Database schema management
   - CRUD operations

3. **API Storage Service** (`src/app/services/api-storage.service.ts`)
   - Replaces `LocalStorageService`
   - HTTP client for API calls
   - Follows same interface pattern

### Modified Components

1. **RssFeedService** (`src/app/services/rss-feed.service.ts`)
   - Now uses `ApiStorageService` instead of `LocalStorageService`
   - All operations return Observables
   - Async/reactive approach

2. **Package.json**
   - Added backend dependencies
   - New scripts for concurrent servers
   - Development tools

### File Structure

```
rss-reader-app/
├── backend/                          # NEW
│   ├── data/                         # NEW - SQLite database location
│   │   └── rss-reader.db            # NEW - Created automatically
│   ├── database.js                   # NEW - Database operations
│   ├── server.js                     # NEW - Express server
│   └── package.json                  # NEW - Backend dependencies
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   ├── api-storage.service.ts      # NEW - API client
│   │   │   ├── local-storage.service.ts    # OLD - Still exists for reference
│   │   │   ├── rss-feed.service.ts         # MODIFIED - Uses API
│   │   │   ├── rss-parser.service.ts       # UNCHANGED
│   │   │   └── rss-feed-fetcher.service.ts # UNCHANGED
│   │   └── ...
│   └── environments/
│       ├── environment.ts             # NEW - API URL configuration
│       └── environment.prod.ts        # NEW - Production config
└── ...
```

## Data Migration

### Automatic Migration (if needed)

If you want to preserve existing localStorage data, you can create a migration script:

```typescript
// migration.service.ts
import { Injectable } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { ApiStorageService } from './api-storage.service';

@Injectable({
  providedIn: 'root'
})
export class MigrationService {
  constructor(
    private localStorage: LocalStorageService,
    private apiStorage: ApiStorageService
  ) {}

  async migrateData(): Promise<void> {
    // Get data from localStorage
    const feeds = this.localStorage.load('rss_feeds');
    const items = this.localStorage.load('rss_items');
    const prefs = this.localStorage.load('feed_preferences');

    // Migrate feeds
    if (feeds && feeds.length > 0) {
      for (const feed of feeds) {
        await this.apiStorage.createFeed(feed).toPromise();
      }
    }

    // Migrate items
    if (items && items.length > 0) {
      await this.apiStorage.createItems(items).toPromise();
    }

    // Migrate preferences
    if (prefs) {
      await this.apiStorage.updatePreferences(prefs).toPromise();
    }

    // Clear localStorage after successful migration
    this.localStorage.clear();
  }
}
```

## Breaking Changes

### Service Injection

**Before:**
```typescript
constructor(private storage: LocalStorageService) {}
```

**After:**
```typescript
constructor(private apiStorage: ApiStorageService) {}
```

### Synchronous vs Asynchronous

**Before (Synchronous):**
```typescript
// Direct operation
this.storage.save('key', data);
const data = this.storage.load('key');
```

**After (Asynchronous):**
```typescript
// Observable-based
this.apiStorage.createFeed(feed).subscribe(result => {
  // Handle result
});

this.apiStorage.getAllFeeds().subscribe(feeds => {
  // Use feeds
});
```

## Configuration

### Environment Variables

**Development** (`environment.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

**Production** (`environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api'
};
```

## Running the Application

### Development Mode

```bash
# Start both servers
npm start

# Or start separately:
npm run start:backend    # Backend on port 3000
npm run start:frontend   # Frontend on port 4200
```

### Production Build

```bash
# Build Angular app
ng build --configuration production

# The backend can serve static files
# Modify server.js to serve from dist/
```

## Testing

### Test Backend API

```bash
# Health check
curl http://localhost:3000/api/health

# Get all feeds
curl http://localhost:3000/api/feeds

# Get all items
curl http://localhost:3000/api/items
```

### Test Frontend

1. Open http://localhost:4200
2. Add a feed
3. Check backend database file:
   - Location: `backend/data/rss-reader.db`
   - Use SQLite browser to inspect

## Advantages of New Architecture

1. **Scalability**: Easy to add authentication, multi-user support
2. **Performance**: Database indexes, optimized queries
3. **Data Integrity**: Foreign keys, constraints, transactions
4. **Portability**: Database file can be backed up, shared
5. **No Browser Limits**: Unlimited storage
6. **Future-Ready**: Can migrate to PostgreSQL, MySQL later

## SOLID Principles Maintained

- **SRP**: Each service has one responsibility
- **OCP**: Services use interfaces, open for extension
- **LSP**: ApiStorageService can replace LocalStorageService
- **ISP**: Focused interfaces for specific operations
- **DIP**: High-level modules depend on abstractions

## Rollback (if needed)

To rollback to localStorage version:

1. Checkout the backup service:
   ```bash
   git checkout HEAD~1 src/app/services/rss-feed.service.ts
   ```

2. Change injection back to LocalStorageService

3. Remove backend start from npm scripts

## Support

For issues or questions:
- Check backend logs in terminal
- Inspect SQLite database file
- Verify API endpoints are responding
- Check CORS configuration

---

**Migration Complete!** Your RSS Reader now uses SQLite for persistent, file-based storage. 🎉
