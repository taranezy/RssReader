# GitHub Actions Setup for Automated Deployment

If you want to automate deployments via GitHub Actions when you push to the repository, follow these steps:

## Required GitHub Secrets

Go to your repository settings → Secrets and variables → Actions, and add these secrets:

### 1. SSH_PRIVATE_KEY
Your SSH private key for accessing andromeda server.

```bash
# Generate a new SSH key specifically for GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-rss-reader" -f ~/.ssh/github-actions-rss

# Copy the PRIVATE key content (the one WITHOUT .pub)
cat ~/.ssh/github-actions-rss

# Add the PUBLIC key to andromeda
ssh-copy-id -i ~/.ssh/github-actions-rss.pub your-username@andromeda
```

Paste the **private key** content as the secret value.

### 2. ANDROMEDA_HOST
The hostname or IP address of your andromeda server.
```
andromeda
```
or
```
192.168.x.x
```

### 3. ANDROMEDA_USER
The SSH username for connecting to andromeda.
```
your-username
```

### 4. DEPLOY_PATH (optional)
The deployment path on andromeda. Defaults to `/opt/rss-reader`.
```
/opt/rss-reader
```

### 5. ENV_FILE
The complete content of your `.env` file with production settings.

```env
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://andromeda:3000/api/auth/google/callback
```

## How It Works

1. When you push to the `main` branch, GitHub Actions will:
   - Build the Docker image
   - Copy it to andromeda server
   - Deploy using docker-compose
   - Verify the deployment

2. You can also trigger deployment manually from the Actions tab

## Testing the Workflow

```bash
# Make a change
git add .
git commit -m "Test automated deployment"
git push origin main

# Watch the deployment in GitHub Actions tab
```

## Troubleshooting

### SSH Connection Issues

Test SSH from GitHub Actions by adding this temporary step:

```yaml
- name: Test SSH
  run: |
    ssh ${ANDROMEDA_USER}@${ANDROMEDA_HOST} "echo 'SSH connection successful'"
```

### Viewing Deployment Logs

```bash
# SSH to andromeda
ssh your-username@andromeda

# View container logs
cd /opt/rss-reader
docker-compose logs -f
```

## Disabling GitHub Actions

If you prefer manual deployment only:

1. Remove or rename the `.github/workflows/deploy.yml` file
2. Or add `if: false` to the job

```yaml
jobs:
  deploy:
    if: false  # Disable this workflow
    runs-on: ubuntu-latest
```
