# Deploy to Andromeda Server

## Quick Deploy

```powershell
npm run deploy:remote
```

This will:
1. Build Angular application locally
2. Upload code to Andromeda server (192.168.100.5)
3. Build Docker image on server
4. Deploy with HTTPS on port 8444

## Server Details

- **Server**: Andromeda (192.168.100.5)
- **User**: boris
- **URL**: https://taranezy.ddns.net:8444
- **Database**: SQLite at `/app/backend/data/rss-reader.db`

## Manual Steps

### 1. Build locally
```powershell
npm run build
```

### 2. Deploy to server
```powershell
npm run deploy:remote
```

### 3. Check deployment
```powershell
ssh boris@192.168.100.5
cd ~/rss-reader
docker-compose -f docker-compose.prod.yml ps
```

## Environment Variables

Set these on Andromeda in `~/rss-reader/.env`:

```
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=https://taranezy.ddns.net:8444/api/auth/google/callback
SESSION_SECRET=your-session-secret-here
NODE_ENV=production
PORT=3000
```

## Troubleshooting

### Check logs
```bash
ssh boris@192.168.100.5
cd ~/rss-reader
docker-compose -f docker-compose.prod.yml logs -f
```

### Restart services
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Rebuild from scratch
```bash
docker-compose -f docker-compose.prod.yml down
docker system prune -a
docker-compose -f docker-compose.prod.yml up -d --build
```
