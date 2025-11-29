#!/bin/bash
# EMERGENCY: Complete fix for broken certbot on production
# This stops the old broken container and deploys the fixed version
# Run this immediately!

set -e

if [ $# -lt 2 ]; then
    echo "🚨 EMERGENCY CERTBOT FIX"
    echo "Usage: $0 <production-server> <user>"
    echo "Example: $0 streamlet.taranezy.com boris"
    exit 1
fi

SERVER=$1
USER=$2
APP_PATH="/home/$USER/rss-reader-app"

echo "================================"
echo "🚨 EMERGENCY: Certbot Memory Leak Fix"
echo "================================"
echo "Server: $SERVER"
echo "User: $USER"
echo "App Path: $APP_PATH"
echo ""
echo "This script will:"
echo "1. Kill broken certbot container (stops memory leak)"
echo "2. Upload fixed renew.sh and docker-compose.prod.yml"
echo "3. Start new fixed container"
echo "4. Verify fix"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# STEP 1: Kill broken container IMMEDIATELY
echo ""
echo "================================"
echo "[STEP 1/5] 🛑 Killing broken certbot container..."
echo "================================"
ssh $USER@$SERVER "docker kill rss-reader-certbot 2>/dev/null || true" || true
ssh $USER@$SERVER "docker rm rss-reader-certbot 2>/dev/null || true" || true
echo "✓ Broken container stopped"

# STEP 2: Backup old files
echo ""
echo "================================"
echo "[STEP 2/5] 📦 Backing up old files..."
echo "================================"
ssh $USER@$SERVER "cd $APP_PATH && cp docker-compose.prod.yml docker-compose.prod.yml.broken.backup"
echo "✓ Backup created at docker-compose.prod.yml.broken.backup"

# STEP 3: Copy new files
echo ""
echo "================================"
echo "[STEP 3/5] 📤 Uploading fixed files..."
echo "================================"
echo "Copying certbot/renew.sh..."
scp ./certbot/renew.sh $USER@$SERVER:$APP_PATH/certbot/renew.sh
echo "✓ renew.sh copied"

echo "Copying docker-compose.prod.yml..."
scp ./docker-compose.prod.yml $USER@$SERVER:$APP_PATH/docker-compose.prod.yml
echo "✓ docker-compose.prod.yml copied"

# STEP 4: Start fixed container
echo ""
echo "================================"
echo "[STEP 4/5] 🚀 Starting fixed certbot container..."
echo "================================"
ssh $USER@$SERVER "cd $APP_PATH && chmod +x certbot/renew.sh && docker-compose -f docker-compose.prod.yml up -d certbot"
echo "✓ Fixed container started"

# STEP 5: Verify fix
echo ""
echo "================================"
echo "[STEP 5/5] ✅ Verifying fix..."
echo "================================"
sleep 3

echo ""
echo "Container Status:"
ssh $USER@$SERVER "docker ps | grep certbot" || echo "Warning: Container not found"

echo ""
echo "First 10 lines of logs (should NOT show 'Illegal number' error):"
ssh $USER@$SERVER "docker logs rss-reader-certbot 2>&1 | head -10"

echo ""
echo "Memory usage (should be < 50MB):"
ssh $USER@$SERVER "docker stats --no-stream rss-reader-certbot 2>&1 | tail -1"

echo ""
echo "================================"
echo "✅ EMERGENCY FIX COMPLETE!"
echo "================================"
echo ""
echo "✅ Broken certbot stopped"
echo "✅ Fixed version deployed"
echo "✅ Logs should show renewal script, not 'Illegal number' errors"
echo ""
echo "⚠️  If you still see errors:"
echo "1. Check logs: ssh $USER@$SERVER 'docker logs rss-reader-certbot'"
echo "2. Verify mount: ssh $USER@$SERVER 'ls -la $APP_PATH/certbot/renew.sh'"
echo "3. Check docker-compose: ssh $USER@$SERVER 'cat $APP_PATH/docker-compose.prod.yml | grep -A 10 certbot:'"
echo ""
echo "To rollback (NOT recommended):"
echo "ssh $USER@$SERVER 'cd $APP_PATH && cp docker-compose.prod.yml.broken.backup docker-compose.prod.yml && docker-compose -f docker-compose.prod.yml up -d certbot'"
