# Production Deployment Guide - RSS Reader

## Quick Start

### Automated Deployment

Run the deployment script to automatically clean up and deploy:

```bash
cd /home/boris/rss-reader/rss-reader-app
chmod +x deploy.sh
./deploy.sh
```

This script will:
1. ✓ Remove any conflicting containers (`rss-reader-app`, `rss-nginx`)
2. ✓ Stop and remove all services
3. ✓ Bring up fresh services
4. ✓ Verify everything is running
5. ✓ Display health status

### Manual Deployment

If you need to deploy manually:

```bash
cd /home/boris/rss-reader/rss-reader-app

# Step 1: Clean up old containers
docker rm -f rss-reader-app rss-nginx 2>/dev/null || true

# Step 2: Bring down existing services
docker compose down

# Step 3: Wait a moment
sleep 2

# Step 4: Bring up services
docker compose up -d

# Step 5: Verify
sleep 3
docker ps | grep -E 'rss-reader-app|rss-nginx'
```

## Environment Configuration

### Required Environment Variables

Create a `.env` file in `/home/boris/rss-reader/rss-reader-app/`:

```env
# Server Configuration
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://streamlet.taranezy.com:8443/streamlet/

# Database
DATABASE_PATH=./data/rss-reader.db

# Session Secret
SESSION_SECRET=your-random-secret-key-here

# Google OAuth 2.0 Credentials - Get from Google Cloud Console
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# OAuth Callback URL
GOOGLE_CALLBACK_URL=https://streamlet.taranezy.com:8443/streamlet/api/auth/google/callback

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Important Notes

- **FRONTEND_URL** must include the port `:8443` (this is what users access)
- **GOOGLE_CALLBACK_URL** must match the OAuth redirect URI configured in Google Console
- The port 8443 is used because the host nginx is already using port 443

## Verification

### Check Services Are Running

```bash
docker ps | grep -E 'rss-reader-app|rss-nginx'
```

Expected output:
```
rss-reader-app   (backend on :3000)
rss-nginx        (proxy on :8080, :8443)
```

### Check Backend Configuration

```bash
docker logs rss-reader-app | grep -A 10 'SERVER STARTUP'
```

Expected:
```
NODE_ENV: production
isProduction: true
FRONTEND_URL: https://streamlet.taranezy.com:8443/streamlet/
CORS_ORIGINS: ["https://streamlet.taranezy.com:8443"]
GOOGLE_CLIENT_ID: ✓ Configured
GOOGLE_CLIENT_SECRET: ✓ Configured
```

### Test OAuth Endpoints

```bash
# Test Google OAuth endpoint
curl -s -k -o /dev/null -w '%{http_code}' https://localhost:8443/streamlet/api/auth/google

# Test Demo Login endpoint
curl -s -k -o /dev/null -w '%{http_code}' https://localhost:8443/streamlet/api/auth/demo

# Both should return 302 (redirect)
```

### Test Frontend

```bash
# Check if frontend loads
curl -s -k https://localhost:8443/streamlet/ | grep '<title>'

# Should return: <title>RSS Reader</title>
```

## Troubleshooting

### Container Name Already In Use

**Error:**
```
ERROR: for rss-reader-app  Cannot create container for service rss-reader: Conflict. 
The container name "/rss-reader-app" is already in use by container "..."
```

**Solution:**
```bash
docker rm -f rss-reader-app rss-nginx
cd /home/boris/rss-reader/rss-reader-app
docker compose up -d
```

### Port Already In Use

If port 8443 is in use by another service:

```bash
# Find what's using the port
lsof -i :8443

# If it's an old nginx, stop it:
docker ps -a | grep nginx
docker rm -f <container-id>
```

### Backend Not Connecting

Check backend logs:
```bash
docker logs rss-reader-app -f
```

Common issues:
- Missing `.env` file
- Invalid `FRONTEND_URL`
- Invalid Google OAuth credentials
- Redis connection failing (not critical, will disable itself)

### OAuth Not Working

1. Verify FRONTEND_URL includes the port: `https://streamlet.taranezy.com:8443/streamlet/`
2. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
3. Verify GOOGLE_CALLBACK_URL matches Google Console settings
4. Check CORS_ORIGINS shows the correct domain

Run: `docker logs rss-reader-app | grep -i cors`

## Application URLs

- **Production**: `https://streamlet.taranezy.com:8443/streamlet/`
- **Localhost**: `https://localhost:8443/streamlet/` (for testing locally on server)
- **Backend API**: `http://localhost:3000/api/` (internal only)

## Logs

### View Backend Logs
```bash
docker logs rss-reader-app -f
```

### View Nginx Logs
```bash
docker logs rss-nginx -f
```

### View All Logs
```bash
docker compose logs -f
```

## Updates & Rebuilds

To update the application:

1. Make changes to source files
2. Push to git repository
3. Pull latest changes on server
4. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

The script will automatically rebuild the Docker image if source files changed.

## Database & Persistence

- Database file: `/home/boris/rss-reader/rss-reader-app/backend/data/rss-reader.db`
- This is persisted as a Docker volume: `rss-data`
- Data will persist across container restarts

## Security Notes

- SSL certificates are mounted from `/etc/letsencrypt/` on the host
- Session secret should be changed from the default
- Google OAuth credentials should be kept secret (never commit to git)
- The `.env` file should never be committed to version control

