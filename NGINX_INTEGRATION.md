# Nginx Reverse Proxy Integration

This RSS Reader project now uses a **separate nginx reverse proxy** that is managed in its own repository and deployed independently.

## Project Structure

```
NginxReverseProxy/              ← Separate repository
├── Dockerfile                  ← Nginx Alpine image
├── nginx.conf                  ← Main nginx config
├── entrypoint.sh               ← Health checks & validation
├── configs/                    ← Site configurations
│   ├── upstreams.conf.example
│   └── ssl.conf.example
└── .github/workflows/          ← CI/CD pipelines

RssReader/                       ← This project
├── Dockerfile                  ← RSS Reader app
├── docker-compose-update.yml   ← Production (app only)
├── rss-reader-app/
│   └── docker-compose.yml      ← Development (app only)
└── NGINX_INTEGRATION.md        ← This file
```

## Architecture

```
External Traffic (Port 80/443)
           ↓
┌──────────────────────────────┐
│  Nginx Reverse Proxy         │  ← nginx-reverse-proxy project
│  (taranezy/nginx-reverse-proxy)
├──────────────────────────────┤
│ Routes traffic based on      │
│ domain/path configuration    │
└──────────────────────────────┘
           ↓
  Docker Network (reverse-proxy)
           ↓
┌──────────────────────────────┐
│  RSS Reader App              │  ← This project
│  (Port 3000 internal only)   │
├──────────────────────────────┤
│ Backend: Node.js + Express   │
│ Frontend: Angular            │
│ Database: SQLite             │
└──────────────────────────────┘
```

## Deployment Instructions

### Step 1: Deploy Nginx Reverse Proxy

Deploy the separate nginx project first (this creates the shared network):

```bash
# Clone the nginx-reverse-proxy repository
git clone https://github.com/taranezy/nginx-reverse-proxy.git
cd nginx-reverse-proxy

# Run deployment script (creates reverse-proxy network automatically)
cd D:\Development\NginxReverseProxy
.\deploy.ps1
```

The deployment script automatically creates the `reverse-proxy` Docker network on Andromeda.

### Step 3: Configure Nginx for RSS Reader

In the `nginx-reverse-proxy` project, configure upstreams and SSL:

**configs/upstreams.conf:**
```nginx
upstream rss_reader {
    server 192.168.100.5:3000 max_fails=3 fail_timeout=30s;
}
```

**configs/ssl.conf:**
```nginx
server {
    listen 443 ssl http2;
    server_name streamlet.taranezy.com;
    
    ssl_certificate /etc/letsencrypt/live/taranezy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/taranezy.com/privkey.pem;
    
    location / {
        proxy_pass http://rss_reader;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

### Step 4: Deploy RSS Reader

Deploy this RSS Reader application to the same network:

```bash
cd RssReader

# Production deployment
docker-compose -f docker-compose-update.yml up -d

# Verify it's running on the reverse-proxy network
docker network inspect reverse-proxy | grep rss-reader

# Check logs
docker logs rss-reader-app
```

### Step 5: Verify Integration

```bash
# Test nginx can reach RSS Reader
docker exec nginx-reverse-proxy ping rss-reader

# Test full URL
curl -I https://streamlet.taranezy.com/

# Check application health
curl http://localhost:3000/api/health
```

## Configuration Files Reference

### RSS Reader environment (.env)

When using with nginx, set FRONTEND_URL to your domain:

```env
# Production
FRONTEND_URL=https://streamlet.taranezy.com/

# Development (local nginx)
FRONTEND_URL=http://localhost/
```

### Docker Compose Networks

Both projects must use the same network:

**nginx-reverse-proxy/docker-compose.prod.yml:**
```yaml
networks:
  reverse-proxy:
    driver: bridge
    external: true
```

**RssReader/docker-compose-update.yml:**
```yaml
networks:
  reverse-proxy:
    external: true
