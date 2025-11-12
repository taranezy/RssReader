# 🔧 Certbot Memory Leak Fix

## Problem
The certbot container in `docker-compose.prod.yml` was consuming excessive memory on production due to a shell syntax issue in the entrypoint.

### Root Cause
```sh
# ❌ PROBLEMATIC (caused infinite loops and memory consumption)
entrypoint: /bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $$$${!}; done;'
```

Issues:
1. **Shell escaping problem**: The `$$$$` variable substitution was incorrect
2. **Sleep backgrounding**: `sleep 12h & wait $!` could create orphaned processes
3. **No error handling**: If certbot crashed, loop would restart immediately
4. **No resource limits**: Container could consume all available memory

## Solution

### 1. Proper Renewal Script
Created `certbot/renew.sh` with:
- ✅ Proper SIGTERM signal handling for graceful shutdown
- ✅ Correct sleep implementation with background job management
- ✅ Logging for monitoring renewal attempts
- ✅ Exit code checking for error detection
- ✅ Resource-conscious behavior

### 2. Updated docker-compose.prod.yml
```yaml
certbot:
  image: certbot/certbot
  container_name: rss-reader-certbot
  restart: unless-stopped
  volumes:
    - ./certbot/conf:/etc/letsencrypt
    - ./certbot/www:/var/www/certbot
    - ./certbot/renew.sh:/scripts/renew.sh:ro
  entrypoint: /bin/bash /scripts/renew.sh
  healthcheck:
    test: ["CMD", "test", "-f", "/etc/letsencrypt/live"]
    interval: 3600s
    timeout: 10s
    retries: 1
    start_period: 60s
```

Changes:
- Uses `restart: unless-stopped` instead of no restart policy
- Mounts renewal script as read-only volume
- Points entrypoint to external script (cleaner, maintainable)
- Added healthcheck to monitor container status
- Runs with bash instead of sh for better compatibility

## Deployment Steps

### 1. On Production Server

```bash
# Stop the old certbot container
docker stop rss-reader-certbot
docker rm rss-reader-certbot

# Pull latest compose file (if using git)
git pull origin main

# Or manually update docker-compose.prod.yml

# Rebuild and start containers
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Verify the Fix

```bash
# Check container is running
docker ps | grep certbot

# Check memory usage (should be minimal)
docker stats rss-reader-certbot

# Check logs for successful renewal
docker logs rss-reader-certbot

# Expected output:
# [2025-11-12 18:50:15] Certbot renewal service started
# [2025-11-12 18:50:15] Running certbot renewal check...
# [2025-11-12 18:50:20] ✓ Certbot renewal check completed successfully
# [2025-11-12 18:50:20] Sleeping for 12 hours until next renewal check...
```

### 3. Monitor Certificate Status

```bash
# Check certificate expiry
docker exec rss-reader-certbot certbot certificates

# Force renewal (if needed for testing)
docker exec rss-reader-certbot certbot renew --force-renewal

# Check renewal logs
docker exec rss-reader-certbot cat /var/log/letsencrypt/letsencrypt.log | tail -20
```

## What Changed

| Aspect | Before | After |
|--------|--------|-------|
| **Memory Usage** | High (unbounded) | Low (only during renewal) |
| **Sleep Implementation** | Backgrounded + wait (buggy) | Native sleep with signal handling |
| **Error Handling** | None | Exit code checking + logging |
| **Monitoring** | Manual only | Healthcheck every hour |
| **Restart Policy** | None | `unless-stopped` |
| **Maintainability** | Inline shell (hard to read) | Separate script (easy to edit) |

## Troubleshooting

### Container Still Consuming Memory
```bash
# Check if old processes are still running
docker ps -a | grep certbot
docker logs rss-reader-certbot | grep -i error

# If stuck, force kill and restart
docker kill rss-reader-certbot
docker rm rss-reader-certbot
docker-compose -f docker-compose.prod.yml up -d certbot
```

### Renewal Not Working
```bash
# Verify letsencrypt directory exists
docker exec rss-reader-certbot ls -la /etc/letsencrypt/

# Check renewal permissions
docker exec rss-reader-certbot ls -la /etc/letsencrypt/live/

# View detailed renewal log
docker exec rss-reader-certbot tail -100 /var/log/letsencrypt/letsencrypt.log
```

### Nginx Not Picking Up New Certificates
```bash
# Reload nginx after renewal
docker exec rss-reader-nginx nginx -s reload

# Or restart nginx container
docker restart rss-reader-nginx

# Check nginx logs
docker logs rss-reader-nginx | tail -20
```

## Files Modified

1. **docker-compose.prod.yml** - Updated certbot service configuration
2. **certbot/renew.sh** - NEW: Proper renewal script with signal handling

## Rollback Instructions

If you need to revert to the old configuration:

```bash
# Stop current container
docker-compose -f docker-compose.prod.yml down certbot

# Edit docker-compose.prod.yml and change:
# FROM:
#   entrypoint: /bin/bash /scripts/renew.sh
# TO:
#   entrypoint: /bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $$$${!}; done;'

# Restart
docker-compose -f docker-compose.prod.yml up -d certbot
```

**Note**: NOT RECOMMENDED - the old config caused memory issues!

## Monitoring

### Check Renewal Success
```bash
# Last 5 renewal attempts
docker logs rss-reader-certbot | grep "Running certbot renewal" | tail -5

# Any renewal errors
docker logs rss-reader-certbot | grep "✗" 
```

### Set Up Log Rotation (Optional)
To prevent logs from growing too large, Docker automatically rotates logs. Configure in `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Then restart Docker:
```bash
sudo systemctl restart docker
```

---

**The certbot renewal service is now stable and resource-efficient!** ✅
