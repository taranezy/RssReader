# RSS Reader with SQLite Backend

This RSS Reader application now uses **SQLite database** for local file storage instead of browser localStorage. Each user who installs the app will have their own local SQLite database file.

## Architecture

### Frontend (Angular)
- **Port**: 4200
- **Framework**: Angular 19
- **Communicates**: REST API to backend

### Backend (Node.js + Express)
- **Port**: 3000
- **Framework**: Express.js
- **Database**: SQLite3 (better-sqlite3)
- **Storage**: Local file `backend/data/rss-reader.db`

## Database Schema

### Tables

#### `rss_feeds`
- `id` (TEXT PRIMARY KEY) - Unique feed identifier
- `url` (TEXT NOT NULL UNIQUE) - RSS feed URL
- `title` (TEXT NOT NULL) - Feed title
- `description` (TEXT) - Feed description
- `color` (TEXT NOT NULL) - Display color
- `is_active` (INTEGER) - Active status (1/0)
- `last_fetched` (TEXT) - Last fetch timestamp
- `added_date` (TEXT NOT NULL) - Date added
- `created_at` (DATETIME) - Record creation time
- `updated_at` (DATETIME) - Last update time

#### `rss_items`
- `id` (TEXT PRIMARY KEY) - Unique item identifier
- `feed_id` (TEXT NOT NULL) - Foreign key to rss_feeds
- `feed_title` (TEXT NOT NULL) - Feed name
- `title` (TEXT NOT NULL) - Article title
- `link` (TEXT NOT NULL) - Article URL
- `description` (TEXT) - Article description
- `pub_date` (TEXT NOT NULL) - Publication date
- `is_read` (INTEGER) - Read status (1/0)
- `author` (TEXT) - Author name
- `categories` (TEXT) - JSON array of categories
- `content` (TEXT) - Full article content
- `created_at` (DATETIME) - Record creation time
- `updated_at` (DATETIME) - Last update time

#### `user_preferences`
- `id` (INTEGER PRIMARY KEY) - Preference ID
- `view_type` (TEXT) - 'list' or 'grid'
- `selected_feeds` (TEXT) - JSON array of selected feed IDs
- `show_only_unread` (INTEGER) - Unread filter (1/0)
- `updated_at` (DATETIME) - Last update time

### Indexes
- `idx_items_feed_id` - Fast feed item lookups
- `idx_items_pub_date` - Fast date sorting
- `idx_items_is_read` - Fast read/unread filtering
- `idx_feeds_is_active` - Fast active feed filtering

## API Endpoints

### Feeds
- `GET /api/feeds` - Get all feeds
- `GET /api/feeds/:id` - Get single feed
- `POST /api/feeds` - Create new feed
- `PUT /api/feeds/:id` - Update feed
- `DELETE /api/feeds/:id` - Delete feed (cascades to items)

### Items
- `GET /api/items` - Get all items
- `GET /api/feeds/:feedId/items` - Get items for specific feed
- `POST /api/items` - Create single item
- `POST /api/items/bulk` - Create multiple items
- `PUT /api/items/:id` - Update item (mark read/unread)
- `POST /api/items/mark-all-read` - Mark all items as read

### Preferences
- `GET /api/preferences` - Get user preferences
- `PUT /api/preferences` - Update preferences

### Health
- `GET /api/health` - Server health check

## Getting Started

### Installation

1. All dependencies are already installed. If you need to reinstall:
```bash
cd rss-reader-app
npm install
```

### Running the Application

The application now runs both servers concurrently:

```bash
npm start
```

This will start:
- **Backend server** on `http://localhost:3000`
- **Frontend server** on `http://localhost:4200`

### Running Servers Separately

**Backend only:**
```bash
npm run start:backend
```

**Frontend only:**
```bash
npm run start:frontend
```

**Backend with auto-reload (development):**
```bash
npm run start:backend:dev
```

## Database Location

The SQLite database file is created at:
```
rss-reader-app/backend/data/rss-reader.db
```

This file persists all your data across application restarts.

### Database Management

**View database contents:**
You can use any SQLite browser tool like:
- [DB Browser for SQLite](https://sqlitebrowser.org/)
- [SQLite Studio](https://sqlitestudio.pl/)
- Command line: `sqlite3 backend/data/rss-reader.db`

**Backup database:**
```bash
copy backend\data\rss-reader.db backend\data\rss-reader-backup.db
```

**Reset database:**
```bash
Remove-Item backend\data\rss-reader.db
```
The database will be recreated on next server start.

## Benefits of SQLite Storage

### ✅ Advantages
1. **True File Storage**: Data stored in actual file, not browser storage
2. **No Size Limits**: Unlike localStorage (5-10MB limit)
3. **Better Performance**: Indexed queries, transactions
4. **Portability**: Easy to backup, share, or migrate
5. **SQL Queries**: Complex filtering and sorting
6. **Data Integrity**: Foreign keys, constraints
7. **Multi-user Ready**: Can add authentication later

### 📊 vs localStorage
| Feature | SQLite | localStorage |
|---------|--------|--------------|
| Storage Type | File-based | Browser-based |
| Size Limit | No limit | 5-10 MB |
| Speed | Very fast (indexed) | Fast (key-value) |
| Queries | SQL | Key lookup only |
| Backup | Copy file | Export/Import |
| Sharing | Easy | Difficult |
| Persistence | Permanent | Per browser |

## SOLID Principles Maintained

The new architecture still follows SOLID principles:

### Services
1. **ApiStorageService** - Handles all HTTP communication (SRP)
2. **RssFeedService** - Orchestrates feed operations (SRP, DIP)
3. **RssParserService** - Parses RSS/Atom feeds (SRP)
4. **RssFeedFetcherService** - Fetches external RSS feeds (SRP)

### Backend
1. **DatabaseService** - Handles all SQLite operations (SRP)
2. **Express Routes** - RESTful API endpoints (OCP)
3. **Middleware** - CORS, body parsing, logging (SRP)

## Development

### Adding New API Endpoints

1. Add method to `backend/database.js`
2. Add route to `backend/server.js`
3. Add method to `ApiStorageService`
4. Use in `RssFeedService`

### Example: Add Search Functionality

**Backend (database.js):**
```javascript
searchItems(query) {
  return this.db.prepare(`
    SELECT * FROM rss_items 
    WHERE title LIKE ? OR description LIKE ?
    ORDER BY pub_date DESC
  `).all(`%${query}%`, `%${query}%`);
}
```

**Backend (server.js):**
```javascript
app.get('/api/items/search', (req, res) => {
  const { q } = req.query;
  const items = db.searchItems(q);
  res.json(items.map(i => db.convertItemFromDb(i)));
});
```

**Frontend (api-storage.service.ts):**
```typescript
searchItems(query: string): Observable<RssItem[]> {
  return this.http.get<RssItem[]>(`${this.apiUrl}/items/search?q=${query}`);
}
```

## Troubleshooting

### Backend won't start
- Check if port 3000 is available
- Check backend logs for errors
- Verify database directory exists

### Frontend can't connect to backend
- Ensure backend is running on port 3000
- Check CORS configuration
- Verify API URL in `environment.ts`

### Database locked error
- Close any SQLite browser tools
- Restart the backend server
- Check file permissions

## Production Deployment

For production, you would:

1. Build the Angular app: `ng build --configuration production`
2. Serve static files from Express
3. Use environment variables for configuration
4. Add authentication/authorization
5. Use process manager (PM2, forever)
6. Set up proper backup strategy

---

Built with ❤️ using Angular, Express, and SQLite
Following SOLID principles
