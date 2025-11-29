# RSS Reader - Complete CI/CD Guide

**Last Updated:** November 5, 2025

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Setup Instructions](#setup-instructions)
5. [GitHub Actions Workflows](#github-actions-workflows)
6. [Deployment Process](#deployment-process)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## Overview

This project uses **GitHub Actions** for continuous integration and deployment (CI/CD). The pipeline automatically tests, builds, and deploys the RSS Reader application to your production server on every push to the `main` branch.

### Key Features
- ✅ Automated testing and linting
- ✅ Direct SSH deployment (no Docker Hub needed)
- ✅ Multi-stage Docker builds (Angular frontend + Node.js backend)
- ✅ Production-ready with proper dependency management
- ✅ SSL/TLS support via Let's Encrypt

### Technology Stack
- **Frontend:** Angular 18
- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **Container:** Docker + Docker Compose
- **Web Server:** Nginx (reverse proxy)
- **CI/CD:** GitHub Actions
- **Production:** Ubuntu server with Docker

---

## Quick Start

### Prerequisites
✅ GitHub repository set up  
✅ Production server with Docker and Docker Compose  
✅ SSH access to production server  
✅ Domain name configured (streamlet.taranezy.com)  

### Deploy Now (3 Steps)

1. **Configure GitHub Secrets** (one-time setup)
   ```
   SSH_PRIVATE_KEY - Your SSH private key
   DEPLOY_HOST - streamlet.taranezy.com
   DEPLOY_USER - boris
   ```

2. **Initialize Production Server** (one-time setup)
   ```bash
   ssh boris@andromeda
   cd ~
   git clone https://github.com/taranezy/RssReader.git rss-reader
   cd rss-reader
   ```

3. **Push to Main Branch**
   ```bash
   git push origin main
   ```
   
   GitHub Actions will automatically deploy!

---

## Architecture

### Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Pipeline                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: TEST                                              │
│  • Install dependencies                                      │
│  • Run Angular linter                                        │
│  • Build Angular app                                         │
│  • Run tests                                                 │
│  • Upload artifacts                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 2: DEPLOY                                            │
│  • SSH to production server                                  │
│  • Pull latest code (git reset --hard origin/main)          │
│  • Build Docker image                                        │
│  • Restart containers                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 3: NOTIFY                                            │
│  • Echo deployment status                                    │
│  • (Optional: Slack notifications)                           │
└─────────────────────────────────────────────────────────────┘
```

### Docker Multi-Stage Build

```dockerfile
Stage 1: Frontend Builder (node:20-alpine)
├── Copy package files
├── npm ci (install Angular dependencies)
├── Copy source code
└── npm run build (build Angular app)

Stage 2: Production (node:20-alpine)
├── Install build tools (python3, make, g++)
├── Copy backend package files
├── npm ci --only=production
├── Copy backend code
├── npm rebuild better-sqlite3 (for Alpine)
├── Copy built Angular app from Stage 1
└── Start Node.js server
```

### Why No Docker Hub?

Since your production server and Docker are on the same private server:
- **Faster:** Build directly on production (no push/pull)
- **Simpler:** Only 3 GitHub Secrets vs 6
- **Secure:** No external registry needed
- **Cost:** Free (no Docker Hub account required)

---

## Setup Instructions

### 1. SSH Key Setup

Generate SSH key on your local machine:

```powershell
# Generate 4096-bit RSA key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/rss_reader_deploy -N ""

# Copy public key to production server
type ~/.ssh/rss_reader_deploy.pub | ssh boris@andromeda "cat >> ~/.ssh/authorized_keys"

# Test the connection
ssh -i ~/.ssh/rss_reader_deploy boris@andromeda "echo 'SSH connection successful!'"
```

### 2. GitHub Secrets Configuration

Navigate to: **GitHub Repository → Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `SSH_PRIVATE_KEY` | Contents of `~/.ssh/rss_reader_deploy` | Private SSH key for deployment |
| `DEPLOY_HOST` | `streamlet.taranezy.com` | Production server hostname |
| `DEPLOY_USER` | `boris` | SSH username |

**To get the private key:**
```powershell
Get-Content ~/.ssh/rss_reader_deploy | clip
```
Then paste into GitHub Secrets.

### 3. Production Server Setup

```bash
# SSH to production server
ssh boris@andromeda

# Install Docker and Docker Compose (if not already installed)
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker $USER
newgrp docker

# Clone repository
cd ~
git clone https://github.com/taranezy/RssReader.git rss-reader
cd rss-reader

# Verify docker-compose.prod.yml exists
ls -la docker-compose.prod.yml

# Create .env file if needed
nano .env
# Add your environment variables (Google OAuth, etc.)
```

### 4. Verify Setup

```bash
# Check Docker is running
docker ps

# Check git is configured
cd ~/rss-reader
git remote -v

# Test Docker Compose
docker-compose -f docker-compose.prod.yml config
```

---

## GitHub Actions Workflows

### Main Deployment Workflow

**File:** `.github/workflows/deploy.yml`

**Triggers:**
- Push to `main` branch
- Manual dispatch (workflow_dispatch)

**Jobs:**

#### 1. Test Job
```yaml
- Checkout code
- Setup Node.js 20
- Install dependencies (npm ci)
- Lint Angular app
- Build Angular app
- Run tests
- Upload build artifacts
```

#### 2. Deploy Job
```yaml
- Download artifacts
- Validate GitHub Secrets
- Setup SSH key
- SSH to production server:
  - git fetch origin main
  - git reset --hard origin/main
  - docker-compose build --no-cache
  - docker-compose up -d
```

#### 3. Notify Job
```yaml
- Echo deployment status
```

### PR Validation Workflow

**File:** `.github/workflows/pr-validation.yml`

**Triggers:**
- Pull request to `main` branch

**Purpose:**
- Validate code quality before merging
- Run same tests as deployment
- No actual deployment

---

## Deployment Process

### Automatic Deployment

Every push to `main` triggers:

1. **GitHub Actions starts** (< 1 minute)
2. **Testing** (2-3 minutes)
   - Linting
   - Building
   - Testing
3. **Deployment** (5-8 minutes)
   - SSH connection
   - Git pull
   - Docker build
   - Container restart
4. **Total time:** ~6-12 minutes

### Manual Deployment

If automatic deployment fails or you need to deploy manually:

```bash
# SSH to production
ssh boris@andromeda

# Navigate to project
cd ~/rss-reader

# Pull latest code
git fetch origin main
git reset --hard origin/main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker logs rss-reader-app --tail=50
```

### Rollback to Previous Version

```bash
# SSH to production
ssh boris@andromeda
cd ~/rss-reader

# Find the commit you want to rollback to
git log --oneline -10

# Rollback
git reset --hard <commit-hash>

# Rebuild
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### Common Issues

#### 1. SSH Connection Failed
```
Error: Host key verification failed
```

**Solution:**
Check GitHub Secrets are correctly configured:
- `SSH_PRIVATE_KEY` - Must be the complete private key (including headers)
- `DEPLOY_HOST` - Correct hostname
- `DEPLOY_USER` - Correct username

#### 2. Docker Build Fails

```
Error: Cannot find module 'X'
```

**Solution:**
Add missing dependency to `package.json`:
```bash
cd rss-reader-app/backend
npm install <missing-package> --save
git add package.json package-lock.json
git commit -m "Add missing dependency"
git push origin main
```

#### 3. Better-SQLite3 Errors

```
Error: Exec format error (better_sqlite3.node)
```

**Solution:**
This is already fixed in the Dockerfile with:
```dockerfile
RUN apk add --no-cache python3 make g++
RUN npm rebuild better-sqlite3
```

If you still get this error, rebuild without cache:
```bash
docker-compose -f docker-compose.prod.yml build --no-cache
```

#### 4. Container Crashes After Deployment

**Check logs:**
```bash
docker logs rss-reader-app --tail=100
```

**Check container status:**
```bash
docker-compose -f ~/rss-reader/docker-compose.prod.yml ps
```

**Restart containers:**
```bash
docker-compose -f ~/rss-reader/docker-compose.prod.yml restart
```

#### 5. 502 Bad Gateway

**Possible causes:**
1. Backend container crashed - Check logs
2. Nginx misconfiguration - Check nginx logs
3. Database locked - Restart containers

**Debug:**
```bash
# Check all containers are running
docker ps

# Check backend logs
docker logs rss-reader-app

# Check nginx logs
docker logs rss-reader-nginx

# Restart everything
cd ~/rss-reader
docker-compose -f docker-compose.prod.yml restart
```

---

## Maintenance

### Updating Dependencies

**Frontend (Angular):**
```bash
cd rss-reader-app
npm update
npm audit fix
git add package*.json
git commit -m "Update frontend dependencies"
git push origin main
```

**Backend (Node.js):**
```bash
cd rss-reader-app/backend
npm update
npm audit fix
git add package*.json
git commit -m "Update backend dependencies"
git push origin main
```

### Database Backup

Use the automated backup script:
```powershell
.\backup\backup-database.ps1
```

This creates versioned backups with MD5 verification in the `backup/` folder.

### SSL Certificate Renewal

Certbot automatically renews certificates. Verify:
```bash
docker logs rss-reader-certbot
```

Manual renewal:
```bash
docker-compose -f ~/rss-reader/docker-compose.prod.yml restart certbot
```

### Monitoring

**Check app status:**
```bash
curl -I https://streamlet.taranezy.com:8444
```

**Check container health:**
```bash
docker-compose -f ~/rss-reader/docker-compose.prod.yml ps
```

**Check resource usage:**
```bash
docker stats rss-reader-app rss-reader-nginx
```

### Logs

**Backend logs:**
```bash
docker logs rss-reader-app --tail=100 -f
```

**Nginx logs:**
```bash
docker logs rss-reader-nginx --tail=100 -f
```

**All containers:**
```bash
docker-compose -f ~/rss-reader/docker-compose.prod.yml logs -f
```

---

## Production URLs

- **Main App:** https://streamlet.taranezy.com:8444
- **API:** https://streamlet.taranezy.com:8444/api
- **Health Check:** https://streamlet.taranezy.com:8444/api/health (if implemented)

---

## Key Files

| File | Purpose |
|------|---------|
| `.github/workflows/deploy.yml` | Main CI/CD pipeline |
| `.github/workflows/pr-validation.yml` | PR testing |
| `Dockerfile` | Multi-stage Docker build |
| `docker-compose.prod.yml` | Production container orchestration |
| `rss-reader-app/backend/package.json` | Backend dependencies |
| `rss-reader-app/package.json` | Frontend dependencies |
| `backup/backup-database.ps1` | Database backup script |

---

## Security Notes

- SSH keys should never be committed to the repository
- GitHub Secrets are encrypted and only accessible during workflow execution
- Production server uses SSH key authentication (not passwords)
- SSL/TLS certificates managed by Let's Encrypt
- Session secrets should be in environment variables (not in code)

---

## Support & Resources

- **GitHub Actions Logs:** Check workflow run details in GitHub Actions tab
- **Production Server:** SSH to `boris@andromeda` for direct access
- **Docker Documentation:** https://docs.docker.com
- **GitHub Actions Docs:** https://docs.github.com/actions

---

**For questions or issues, check the GitHub Actions logs first, then production server logs.**

**Status:** ✅ CI/CD Pipeline Active and Working
**Last Successful Deployment:** November 5, 2025
