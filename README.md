# RSS Reader

A self-hosted, privacy-focused RSS feed aggregator with a modern Angular frontend and Node.js backend.

## Overview

RSS Reader is a feature-rich RSS feed management application that allows you to:

- 📰 **Aggregate Feeds**: Subscribe to and organize multiple RSS feeds
- 🔒 **Privacy First**: Self-hosted, no data sent to third parties
- 🌙 **Dark Mode**: Beautiful, responsive UI with dark mode support
- 🏷️ **Organization**: Create categories and organize your feeds
- ⭐ **Favorites**: Mark important articles for quick reference
- 🔐 **Authentication**: Google OAuth and demo login support
- 🚀 **Performance**: Redis caching and optimized database queries

## 🎯 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Git

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/taranezy/RssReader.git
   cd RssReader
   ```

2. **Install dependencies:**
   ```bash
   cd rss-reader-app
   npm install
   npm install --prefix backend
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start development servers:**
   ```bash
   npm start
   # Frontend: http://localhost:4200
   # Backend: http://localhost:3000
   ```

### Docker Compose (Development)

```bash
cd rss-reader-app
docker-compose up
```

Access the application at `http://localhost:3000`

## 🚀 Production Deployment

### Architecture

```
Internet Traffic
       ↓
┌─────────────────────┐
│  Nginx Reverse Proxy │  ← Separate project/repo
│  (SSL Termination)   │  https://github.com/taranezy/nginx-reverse-proxy
└─────────────────────┘
       ↓
  Docker Network (reverse-proxy)
       ↓
┌─────────────────────┐
│   RSS Reader App    │
│  (This Project)     │
└─────────────────────┘
```

### Deployment Steps

**Important**: Nginx is now managed as a separate project for easier scalability and multi-site support.

1. **Deploy Nginx Reverse Proxy** (first, from separate repo):
   ```bash
   git clone https://github.com/taranezy/nginx-reverse-proxy.git
   # Follow: nginx-reverse-proxy/DEPLOYMENT.md
   ```

2. **Create shared Docker network:**
   ```bash
   docker network create reverse-proxy
   ```

3. **Deploy RSS Reader:**
   ```bash
   docker-compose -f docker-compose-update.yml up -d
   ```

4. **Configure Nginx** (in nginx-reverse-proxy project):
   ```bash
   # Add upstream and SSL config
   # See: NGINX_INTEGRATION.md for details
   ```

For detailed deployment instructions, see [NGINX_INTEGRATION.md](NGINX_INTEGRATION.md)

## 📁 Project Structure

```
RssReader/
├── rss-reader-app/              # Main application
│   ├── src/                     # Angular frontend
│   │   ├── app/                 # Angular components
│   │   ├── assets/              # Static files
│   │   └── index.html           # Entry point
│   ├── backend/                 # Node.js backend
│   │   ├── src/
│   │   │   ├── controllers/     # Route handlers
│   │   │   ├── services/        # Business logic
│   │   │   └── models/          # Data models
│   │   ├── server.js            # Express server
│   │   └── package.json
│   ├── Dockerfile               # Multi-stage build
│   ├── docker-compose.yml       # Development
│   └── proxy.conf.json          # Dev proxy config
├── docker-compose-update.yml    # Production (app only)
├── Dockerfile                   # Alternative build
├── NGINX_INTEGRATION.md         # Nginx setup guide
└── documentation/               # Additional docs
```

## ⚙️ Configuration

### Environment Variables

Create `.env` file:

```env
# Server
NODE_ENV=production
PORT=3000

# Frontend
FRONTEND_URL=https://streamlet.taranezy.com/

# Google OAuth (required for Google login)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://streamlet.taranezy.com/api/auth/google/callback

# Session
SESSION_SECRET=your-very-secure-random-string

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Database

- **Type**: SQLite (file-based)
- **Location**: `/app/backend/data/database.db`
- **Persistence**: Docker volume `rss-data`

### Caching

- **Optional**: Redis for feed caching
- **Fallback**: System gracefully degrades without Redis

## 🔑 Features

### Feed Management
- Subscribe to RSS/Atom feeds
- Automatic feed updates
- Feed categories and organization
- Unread count tracking

### Article Features
- Mark as read/unread
- Save favorites
- Search across feeds
- Full-text content display

### User Management
- Google OAuth authentication
- Demo user with sample feeds
- Session management
- Secure cookie handling

### Security
- HTTPS/TLS termination (via nginx)
- CORS protection
- Rate limiting (via nginx)
- Session tokens
- Secure cookies

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm test

# E2E tests
npm run e2e

# Build for production
npm run build
```

### Demo User

Click "Demo Login" to test the application with sample feeds.

## 📊 Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:3000/api/health

# Frontend status
curl http://localhost:4200/
```

### Logs

```bash
# Development
npm start  # Both frontend and backend logs

# Docker
docker-compose logs -f
docker logs rss-reader-app
```

### Database

Check database integrity:

```bash
docker exec rss-reader-app node backend/scripts/check_db.js
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 <PID>
```

### Database Locked

```bash
# Restart container
docker-compose restart rss-reader-app

# Or delete database (dev only)
rm -f rss-reader-app/backend/data/database.db
```

### Google OAuth Issues

1. Check credentials in `.env`
2. Verify callback URL matches Google Console
3. Check browser console for CORS errors

### Frontend Can't Connect to Backend

1. Verify backend is running: `curl http://localhost:3000`
2. Check `proxy.conf.json` routes to correct backend
3. Review browser network tab for failed requests

## 🔄 CI/CD Pipeline

The project uses GitHub Actions for:
- **Testing**: Unit tests on all PRs
- **Building**: Docker image build and push
- **Deployment**: Automated deployment to production

See [.github/workflows/](/.github/workflows/) for pipeline configuration.

### Manual Deployment

```bash
# Deploy to production server
npm run deploy:remote

# Check deployment status
npm run health-check
```

## 📚 Documentation

- [NGINX_INTEGRATION.md](NGINX_INTEGRATION.md) - Nginx setup and configuration
- [documentation/CICD_GUIDE.md](documentation/CICD_GUIDE.md) - CI/CD pipeline details
- [documentation/ARCHITECTURE.md](documentation/ARCHITECTURE.md) - System design
- [rss-reader-app/README.md](rss-reader-app/README.md) - App-specific details

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

See [CONTRIBUTING.md](documentation/CONTRIBUTING.md) for guidelines.

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Angular framework
- Node.js & Express
- SQLite database
- Nginx reverse proxy
- Let's Encrypt SSL certificates

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/taranezy/RssReader/issues)
- **Documentation**: See [documentation/](documentation/) folder
- **Nginx Issues**: [nginx-reverse-proxy repo](https://github.com/taranezy/nginx-reverse-proxy)

## 🔗 Related Projects

- **Nginx Reverse Proxy**: https://github.com/taranezy/nginx-reverse-proxy
- **RSS Reader Android**: https://github.com/taranezy/RssReaderAndroid

---

**Last Updated**: 2025-01-02  
**Version**: 1.0.0  
**Maintainer**: @taranezy
