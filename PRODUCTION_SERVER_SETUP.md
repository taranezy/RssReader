# 🚀 One-Time Production Server Setup

Run these commands on your production server (andromeda) to prepare for CI/CD deployment:

## Step 1: SSH into your production server

```bash
ssh boris@andromeda
```

## Step 2: Create the rss-reader directory and clone the repo

```bash
# Create directory
mkdir -p ~/rss-reader
cd ~/rss-reader

# Initialize as a git repo (or clone if you have it on GitHub)
# Option A: If you have SSH key set up, clone from GitHub
git clone https://github.com/taranezy/RssReader.git .

# Option B: If SSH keys are set up on the server
git clone git@github.com:taranezy/RssReader.git .
```

## Step 3: Verify the setup

```bash
cd ~/rss-reader
ls -la
git status
docker-compose -f docker-compose.prod.yml ps
```

## Step 4: Test the deployment

Push a commit to main branch and watch the GitHub Actions workflow deploy automatically!

---

## 🔍 Troubleshooting

### If you get "permission denied"
```bash
sudo mkdir -p ~/rss-reader
sudo chown -R boris:boris ~/rss-reader
cd ~/rss-reader
```

### If git clone fails
Make sure:
1. SSH key is set up on andromeda
2. GitHub SSH key is added to your account
3. You can manually clone: `git clone git@github.com:taranezy/RssReader.git .`

### If docker-compose isn't found
```bash
# Install Docker Compose if needed
sudo apt install docker-compose
# Or use: docker compose (newer versions)
```

### Check if directory exists and is a repo
```bash
cd ~
ls -la | grep rss-reader
cd ~/rss-reader
git log --oneline | head -5
```

---

## ✅ After Setup

Once you've done this, the CI/CD pipeline will:
1. ✅ SSH to your server
2. ✅ Git pull latest code
3. ✅ Docker build
4. ✅ Docker restart
5. ✅ App live!

**All automatically on every push to main!** 🎉
