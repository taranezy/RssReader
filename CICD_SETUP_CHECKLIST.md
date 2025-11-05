# GitHub Actions CI/CD - Quick Setup Checklist

Complete these steps to activate your CI/CD pipeline.

## ✅ Step 1: Generate SSH Key (if needed)

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github-actions -N ""
```

## ✅ Step 2: Copy SSH Private Key

```bash
cat ~/.ssh/github-actions
```

Copy the entire output.

## ✅ Step 3: Add SSH Public Key to Andromeda

```bash
ssh-copy-id -i ~/.ssh/github-actions.pub boris@andromeda
```

Or manually:
```bash
ssh boris@andromeda "echo '$(cat ~/.ssh/github-actions.pub)' >> ~/.ssh/authorized_keys"
```

## ✅ Step 4: Add GitHub Secrets

Go to: **Repository → Settings → Secrets and variables → Actions**

Create these secrets:

| Secret Name | Value | Example |
|------------|-------|---------|
| `SSH_PRIVATE_KEY` | Private key from Step 2 | `-----BEGIN RSA PRIVATE KEY-----...` |
| `DEPLOY_HOST` | Your server hostname | `andromeda` |
| `DEPLOY_USER` | SSH username | `boris` |
| `DOCKER_USERNAME` | Docker Hub username | `your-docker-username` |
| `DOCKER_PASSWORD` | Docker Hub token | `dckr_pat_xxxxx` |
| `SLACK_WEBHOOK_URL` | (Optional) Slack webhook | `https://hooks.slack.com/...` |

### How to Get Docker Hub Token:

1. Go to https://hub.docker.com
2. Login to your account
3. Click profile → **Account Settings** → **Security**
4. Click **New Access Token**
5. Name: `github-actions`
6. Copy the token

### How to Get Slack Webhook (Optional):

1. Go to https://api.slack.com/apps
2. Create New App
3. Enable **Incoming Webhooks**
4. Add New Webhook to Workspace
5. Copy the Webhook URL

## ✅ Step 5: Verify Workflows

1. Go to your repository
2. Click **Actions** tab
3. You should see:
   - `CI/CD Pipeline - Build & Deploy`
   - `PR Validation`

## ✅ Step 6: Test the Pipeline

### Option A: Push to Main

```bash
git add .
git commit -m "Add GitHub Actions CI/CD"
git push origin main
```

### Option B: Manual Trigger

1. Go to **Actions** tab
2. Select **CI/CD Pipeline - Build & Deploy**
3. Click **Run workflow** button
4. Choose branch: `main`
5. Click **Run workflow**

## 🎯 What Will Happen

1. ✅ GitHub Actions starts
2. ✅ Tests run (linting, build, unit tests)
3. ✅ Docker image built and pushed
4. ✅ Remote server pulls code
5. ✅ Docker containers restarted
6. ✅ Health check runs
7. ✅ Slack notification sent (if configured)
8. ✅ Your app is live! 🚀

## 📊 Monitor Deployment

1. Go to **Actions** tab
2. Click on the running workflow
3. Watch each stage complete
4. View logs for any stage
5. Check **Deployments** tab for history

## 🆘 Common Issues

### "SSH connection failed"
- Verify SSH key is added to andromeda
- Check DEPLOY_HOST and DEPLOY_USER are correct
- Run: `ssh -i ~/.ssh/github-actions boris@andromeda "echo connected"`

### "Docker push failed"
- Verify Docker Hub credentials
- Check Docker Hub token hasn't expired
- Ensure docker/login-action is using correct credentials

### "Deployment failed"
- Check container logs: `docker logs rss-reader-app`
- Verify git repo is cloned on remote
- Check docker-compose.prod.yml exists

### "Health check failed"
- Give app more time to start (already 10 sec delay)
- Check if app is running: `docker ps`
- View logs: `docker logs rss-reader-app`

## 💡 Tips

- Check workflow status badge in README
- View detailed logs for each step
- Use manual workflow triggers for testing
- Slack notifications help track deployments
- All workflow runs are saved for audit trail

## 🎉 You're Done!

Your RSS Reader now has a **professional CI/CD pipeline**! 

Every push to `main` will:
- ✅ Test your code
- ✅ Build Docker image
- ✅ Deploy to production
- ✅ Notify you of status

**Happy Deploying! 🚀**

---

## Next: Add Workflow Status Badge to README

Add this to your `README.md`:

```markdown
## Status

![Deploy](https://github.com/taranezy/RssReader/workflows/CI%2FCD%20Pipeline%20-%20Build%20%26%20Deploy/badge.svg)
```

This shows the latest workflow status in your README!
