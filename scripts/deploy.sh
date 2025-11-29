#!/bin/bash
# Production deployment script for RSS Reader
# This script safely deploys the application by cleaning up old containers before bringing up new ones

set -e  # Exit on any error

echo "======================================"
echo "RSS Reader - Production Deployment"
echo "======================================"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo ""
echo "Step 1: Cleaning up old containers..."
echo "----------------------------------------"

# Stop ALL containers globally (not just from this compose file)
echo "  Stopping all running containers..."
docker stop $(docker ps -q) 2>/dev/null || true
sleep 2

# Remove all containers
echo "  Removing all containers..."
docker rm $(docker ps -aq) 2>/dev/null || true
sleep 2

# Force stop and remove from current docker-compose file
echo "  Cleaning up current docker-compose..."
docker compose -f docker-compose.yml down -v 2>/dev/null || true
sleep 2

# Prune unused networks and volumes
echo "  Cleaning networks and volumes..."
docker network prune -f 2>/dev/null || true
docker volume prune -f 2>/dev/null || true

sleep 2
echo "  ✓ Cleanup complete"

echo ""
echo "Step 2: Bringing up services..."
echo "----------------------------------------"

# Use docker-compose to build and start services
docker compose -f docker-compose.yml up -d
sleep 3

echo "  ✓ Services started"

echo ""
echo "Step 3: Verifying services..."
echo "----------------------------------------"

# Wait for backend to be ready
echo "  Waiting for backend to initialize..."
sleep 5

# Check if backend is responsive
if curl -s http://localhost:3000/ > /dev/null; then
    echo "  ✓ Backend is responsive"
else
    echo "  ✗ Backend is not responsive yet"
fi

# Check if nginx is responsive
if curl -s -k https://localhost:8443/streamlet/ > /dev/null; then
    echo "  ✓ Nginx proxy is responsive"
else
    echo "  ✗ Nginx proxy is not responsive yet"
fi

echo ""
echo "Step 4: Running health checks..."
echo "----------------------------------------"

# Check backend configuration
echo "  Backend configuration:"
docker logs rss-reader-app 2>&1 | grep -E "FRONTEND_URL:|CORS_ORIGINS:|GOOGLE_CLIENT_ID:" | sed 's/^/    /'

echo ""
echo "======================================"
echo "✓ Deployment Complete"
echo "======================================"
echo ""
echo "Application is available at:"
echo "  https://streamlet.taranezy.com:8443/streamlet/"
echo ""