```

## Managing Multiple Sites

The nginx reverse proxy can easily manage multiple upstream services:

1. **Add upstream definition** in `nginx-reverse-proxy/configs/upstreams.conf`:
   ```nginx
   upstream nextcloud {
       server nextcloud:9000 max_fails=3 fail_timeout=30s;
   }
   ```

2. **Add server block** in `nginx-reverse-proxy/configs/ssl.conf`:
   ```nginx
   server {
       listen 443 ssl http2;
       server_name nextcloud.taranezy.com;
       
       location / {
           proxy_pass http://nextcloud;
           # Headers...
       }
   }
   ```

3. **Create service** in its own docker-compose:
   ```yaml
   networks:
     reverse-proxy:
       external: true
   ```

4. **Push changes** to nginx-reverse-proxy repository - CI/CD pipeline automatically builds and deploys!

## Troubleshooting

### RSS Reader not reachable

```bash
# Check if RSS Reader is running
docker ps | grep rss-reader

# Check if it's on the correct network
docker network inspect reverse-proxy | grep rss-reader-app

# Test connectivity from nginx
docker exec nginx-reverse-proxy ping rss-reader
```

### Nginx not routing to RSS Reader

```bash
# Verify upstream configuration
docker exec nginx-reverse-proxy cat /etc/nginx/includes/upstreams.conf | grep rss_reader

# Test nginx configuration
docker exec nginx-reverse-proxy nginx -t

# Check nginx error logs
docker logs nginx-reverse-proxy | grep error
```

### SSL certificate not found

```bash
# Verify certificates are mounted
docker inspect nginx-reverse-proxy | grep letsencrypt

# Check file permissions
ls -la /etc/letsencrypt/live/taranezy.com/
```

### Port conflicts

```bash
# Check what's listening on port 80/443
netstat -tulpn | grep -E ':80|:443'

# Kill conflicting process
sudo lsof -ti:80 | xargs sudo kill -9
```

## CI/CD Integration

### RSS Reader CI/CD

This project's GitHub Actions (`RssReader/.github/workflows/`) focuses on:
- Testing the RSS Reader application
- Building the RSS Reader Docker image
- Deploying RSS Reader to production

### Nginx Reverse Proxy CI/CD

The separate nginx project's workflows focus on:
- Validating nginx configuration
- Building nginx Docker image
- Publishing to Docker Hub
- Deploying nginx container independently

## Deployment Commands

### Quick Start (Development)

```bash
# Terminal 1: Nginx
cd nginx-reverse-proxy
docker-compose up

# Terminal 2: RSS Reader
cd RssReader
docker-compose -f rss-reader-app/docker-compose.yml up
```

### Production Deployment

```bash
# Create network
docker network create reverse-proxy

# Deploy nginx first
cd nginx-reverse-proxy
docker-compose -f docker-compose.prod.yml up -d

# Deploy RSS Reader
cd ../RssReader
docker-compose -f docker-compose-update.yml up -d

# Verify
docker network inspect reverse-proxy
```

## Key Differences from Previous Setup

| Aspect | Before | After |
|--------|--------|-------|
| Nginx | Part of RssReader project | Separate project/repository |
| Configuration | In `RssReader/nginx/` | In `NginxReverseProxy/configs/` |
| CI/CD | Single pipeline | Two independent pipelines |
| Deployment | Single docker-compose | Two separate deployments |
| Scaling | Limited to RSS Reader | Easy multi-site support |
| Updates | Must rebuild RssReader | Independent nginx updates |

## Support

For nginx-specific issues:
- See: https://github.com/taranezy/nginx-reverse-proxy
- Documentation: https://github.com/taranezy/nginx-reverse-proxy/DEPLOYMENT.md

For RSS Reader issues:
- See: https://github.com/taranezy/RssReader
- This file: `NGINX_INTEGRATION.md`

---

Last Updated: 2025-01-02
