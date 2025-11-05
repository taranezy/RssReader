# RSS Reader API Calls

Documentation of all API endpoints and HTTP methods used in the RSS Reader application.

---

## Base URL
```
http://localhost:3000/api
```
or environment-configured API URL with credentials enabled (`withCredentials: true`)

---

## Feeds

### Get All Feeds
- **Method**: `GET`
- **Endpoint**: `/feeds`
- **Returns**: `RssFeed[]`
- **Error Handling**: Returns empty array on error
- **Service Method**: `getAllFeeds()`

### Get Feed by ID
- **Method**: `GET`
- **Endpoint**: `/feeds/{id}`
- **Parameters**: 
  - `id` (string): Feed identifier
- **Returns**: `RssFeed | null`
- **Error Handling**: Returns null on error
- **Service Method**: `getFeedById(id: string)`

### Create Feed
- **Method**: `POST`
- **Endpoint**: `/feeds`
- **Body**: `RssFeed`
- **Returns**: `RssFeed`
- **Service Method**: `createFeed(feed: RssFeed)`

### Update Feed
- **Method**: `PUT`
- **Endpoint**: `/feeds/{id}`
- **Parameters**: 
  - `id` (string): Feed identifier
- **Body**: `Partial<RssFeed>` (partial updates allowed)
- **Returns**: `RssFeed`
- **Service Method**: `updateFeed(id: string, updates: Partial<RssFeed>)`

### Delete Feed
- **Method**: `DELETE`
- **Endpoint**: `/feeds/{id}`
- **Parameters**: 
  - `id` (string): Feed identifier
- **Returns**: `void`
- **Service Method**: `deleteFeed(id: string)`

---

## Items (RSS Articles)

### Get All Items
- **Method**: `GET`
- **Endpoint**: `/items`
- **Returns**: `RssItem[]`
- **Date Processing**: Converts pubDate strings to Date objects
- **Error Handling**: Returns empty array on error
- **Service Method**: `getAllItems()`

### Get Items by Feed
- **Method**: `GET`
- **Endpoint**: `/feeds/{feedId}/items`
- **Parameters**: 
  - `feedId` (string): Feed identifier
- **Returns**: `RssItem[]`
- **Date Processing**: Converts pubDate strings to Date objects
- **Error Handling**: Returns empty array on error
- **Service Method**: `getItemsByFeed(feedId: string)`

### Create Single Item
- **Method**: `POST`
- **Endpoint**: `/items`
- **Body**: `RssItem`
- **Returns**: `RssItem`
- **Service Method**: `createItem(item: RssItem)`

### Create Multiple Items (Bulk)
- **Method**: `POST`
- **Endpoint**: `/items/bulk`
- **Body**: `RssItem[]`
- **Returns**: `{ created: number }`
- **Service Method**: `createItems(items: RssItem[])`

### Update Item
- **Method**: `PUT`
- **Endpoint**: `/items/{id}`
- **Parameters**: 
  - `id` (string): Item identifier
- **Body**: `Partial<RssItem>` (partial updates allowed)
- **Returns**: `{ success: boolean }`
- **Service Method**: `updateItem(id: string, updates: Partial<RssItem>)`

### Mark All Items as Read
- **Method**: `POST`
- **Endpoint**: `/items/mark-all-read`
- **Body**: `{ feedId?: string }`
- **Returns**: `{ success: boolean }`
- **Description**: Marks all items as read. If `feedId` is provided, only items in that feed are marked.
- **Service Method**: `markAllAsRead(feedId?: string)`

---

## User Preferences

### Get Preferences
- **Method**: `GET`
- **Endpoint**: `/preferences`
- **Returns**: `FeedViewPreference`
- **Default Response on Error**:
  ```typescript
  {
    viewType: 'list',
    selectedFeeds: [],
    showOnlyUnread: false
  }
  ```
- **Service Method**: `getPreferences()`

### Update Preferences
- **Method**: `PUT`
- **Endpoint**: `/preferences`
- **Body**: `FeedViewPreference`
- **Returns**: `FeedViewPreference`
- **Service Method**: `updatePreferences(preferences: FeedViewPreference)`

---

## User Settings

### Export Data
- **Method**: `GET`
- **Endpoint**: `/export`
- **Returns**: `Blob` (XML file)
- **Description**: Exports all user data (feeds, items, settings) in XML format
- **Service Method**: `exportData()` in UserSettingsService

### Import Data
- **Method**: `POST`
- **Endpoint**: `/import`
- **Body**: `{ xmlData: string }`
- **Returns**: `{ feedsImported: number, itemsImported: number }`
- **Description**: Imports user data from XML, replaces all existing data
- **Service Method**: `importData(xmlData: string)` in UserSettingsService

---

## Health & Status

### Health Check
- **Method**: `GET`
- **Endpoint**: `/health`
- **Returns**: `{ status: string; timestamp: string }`
- **Service Method**: `healthCheck()`

---

## Data Models

### RssFeed
```typescript
{
  id: string;
  title: string;
  url: string;
  description?: string;
  category?: string;
  backgroundColor?: string;
  color?: string;
  // ... other properties
}
```

### RssItem
```typescript
{
  id: string;
  feedId: string;
  title: string;
  description: string;
  pubDate: Date;
  link: string;
  isRead: boolean;
  // ... other properties
}
```

### FeedViewPreference
```typescript
{
  viewType: 'list' | 'grid';
  selectedFeeds: string[];
  showOnlyUnread: boolean;
}
```

---

## Authentication
- **Type**: Cookie-based (credentials)
- **Flag**: `withCredentials: true` on all requests
- **Required**: User must be authenticated to access most endpoints

---

## Error Handling
- Most endpoints have built-in error handling with appropriate fallbacks
- Failed requests typically return empty collections or null values
- Errors are logged to console for debugging
- Export/Import operations have specific error handling and user confirmations

