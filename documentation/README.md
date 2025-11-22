# RSS Reader

A modern, full-stack RSS feed reader application with Google OAuth authentication, built with Angular and Node.js.

## 🚀 Features

- **Modern UI:** Clean, responsive Angular 18 interface
- **Google OAuth:** Secure authentication via Google
- **RSS Feed Management:** Add, organize, and read RSS feeds
- **SQLite Database:** Lightweight, file-based database
- **Docker Deployment:** Production-ready containerized setup
- **CI/CD Pipeline:** Automated testing and deployment via GitHub Actions

## 📋 Quick Links

- **Live App:** https://taranezy.ddns.net:8444
- **CI/CD Documentation:** [CICD_GUIDE.md](./CICD_GUIDE.md)
- **Deployment Guide:** [rss-reader-app/DEPLOY_ANDROMEDA.md](./rss-reader-app/DEPLOY_ANDROMEDA.md)

## 🛠️ Technology Stack

### Frontend
- Angular 18
- TypeScript
- RxJS
- Angular Material (optional)

### Backend
- Node.js
- Express.js
- Passport.js (Google OAuth)
- better-sqlite3

### Infrastructure
- Docker & Docker Compose
- Nginx (reverse proxy)
- Let's Encrypt (SSL certificates)
- GitHub Actions (CI/CD)

## 🏗️ Project Structure

```
RssReader/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD workflows
│       ├── deploy.yml      # Main deployment pipeline
│       └── pr-validation.yml
├── rss-reader-app/         # Main application directory
│   ├── src/                # Angular frontend source
│   └── backend/            # Node.js backend
│       ├── server.js       # Express server
│       ├── database.js     # SQLite database service
│       └── package.json    # Backend dependencies
├── backup/                 # Database backup scripts
│   └── backup-database.ps1
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.prod.yml # Production container orchestration
├── CICD_GUIDE.md          # Complete CI/CD documentation
└── README.md              # This file
```

## 🚦 Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/taranezy/RssReader.git
   cd RssReader/rss-reader-app
   ```

2. **Install dependencies:**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   npm install
   cd ..
   ```

3. **Configure environment:**
   Create a `.env` file in `rss-reader-app/backend/`:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   SESSION_SECRET=your_session_secret
   ```

4. **Run development servers:**
   ```bash
   # Frontend (from rss-reader-app/)
   npm start
   
   # Backend (from rss-reader-app/backend/)
   npm run dev
   ```

5. **Access the app:**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000

### Production Deployment

See [CICD_GUIDE.md](./CICD_GUIDE.md) for complete deployment instructions.

**Quick deploy:**
```bash
git push origin main
```
GitHub Actions will automatically deploy to production!

## 📦 Docker Deployment

### Build and Run

```bash
# Build the image
docker-compose -f docker-compose.prod.yml build

# Start containers
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker logs rss-reader-app
```

### Stop Containers

```bash
docker-compose -f docker-compose.prod.yml down
```

## 🔧 Maintenance

### Database Backup

Run the automated backup script (Windows):
```powershell
.\backup\backup-database.ps1
```

This creates versioned backups with MD5 verification.

### Update Dependencies

```bash
# Frontend
cd rss-reader-app
npm update

# Backend
cd backend
npm update
```

### View Logs

```bash
# Backend logs
docker logs rss-reader-app --tail=100 -f

# Nginx logs
docker logs rss-reader-nginx --tail=100 -f

# All containers
docker-compose -f docker-compose.prod.yml logs -f
```

## 🧪 Testing

```bash
cd rss-reader-app

# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

## 📝 CI/CD Pipeline

The project uses GitHub Actions for automated deployment:

1. **Test Stage:** Linting, building, testing
2. **Deploy Stage:** SSH to server, build Docker, restart containers
3. **Notify Stage:** Deployment status

**Pipeline Status:** ✅ Active

See [CICD_GUIDE.md](./CICD_GUIDE.md) for detailed documentation.

## 🔐 Security

- Google OAuth for authentication
- SSH key-based deployment
- SSL/TLS via Let's Encrypt
- Session management with secure cookies
- Environment variables for secrets

## 📄 License

MIT

## 👤 Author

**Boris Taranezy**

## 🐛 Troubleshooting

### Common Issues

**502 Bad Gateway:**
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Restart containers
docker-compose -f docker-compose.prod.yml restart
```

**Module not found errors:**
```bash
# Rebuild without cache
docker-compose -f docker-compose.prod.yml build --no-cache
```

**Database issues:**
```bash
# Check database file permissions
ls -la rss-reader-app/backend/data/

# Restore from backup
cp backup/rss-reader_XXX.db rss-reader-app/backend/data/rss-reader.db
```

See [CICD_GUIDE.md](./CICD_GUIDE.md) for more troubleshooting tips.

## 📚 Additional Documentation

- [CI/CD Complete Guide](./CICD_GUIDE.md) - Deployment automation
- [Backend API Documentation](./rss-reader-app/backend/README.md) - API endpoints
- [Security Setup](./rss-reader-app/SECURITY.md) - Security configuration
- [Deployment Guide](./rss-reader-app/DEPLOY_ANDROMEDA.md) - Server setup

---

**Status:** ✅ Production Ready  
**Last Updated:** November 5, 2025
