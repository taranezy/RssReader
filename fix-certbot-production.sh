#!/bin/bash
# Quick deployment script to fix certbot memory issue on production
# Usage: bash fix-certbot-production.sh <production-server> <user>
# Example: bash fix-certbot-production.sh taranezy.ddns.net boris

set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 <production-server> <user>"
    echo "Example: $0 taranezy.ddns.net boris"
    exit 1
fi

SERVER=$1
USER=$2
APP_PATH="/home/$USER/rss-reader-app"

echo "================================"
echo "Certbot Memory Fix Deployment"
echo "================================"
echo "Server: $SERVER"
echo "User: $USER"
echo "App Path: $APP_PATH"
echo ""

# 1. Stop old certbot container
echo "[1/5] Stopping old certbot container..."
ssh $USER@$SERVER "cd $APP_PATH && docker stop rss-reader-certbot 2>/dev/null || true"
ssh $USER@$SERVER "cd $APP_PATH && docker rm rss-reader-certbot 2>/dev/null || true"
echo "✓ Old container removed"

# 2. Backup current compose file
echo "[2/5] Backing up docker-compose.prod.yml..."
ssh $USER@$SERVER "cd $APP_PATH && cp docker-compose.prod.yml docker-compose.prod.yml.backup"
echo "✓ Backup created"

# 3. Copy new files
echo "[3/5] Copying fixed certbot renewal script..."
scp ./certbot/renew.sh $USER@$SERVER:$APP_PATH/certbot/renew.sh
scp ./docker-compose.prod.yml $USER@$SERVER:$APP_PATH/docker-compose.prod.yml
echo "✓ Files copied"

# 4. Make script executable and start container
echo "[4/5] Starting corrected certbot container..."
ssh $USER@$SERVER "cd $APP_PATH && chmod +x certbot/renew.sh && docker-compose -f docker-compose.prod.yml up -d certbot"
echo "✓ Container started"

# 5. Verify
echo "[5/5] Verifying deployment..."
ssh $USER@$SERVER "sleep 2 && docker ps | grep certbot && docker logs rss-reader-certbot | head -5"
echo "✓ Deployment complete!"

echo ""
echo "================================"
echo "Next Steps:"
echo "================================"
echo "1. Monitor memory usage:"
echo "   ssh $USER@$SERVER 'docker stats rss-reader-certbot'"
echo ""
echo "2. Check renewal logs:"
echo "   ssh $USER@$SERVER 'docker logs rss-reader-certbot'"
echo ""
echo "3. Verify certificate:"
echo "   ssh $USER@$SERVER 'docker exec rss-reader-certbot certbot certificates'"
echo ""
echo "4. If issues occur, rollback:"
echo "   ssh $USER@$SERVER 'cd $APP_PATH && cp docker-compose.prod.yml.backup docker-compose.prod.yml && docker-compose -f docker-compose.prod.yml up -d'"
