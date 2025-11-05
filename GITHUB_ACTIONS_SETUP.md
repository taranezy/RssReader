# GitHub Actions CI/CD Pipeline Setup

Complete automation for building, testing, and deploying your RSS Reader application.

## 🚀 Overview

This CI/CD pipeline automatically:

1. ✅ **Tests** - Run linting and tests on every push/PR
2. ✅ **Builds** - Create Docker image
3. ✅ **Deploys** - Deploy to production on `main` branch
4. ✅ **Notifies** - Send Slack notifications

---

## 📋 Workflows

### 1. **Deploy Pipeline** (`.github/workflows/deploy.yml`)

**Triggers:** Push to `main` branch

**Stages:**

#### Stage 1: Test
- Install dependencies
- Run linting
- Run unit tests
- Build frontend
- Upload build artifacts

#### Stage 2: Build
- Set up Docker Buildx
- Login to Docker Hub
- Build and push Docker image
- Tag with commit SHA and latest

#### Stage 3: Deploy
- Pull latest code on remote
- Build Docker image on production server
- Stop old containers
- Start new containers
- Run health check

#### Stage 4: Notifications
- Send Slack notification on success/failure

### 2. **PR Validation** (`.github/workflows/pr-validation.yml`)

**Triggers:** Pull Request to `main` branch

**Checks:**
- Linting
- Build validation
- Unit tests
- Comments on PR with status

---

## 🔑 Required Secrets

Add these secrets in your GitHub repository settings (`Settings → Secrets and variables → Actions`):

### Required Secrets:

```
SSH_PRIVATE_KEY         = Your SSH private key for andromeda
DEPLOY_HOST             = andromeda (or your server hostname)
DEPLOY_USER             = boris (or your SSH username)
DOCKER_USERNAME         = Your Docker Hub username
DOCKER_PASSWORD         = Your Docker Hub access token
SLACK_WEBHOOK_URL       = (Optional) Slack webhook for notifications
```

### How to Add Secrets:

1. Go to GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its value

---

## 🔐 Setting Up SSH Key

### Generate SSH Key (if you don't have one):

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github-actions -N ""
```

### Add Public Key to andromeda:

```bash
ssh-copy-id -i ~/.ssh/github-actions.pub boris@andromeda
```

### Add Private Key to GitHub Secrets:

1. Copy the private key content:
   ```bash
   cat ~/.ssh/github-actions
   ```

2. Add to GitHub as `SSH_PRIVATE_KEY` secret

---

## 📦 Docker Hub Setup

### Create Access Token:

1. Go to [Docker Hub](https://hub.docker.com)
2. Click your profile → **Account Settings** → **Security**
3. Click **New Access Token**
4. Copy the token

### Add to GitHub Secrets:

- `DOCKER_USERNAME` = Your Docker Hub username
- `DOCKER_PASSWORD` = The access token you just created

---

## 💬 Slack Notifications (Optional)

### Create Slack Webhook:

1. Go to your Slack workspace
2. Navigate to **Apps** → **App Management**
3. Create a new app or use existing
4. Enable **Incoming Webhooks**
5. Create new webhook URL
6. Copy the webhook URL

### Add to GitHub Secrets:

- `SLACK_WEBHOOK_URL` = Your Slack webhook URL

---

## 📊 Pipeline Flow

```
Push to main branch
        ↓
    TEST (always)
    - Lint
    - Build
    - Run tests
    - Upload artifacts
        ↓
       BUILD (if test passes & main branch)
       - Build Docker image
       - Push to Docker Hub
        ↓
      DEPLOY (if build passes & main branch)
      - Pull code on remote
      - Build on remote
      - Stop old containers
      - Start new containers
      - Health check
        ↓
     NOTIFY (always)
     - Send Slack message
```

---

## ✅ How to Use

### 1. **Make Changes Locally**

```bash
git checkout -b feature/my-feature
# Make your changes
git add .
git commit -m "Add new feature"
```

### 2. **Push to GitHub**

```bash
git push origin feature/my-feature
```

### 3. **Create Pull Request**

- Go to GitHub repository
- Click **New Pull Request**
- GitHub Actions will automatically validate the PR
- Comments will appear with test results

### 4. **Merge to Main**

Once PR is approved and tests pass:

```bash
git checkout main
git pull origin main
git merge feature/my-feature
git push origin main
```

GitHub Actions will **automatically**:
- ✅ Test the code
- ✅ Build Docker image
- ✅ Deploy to production
- ✅ Send Slack notification

---

## 📈 Monitoring Deployments

### View Workflow Runs:

1. Go to repository
2. Click **Actions** tab
3. View workflow runs
4. Click any run to see details

### View Logs:

1. Click on a workflow run
2. Expand job to see logs
3. Each step shows detailed output

### View Deployment Status:

Check the **Deployments** tab on GitHub to see:
- Deployment history
- Status (success/failed)
- Environment (production)
- Commit information

---

## 🔄 Manual Triggers (Optional)

To manually trigger workflows:

1. Go to **Actions** tab
2. Select workflow
3. Click **Run workflow** button
4. Choose branch
5. Click **Run workflow**

---

## 🆘 Troubleshooting

### Workflow Fails on Deploy

**Check:**
- SSH key is correct in secrets
- Deploy host is reachable
- Docker is running on remote
- Git repository is cloned on remote

### Docker Push Fails

**Check:**
- Docker Hub credentials are correct
- Access token hasn't expired
- Repository privacy settings

### Health Check Fails

**Check:**
- Application started successfully
- Check container logs on remote
- Verify port 3000 is accessible

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Action](https://github.com/docker/build-push-action)
- [Slack GitHub Action](https://github.com/slackapi/slack-github-action)

---

## 🎯 Next Steps

1. ✅ Add required secrets to GitHub
2. ✅ Push changes to main branch
3. ✅ Watch the automated deployment happen!
4. ✅ Receive Slack notifications

**Your RSS Reader is now on true CI/CD! 🚀**
