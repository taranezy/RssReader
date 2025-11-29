# Git Server Deployment Guide

## Quick Start

### 1. Clone Repository
```bash
cd /home/boris/rss-reader
git clone <your-repo-url> rss-reader-app
cd rss-reader-app
```

### 2. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit with your production values
nano .env
# Update:
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - FRONTEND_URL (if different from default)
# - SESSION_SECRET (generate a random string)
```

**Generate secure SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Deploy with Docker

**Option A: Using docker-compose.prod.yml (Recommended)**
```bash
cd /home/boris/rss-reader/rss-reader-app
docker-compose -f docker-compose.prod.yml up -d
```

**Option B: Using main docker-compose.yml**
```bash
cd /home/boris/rss-reader/rss-reader-app
docker-compose up -d
```

### 4. Verify Deployment
```bash
# Check services running
docker ps | grep rss

# View logs
docker-compose logs -f rss-reader

# Test API endpoints
curl http://localhost:3000/api/health
curl https://streamlet.taranezy.com:8443/streamlet/
```

---

## Configuration Reference

### Environment Variables (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | production | Deployment environment |
| `PORT` | No | 3000 | Backend API port |
| `FRONTEND_URL` | Yes | - | Full frontend URL with protocol and port |
| `SESSION_SECRET` | Yes | - | Random string for session encryption |
| `GOOGLE_CLIENT_ID` | Yes | - | OAuth client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes | - | OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Yes | - | OAuth redirect URL |

### Docker Compose Files

**docker-compose.prod.yml** (Recommended for git server)
- Explicit environment variables (no env_file dependency)
- Proper port mappings (8080, 8443)
- .env file mounted as read-only
- Simplified nginx configuration
- Database persistence via volume

**docker-compose.yml** (Also tested and working)
- Same configuration as docker-compose.prod.yml
- Use this if you prefer not to maintain two compose files

---

## Git Workflow Integration

### For Development Push to Production

1. **Commit and push changes:**
```bash
git add .
git commit -m "Feature: your feature description"
git push origin main
```

2. **SSH into server:**
```bash
ssh boris@192.168.100.5
cd /home/boris/rss-reader/rss-reader-app
```

3. **Pull latest changes:**
```bash
git pull origin main
```

4. **Rebuild Docker image:**
```bash
docker-compose build --no-cache rss-reader
```

5. **Deploy:**
```bash
docker-compose down
docker-compose up -d
```

Or combine steps 4-5 with one command:
```bash
docker-compose up -d --build
```

---

## Troubleshooting

### Container Name Conflict
If you see: `Cannot create container for service rss-reader: Conflict`

```bash
# Remove old containers
docker rm -f rss-reader-app rss-reader-nginx rss-reader-certbot

# Try again
docker-compose up -d
```

### .env File Not Loading
If environment variables are empty in logs:

```bash
# Verify .env exists
ls -la /home/boris/rss-reader/rss-reader-app/.env

# Check permissions
cat /home/boris/rss-reader/rss-reader-app/.env

# Restart container
docker-compose down
docker-compose up -d
```

### OAuth Callback URL Mismatch
If login redirects to wrong URL, check `.env`:

```bash
# Should match your deployment URL with port
GOOGLE_CALLBACK_URL=https://streamlet.taranezy.com:8443/streamlet/api/auth/google/callback

# Restart for changes to take effect
docker-compose down
docker-compose up -d
```

### CORS Origin Rejection
If frontend shows CORS errors in console:

1. Verify FRONTEND_URL includes port:
```bash
grep FRONTEND_URL .env
# Should show: https://streamlet.taranezy.com:8443/streamlet/
```

2. Check backend logs:
```bash
docker-compose logs rss-reader | grep CORS
```

3. Restart if needed:
```bash
docker-compose restart rss-reader
```

---

## Files to Track in Git

**Include in repository:**
- ✅ `docker-compose.yml` - Main compose file
- ✅ `docker-compose.prod.yml` - Production variant
- ✅ `.env.example` - Template (secrets removed)
- ✅ `Dockerfile` - Container definition
- ✅ `nginx/nginx.conf` - Reverse proxy config
- ✅ Source code (backend/, src/)
- ✅ `GIT_DEPLOYMENT.md` - This guide

**Exclude from repository (.gitignore):**
- ✅ `.env` - Actual secrets (never commit!)
- ✅ `node_modules/` - Dependencies
- ✅ `dist/` - Built artifacts
- ✅ `backend/data/*.db` - Database files

---

## Production Checklist

Before deploying to production:

- [ ] `.env` file created and filled with real values
- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set correctly
- [ ] `FRONTEND_URL` and `GOOGLE_CALLBACK_URL` match your domain
- [ ] `SESSION_SECRET` is a random, strong string
- [ ] `.env` is NOT committed to git (check .gitignore)
- [ ] SSL certificates exist at `/etc/letsencrypt/`
- [ ] nginx.conf properly configured for your domain
- [ ] Port 8443 (HTTPS) accessible from internet
- [ ] All services started: `docker ps` shows rss-reader and rss-nginx

---

## Monitoring

### View Logs
```bash
# Real-time logs
docker-compose logs -f

# Just backend
docker-compose logs -f rss-reader

# Just nginx
docker-compose logs -f nginx

# Last 50 lines
docker-compose logs --tail=50 rss-reader
```

### Check Health
```bash
# Verify services running
docker ps

# Test API response
curl -I http://localhost:3000/api/health

# Check configuration loaded
docker-compose logs rss-reader | grep "GOOGLE_CLIENT_ID"
```

### Database Backup
```bash
# Database is in Docker volume: rss-data
docker volume ls | grep rss

# Backup database
docker cp rss-reader-app:/app/backend/data/rss-reader.db ./backup/
```

---

## Questions?

Refer to:
- `PRODUCTION_DEPLOYMENT.md` - Detailed troubleshooting
- `README.md` - General setup info
- `.env.example` - All configuration variables
