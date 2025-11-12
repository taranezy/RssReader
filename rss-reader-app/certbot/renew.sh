#!/bin/bash
# Certbot renewal script with proper resource management
# This script runs certbot renewal every 12 hours with proper signal handling

set -e

# Trap SIGTERM and exit gracefully
trap 'echo "Certbot renewal service shutting down..."; exit 0' TERM INT

# Log startup
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Certbot renewal service started"

# Renewal loop with proper sleep handling
while true; do
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Running certbot renewal check..."
    
    # Run renewal with quiet mode to minimize output
    if certbot renew --quiet --non-interactive --no-eff-email 2>&1; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✓ Certbot renewal check completed successfully"
    else
        EXIT_CODE=$?
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✗ Certbot renewal check exited with code: $EXIT_CODE"
    fi
    
    # Sleep for 12 hours (43200 seconds) with proper signal handling
    # The 'sleep' command will be interrupted by SIGTERM allowing graceful shutdown
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Sleeping for 12 hours until next renewal check..."
    sleep 43200 &
    wait $!
done
