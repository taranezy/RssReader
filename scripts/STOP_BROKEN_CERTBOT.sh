#!/bin/bash
# URGENT: Stop broken certbot container consuming memory on production
# This must be run IMMEDIATELY to stop the memory leak

set -e

if [ $# -lt 2 ]; then
    echo "URGENT: Stop broken certbot container"
    echo "Usage: $0 <production-server> <user>"
    echo "Example: $0 streamlet.taranezy.com boris"
    exit 1
fi

SERVER=$1
USER=$2
APP_PATH="/home/$USER/rss-reader-app"

echo "================================"
echo "🚨 URGENT: Stopping Broken Certbot"
echo "================================"
echo "Server: $SERVER"
echo "User: $USER"
echo ""

# Kill the broken container immediately
echo "[URGENT] Killing broken certbot container..."
ssh $USER@$SERVER "docker kill rss-reader-certbot 2>/dev/null || true" || true

echo "✓ Container killed"
echo ""

# Remove it
echo "Removing old container..."
ssh $USER@$SERVER "docker rm rss-reader-certbot 2>/dev/null || true" || true

echo "✓ Container removed"
echo ""

# Verify it's gone
echo "Verifying old container is stopped..."
RUNNING=$(ssh $USER@$SERVER "docker ps | grep certbot" || echo "")

if [ -z "$RUNNING" ]; then
    echo "✅ CONFIRMED: Old certbot container is stopped!"
else
    echo "⚠️  Warning: Container may still be running"
    echo "$RUNNING"
fi

echo ""
echo "================================"
echo "✅ Broken container stopped"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Copy new files to production"
echo "2. Run: ssh $USER@$SERVER 'cd $APP_PATH && chmod +x certbot/renew.sh && docker-compose -f docker-compose.prod.yml up -d certbot'"
echo "3. Verify: ssh $USER@$SERVER 'docker logs rss-reader-certbot'"
