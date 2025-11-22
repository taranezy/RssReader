#!/bin/bash

# Check if nginx.conf exists and is readable
if [ ! -f /etc/nginx/nginx.conf ]; then
    echo "Error: /etc/nginx/nginx.conf not found"
    exit 1
fi

# Check if conf.d directory exists, create if not
if [ ! -d /etc/nginx/conf.d ]; then
    echo "Creating /etc/nginx/conf.d directory..."
    mkdir -p /etc/nginx/conf.d
fi

# Copy the portainer config
echo "Copying portainer.conf..."
cp /tmp/portainer-proxy.conf /etc/nginx/conf.d/portainer.conf

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

# If test passed, reload nginx
if [ $? -eq 0 ]; then
    echo "Configuration test passed. Reloading nginx..."
    systemctl reload nginx
    if [ $? -eq 0 ]; then
        echo "✓ Nginx reloaded successfully"
        echo "✓ Portainer should now be accessible at https://192.168.100.5/portainer"
    else
        echo "✗ Failed to reload nginx"
        exit 1
    fi
else
    echo "✗ Configuration test failed. Please check the config."
    exit 1
fi
