# Docker cleanup script for RSS Reader deployment
# Run this on your production server to clean up conflicting containers

#!/bin/bash
set -e

echo "🧹 Cleaning up Docker containers and networks..."

# Stop all running containers
echo "Stopping all containers..."
docker stop $(docker ps -aq) 2>/dev/null || true

# Remove all containers
echo "Removing all containers..."
docker rm -f $(docker ps -aq) 2>/dev/null || true

# Remove all networks
echo "Removing unused networks..."
docker network prune -f

# Remove unused volumes
echo "Removing unused volumes..."
docker volume prune -f

# Remove dangling images
echo "Removing dangling images..."
docker image prune -f

echo "✅ Docker cleanup complete!"
echo ""
echo "You can now run your deployment again."