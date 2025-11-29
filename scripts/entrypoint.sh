#!/bin/sh
# Entrypoint script for nginx container

# Wait for certificates to potentially be available
sleep 3

# Check if SSL certificates exist and use appropriate config
if [ -f /etc/letsencrypt/live/streamlet.taranezy.com/fullchain.pem ] && [ -f /etc/letsencrypt/live/streamlet.taranezy.com/privkey.pem ]; then
    echo "SSL certificates found, using HTTPS configuration..."
    CONFIG_FILE="/etc/nginx/nginx-https.conf"
    if [ -f "$CONFIG_FILE" ]; then
        # Use the HTTPS config by copying it
        cat "$CONFIG_FILE" > /tmp/nginx.conf.actual
        exec nginx -c /tmp/nginx.conf.actual -g "daemon off;"
    else
        echo "HTTPS config not found, using default HTTP config..."
        exec nginx -g "daemon off;"
    fi
else
    echo "SSL certificates not found, using HTTP-only configuration..."
    exec nginx -g "daemon off;"
fi
