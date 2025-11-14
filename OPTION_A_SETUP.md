# Option A: Host Nginx Proxy Setup Guide

## Configuration Change Summary

Your application will now run on **standard HTTPS port 443** instead of `:8443`:
- ✅ Before: `https://taranezy.ddns.net:8443/streamlet/`
- ✅ After: `https://taranezy.ddns.net/streamlet/`

## Setup Steps

### 1. Deploy Host Nginx Configuration (MANUAL STEP)

**On your Andromeda server, run these commands:**

```bash
# Log in to server
ssh boris@192.168.100.5

# The config file should be in /tmp
cat /tmp/rss-reader-host-proxy.conf

# Copy to nginx (requires password)
sudo cp /tmp/rss-reader-host-proxy.conf /etc/nginx/conf.d/
sudo chmod 644 /etc/nginx/conf.d/rss-reader-host-proxy.conf
```

### 2. Test Nginx Configuration

```bash
sudo nginx -t
```

Expected output:
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 3. Reload Host Nginx

```bash
sudo systemctl reload nginx
```

### 4. Update Docker Environment

On the server, update your `.env` file:

```bash
ssh boris@192.168.100.5 "cat << 'EOF' > /home/boris/rss-reader/rss-reader-app/.env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://taranezy.ddns.net/streamlet/
SESSION_SECRET=your-random-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://taranezy.ddns.net/streamlet/api/auth/google/callback
EOF"
```

**Note**: Replace `your-google-client-id` and `your-google-client-secret` with actual values from Google Cloud Console.

### 5. Redeploy Docker Services

```bash
ssh boris@192.168.100.5 "cd /home/boris/rss-reader/rss-reader-app && ./deploy.sh"
```

### 6. Verify

```bash
# Test on host
ssh boris@192.168.100.5 "curl -s -k https://localhost/streamlet/ | grep '<title>'"

# From your local machine
curl -s https://taranezy.ddns.net/streamlet/ | grep '<title>'
# Should return: <title>RSS Reader</title>
```

## Architecture

```
┌─────────────────────────────────┐
│     User Browser                │
│  https://taranezy.ddns.net      │
│        /streamlet/              │
└──────────────┬──────────────────┘
               │ HTTPS (443)
               ▼
┌─────────────────────────────────┐
│    Host Nginx (port 443)        │
│  /etc/nginx/conf.d/             │
│  rss-reader-host-proxy.conf     │
└──────────────┬──────────────────┘
               │ HTTP (localhost:3000)
               ▼
┌─────────────────────────────────┐
│   Docker Backend                │
│  rss-reader-app (port 3000)     │
│  Inside Docker network          │
└─────────────────────────────────┘
```

## How It Works

1. **Host Nginx** listens on port 443 (standard HTTPS)
2. **Location block** matches `/streamlet/` requests
3. **Proxy pass** forwards to `http://127.0.0.1:3000/`
4. **Headers** include `X-Forwarded-Proto: https` and `X-Forwarded-Port: 443`
5. **Backend** knows it's behind HTTPS proxy and configures CORS correctly

## Environment Variables Updated

All references to `:8443` removed:

**Old:**
```env
FRONTEND_URL=https://taranezy.ddns.net:8443/streamlet/
GOOGLE_CALLBACK_URL=https://taranezy.ddns.net:8443/streamlet/api/auth/google/callback
```

**New:**
```env
FRONTEND_URL=https://taranezy.ddns.net/streamlet/
GOOGLE_CALLBACK_URL=https://taranezy.ddns.net/streamlet/api/auth/google/callback
```

## Docker Changes

- ✅ `docker-compose.yml` updated
- ✅ `docker-compose.prod.yml` updated
- ✅ `.env.example` updated
- ✅ Port 8443 no longer needed in docker-compose (nginx can still use it as backup)

## Rollback (if needed)

To go back to `:8443` port:

1. Remove host nginx config:
```bash
ssh boris@192.168.100.5 "sudo rm /etc/nginx/conf.d/rss-reader-host-proxy.conf"
ssh boris@192.168.100.5 "sudo systemctl reload nginx"
```

2. Revert docker-compose to use `:8443`:
```yaml
FRONTEND_URL=https://taranezy.ddns.net:8443/streamlet/
GOOGLE_CALLBACK_URL=https://taranezy.ddns.net:8443/streamlet/api/auth/google/callback
```

## Benefits of Option A

✅ **Standard port 443** - Users don't need to specify port in URL
✅ **Professional appearance** - No unusual port numbers
✅ **Simpler firewall rules** - Only 80/443 exposed
✅ **Better load balancing** - Can add multiple backends if needed
✅ **SSL termination** - Host handles HTTPS, Docker backend uses HTTP

## Next Steps

1. Deploy host nginx config
2. Test nginx configuration
3. Reload host nginx
4. Update docker environment variables
5. Redeploy Docker services
6. Verify application works on standard port 443
