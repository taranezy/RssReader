# RSS Reader - Quick Start Guide

## Application is Running! 🎉

Your RSS Reader application is now running at: **http://localhost:4200/**

## First Steps

### 1. Add Your First RSS Feed

1. Click the **"Manage Feeds"** button (green button at the top)
2. Enter an RSS feed URL in the input field
3. (Optional) Give it a custom title
4. Click **"Add Feed"**

### Test RSS Feeds (Copy & Paste These)

Here are some popular RSS feeds you can try:

**News**
- New York Times: `https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml`
- BBC News: `http://feeds.bbci.co.uk/news/rss.xml`
- CNN Top Stories: `http://rss.cnn.com/rss/edition.rss`

**Technology**
- TechCrunch: `https://techcrunch.com/feed/`
- The Verge: `https://www.theverge.com/rss/index.xml`
- Hacker News: `https://news.ycombinator.com/rss`

**Reddit**
- r/programming: `https://www.reddit.com/r/programming/.rss`
- r/technology: `https://www.reddit.com/r/technology/.rss`

**Blogs**
- CSS-Tricks: `https://css-tricks.com/feed/`
- Smashing Magazine: `https://www.smashingmagazine.com/feed/`

### 2. Refresh Feeds

After adding feeds, click:
- **"Refresh All"** button to fetch articles from all feeds
- Or click the **↻** button on individual feeds

### 3. Switch Views

Use the view toggle buttons in the header:
- **☰ List**: Traditional list view (all articles in one list)
- **⊞ Grid**: Netvibes-style widget view (each feed in its own colored box)

## Features to Explore

### Reading Articles

**List View:**
- Click any article to open it in an embedded viewer
- Click **"← Back to List"** to return
- Click the **○** or **✓** button to toggle read/unread status

**Grid View:**
- Each feed shows in a colored widget
- See the last 10 items from each feed
- Unread count badge appears on widgets with unread items

### Filtering Options

**Filter by Read Status:**
- Toggle **"○ All Items"** / **"● Unread Only"**

**Filter by Feed:**
- Click the feed dropdown (shows "All Feeds" or "X Selected")
- Check/uncheck specific feeds to filter

**Mark All as Read:**
- Click **"✓ Mark All Read"** to mark all visible items as read

### Feed Management

**In the Feed Manager:**
- **Color Square**: Click to change feed color
- **✓/✗ Toggle**: Activate/deactivate feeds
- **↻ Refresh**: Update this specific feed
- **✕ Remove**: Delete the feed and all its articles

## Tips & Tricks

1. **Start with 3-5 feeds** to see how it works
2. **Use different colors** for different categories of feeds
3. **Deactivate feeds** instead of deleting them if you want to keep the articles
4. **Grid view is great** for quick scanning of multiple feeds
5. **List view is better** for focused reading of all new items

## Troubleshooting

### Feed won't load?
- Check if the URL is a valid RSS/Atom feed
- Some feeds may be blocked by CORS policies
- Try refreshing the feed again

### No articles showing?
- Make sure you've clicked "Refresh All" or refreshed individual feeds
- Check that feeds are activated (green ✓)
- Verify filters aren't hiding items

### Application not saving data?
- Data is stored in browser localStorage
- Don't use incognito/private mode
- Clearing browser data will delete your feeds

## Data Storage

All your data is stored locally in your browser:
- No account needed
- No data sent to any server (except when fetching RSS feeds)
- Data persists between sessions
- To clear all data: Open browser console and run `localStorage.clear()`

## Keyboard Shortcuts

- Currently none implemented (potential future enhancement)

## SOLID Principles Implementation

This application follows SOLID principles:
- **S**ingle Responsibility: Each service has one clear purpose
- **O**pen/Closed: Services can be extended without modification
- **L**iskov Substitution: Interfaces are properly abstracted
- **I**nterface Segregation: Small, focused interfaces
- **D**ependency Inversion: Services depend on abstractions, not concretions

---

Enjoy your RSS Reader! 📰✨
