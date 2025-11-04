# RSS Reader Application

A modern, self-hosted RSS reader web application built with Angular, inspired by Netvibes. Features multi-user authentication via Google OAuth, feed organization, and a beautiful interface with list, grid, and suggested feeds views.

## 🌟 Features

### Core Functionality
- **Multi-User Support**: Google OAuth authentication with session management
- **Add RSS Feeds**: Subscribe to any RSS/Atom feed by URL
- **Three View Modes**:
  - **List View**: Traditional list showing all news items ordered by date
  - **Grid View**: Netvibes-style widget layout with colored boxes
  - **Suggested Feeds**: Discover 100+ curated RSS feeds with smart recommendations
- **Feed Organization**: 
  - Organize feeds into folders/categories
  - Drag & drop to reorder and categorize
  - Collapsible sidebar navigation
- **Read/Unread Tracking**: Mark articles as read/unread
- **Feed Management**: Add, edit, move, delete feeds with custom modals
- **Color Coding**: Each feed has a unique color for easy identification
- **Filtering**: Filter by feeds, show unread only, mark all as read
- **Article Viewer**: Read articles in embedded iframe

### Technical Features
- Built with **Angular 19** (standalone components)
- **Backend**: Node.js/Express with Passport.js
- **Database**: SQLite for data persistence
- **Authentication**: Google OAuth 2.0 with session cookies
- **Docker**: Full containerization support
- **Deployment**: Automated deployment scripts for Linux servers  - Open/Closed Principle (OCP)ng generate --help

  - Liskov Substitution Principle (LSP)```

  - Interface Segregation Principle (ISP)

  - Dependency Inversion Principle (DIP)## Building

- **Standalone Components** (modern Angular approach)

- **Reactive Programming** with RxJSTo build the project run:

- **Type-safe** with TypeScript

- **Responsive Design** - works on desktop, tablet, and mobile```bash

- **No Database Required** - uses localStorage for data persistenceng build

```

## 🚀 Quick Start

### Development (Local)

```bash
# Install dependencies
npm install

# Start both frontend and backend
npm start
```

The app will be available at:
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000

### Production (Docker on Andromeda Server)

See detailed guides:
- **[QUICKSTART.md](./QUICKSTART.md)** - Fast deployment guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete documentation
- **[DEPLOYMENT_OVERVIEW.md](./DEPLOYMENT_OVERVIEW.md)** - Feature overview

**Quick Deploy:**
```powershell
# 1. Configure environment
Copy-Item .env.example .env
notepad .env  # Update with your settings

# 2. Test deployment
npm run deploy:test

# 3. Deploy to andromeda
npm run deploy
```

## 📦 Prerequisites

### Development
- Node.js (v18 or higher)
- npm (comes with Node.js)

### Production Deployment
- Docker Desktop (Windows)
- SSH access to andromeda server
- Docker & Docker Compose installed on andromeda

## 🎯 Usage

### Authentication
1. Navigate to the application
2. Click "Sign in with Google"
3. Authorize with your Google account

### Managing Feeds
- **Add Feed**: Click + button in sidebar, enter RSS URL
- **Edit Feed**: Right-click feed → Edit
- **Move to Folder**: Right-click feed → Move to Folder
- **Drag & Drop**: Drag feeds between categories
- **Delete**: Right-click feed → Delete

### Viewing Content
- **List View**: All articles in chronological order
- **Grid View**: Feed widgets in customizable grid
- **Suggested Feeds**: Discover 100+ curated feeds

### Feed Discovery
1. Click "✨ Suggested" tab
2. Browse by category or search
3. Click + button to add feed
4. Feed appears in your sidebar

## 🛠️ Available Commands

### Development
```bash
npm start              # Start dev servers (frontend + backend)
npm run start:frontend # Angular dev server only
npm run start:backend  # Express server only
npm run build          # Build Angular app
npm run build:prod     # Production build
```

### Docker & Deployment
```bash
npm run docker:build   # Build Docker image
npm run docker:run     # Start container locally
npm run docker:stop    # Stop container
npm run docker:logs    # View container logs
npm run deploy:test    # Test deployment setup
npm run deploy         # Deploy to andromeda
npm run health-check   # Check application health
```

### Using Make (Optional)
```bash
make build             # Build Docker image
make run               # Run container
make deploy            # Deploy to andromeda
make logs              # View logs
make backup            # Backup database
make clean             # Clean Docker resources
```

## 📖 Documentation

- **[DEPLOYMENT_OVERVIEW.md](./DEPLOYMENT_OVERVIEW.md)** - Complete deployment feature overview
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick deployment guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Detailed deployment documentation
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[.github/ACTIONS.md](./.github/ACTIONS.md)** - GitHub Actions CI/CD setup

## 🏗️ Architecture

### Frontend (Angular 19)
- Standalone components
- RxJS for reactive state management
- Custom modals and drag & drop
- Three view modes: List, Grid, Suggested

### Backend (Node.js/Express)
- REST API
- Passport.js authentication (Google OAuth)
- Session-based cookies
- SQLite database

### Database Schema
- **users**: User accounts from OAuth
- **rss_feeds**: Feed subscriptions (per user)
- **rss_items**: Cached articles
- **user_preferences**: User settings

### Services (SOLID Principles)
1. **AuthService**: Authentication and user management
2. **RssFeedService**: Feed management and CRUD
3. **RssParserService**: RSS/Atom feed parsing
4. **ApiStorageService**: Backend API communication
5. **DatabaseService**: SQLite operations

## 🐳 Docker Deployment

### Local Testing
```powershell
# Build and test locally
npm run docker:build
npm run docker:run

# Verify
npm run health-check

# Stop
npm run docker:stop
```

### Deploy to Andromeda
```powershell
# One-command deployment
npm run deploy

# Or with custom parameters
.\deploy.ps1 -RemoteServer "andromeda" -RemoteUser "your-username"
```

The deployment script will:
1. ✅ Build optimized Docker image
2. ✅ Save to compressed archive
3. ✅ Upload to andromeda
4. ✅ Deploy with docker-compose
5. ✅ Verify deployment
6. ✅ Clean up temporary files

## 🔒 Security

- Google OAuth 2.0 authentication
- Session-based security with httpOnly cookies
- SQL injection protection
- CORS configuration
- Environment variable protection

**Important**: Update `.env` with secure values before production deployment!

## 📊 Popular RSS Feeds

Add these popular feeds to get started:

**News:**
- New York Times: https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml
- BBC News: http://feeds.bbci.co.uk/news/rss.xml
- The Guardian: https://www.theguardian.com/world/rss

**Technology:**
- TechCrunch: https://techcrunch.com/feed/
- Hacker News: https://news.ycombinator.com/rss
- The Verge: https://www.theverge.com/rss/index.xml

**Programming:**
- DEV Community: https://dev.to/feed
- CSS-Tricks: https://css-tricks.com/feed
- Smashing Magazine: https://www.smashingmagazine.com/feed

Or explore 100+ curated feeds in the **Suggested Feeds** tab!

## 🤝 Contributing

This is a personal project, but feel free to fork and customize for your needs.

## 📝 License

This project is for personal use.

---

**Built with ❤️ using Angular 19, Node.js, and Docker**

For deployment questions, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)