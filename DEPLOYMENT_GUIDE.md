# Deployment Guide - RSS Reader

## Overview

The RSS Reader application is deployed to an isolated Andromeda server (192.168.100.5) that has **no internet access**. Therefore, GitHub Actions CI/CD is not viable.

## Deployment Strategy

### Local PowerShell Deployment (Recommended)

Since the Andromeda server is isolated from the internet, deployments are handled locally using PowerShell scripts that:

1. **Archive** the project files (excludes `.git`, `node_modules`, etc.)
2. **Transfer** via SCP over SSH to Andromeda
3. **Extract** and build the Docker image on the remote server
4. **Deploy** using docker-compose

### Deployment Process

#### From Your Local Machine:

```powershell
cd D:\Development\RssReader
.\deploy.ps1
```

This single command will:
- ✅ Archive the current codebase
- ✅ Transfer files to Andromeda via SCP
- ✅ Build the Docker image
- ✅ Deploy containers using `docker-compose-update.yml`
- ✅ Create the reverse-proxy network (if needed)

#### Result:

```
========================================
RSS Reader Deployment to 192.168.100.5
========================================

Step 1: Validate files...
OK: All files present

Step 2: Create archive...
OK: Archive created

Step 3: Transfer files...
OK: Files transferred

Step 4: Extract and build...
OK: Build complete

Step 5: Deploy container...
OK: Container started

SUCCESS: Deployment complete!
Access: https://streamlet.taranezy.com
```

## Docker Compose Files

### docker-compose-update.yml (Root Level)
**Used by**: Local deployment script  
**Build context**: `./rss-reader-app`  
**Network**: `reverse-proxy` (external)  
**Services**: Only RSS Reader app (nginx managed separately)

### docker-compose.prod.yml (Inside rss-reader-app)
**Used by**: Direct deployment on server  
**Build context**: `.` (local to rss-reader-app)  
**Network**: `reverse-proxy` (external)  
**Services**: Only RSS Reader app

## Prerequisites

### Local Machine
- PowerShell 5.1+
- SSH key configured: `~/.ssh/id_rsa`
- `tar` command available (usually included in PowerShell 6+ or git bash)

### Andromeda Server
- Docker and docker-compose installed
- SSH access configured for `boris` user
- `reverse-proxy` Docker network exists (created automatically by deploy script)

## Configuration Files

### .env File
Located at `~/rss-reader/.env` on Andromeda.

**Required variables**:
```bash
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://streamlet.taranezy.com/
SESSION_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://streamlet.taranezy.com/api/auth/google/callback
```

## Reverse Proxy Integration

The RSS Reader app is managed separately from Nginx. The reverse proxy is configured in the independent `NginxReverseProxy` project.

### Upstream Configuration
Located in `NginxReverseProxy/configs/upstreams.conf`:
```nginx
upstream rss_reader {
    server 192.168.100.5:3000;
    max_fails=3;
    fail_timeout=30s;
}
```

The app listens on port 3000 internally and is only accessible via the Nginx proxy on ports 80/443.

## Deployment Workflow

### Initial Setup
```bash
# 1. Clone projects locally
git clone https://github.com/taranezy/RssReader.git
git clone https://github.com/taranezy/NginxReverseProxy.git

# 2. Deploy nginx first
cd NginxReverseProxy
.\deploy.ps1

# 3. Deploy RSS Reader
cd ..\RssReader
.\deploy.ps1
```

### Updates
```bash
# Make code changes locally
# Commit and push to GitHub
git add .
git commit -m "Your commit message"
git push origin main

# Deploy to Andromeda
.\deploy.ps1
```

## Verification

### Check Container Status
```bash
ssh -i ~/.ssh/id_rsa boris@192.168.100.5 \
  "docker ps --filter 'name=rss-reader' --format 'table {{.Names}}\t{{.Status}}'"
```

### Check Health Endpoint
```bash
curl http://192.168.100.5:3000/api/health
```

### Check Logs
```bash
ssh -i ~/.ssh/id_rsa boris@192.168.100.5 \
  "docker logs rss-reader-app --tail 50"
```

## Troubleshooting

### SSH Connection Issues
- Verify SSH key: `~/.ssh/id_rsa`
- Test SSH connection: `ssh -i ~/.ssh/id_rsa boris@192.168.100.5`

### Docker Build Failures
- Check disk space on Andromeda: `df -h`
- Check Docker daemon: `docker ps`
- Verify .env file exists: `cat ~/.rss-reader/.env`

### Network Issues
- Verify reverse-proxy network: `docker network ls | grep reverse-proxy`
- Check container network: `docker inspect rss-reader-app`

### Container Won't Start
- Check logs: `docker logs rss-reader-app`
- Verify port 3000 is available: `docker ps | grep 3000`
- Restart container: `docker-compose -f docker-compose-update.yml restart`

## GitHub Repository Status

- **GitHub Actions CI/CD**: ❌ Disabled (Andromeda isolated from internet)
- **Local Deployment**: ✅ Active (PowerShell scripts)
- **PR Validation**: ✅ Active (linting and testing)

## Key Points

✅ No git cloning on remote server  
✅ Archive-based deployment (fast and reliable)  
✅ Nginx and RSS Reader managed separately  
✅ Automatic network creation and configuration  
✅ Health checks included in deployment  

## Support

For issues or questions about deployment, refer to:
- `NGINX_INTEGRATION.md` - Proxy configuration details
- `NginxReverseProxy/DEPLOYMENT.md` - Nginx deployment guide
- `NginxReverseProxy/README.md` - Nginx reverse proxy documentation
