#!/bin/bash
# Deploy nginx configuration for RSS Reader

# Check if config file exists
if [ ! -f "/tmp/rss-reader-host-proxy.conf" ]; then
    echo "Error: /tmp/rss-reader-host-proxy.conf not found"
    exit 1
fi

# Copy to nginx conf.d
echo "Deploying nginx configuration..."
sudo cp /tmp/rss-reader-host-proxy.conf /etc/nginx/conf.d/
sudo chmod 644 /etc/nginx/conf.d/rss-reader-host-proxy.conf

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✓ Configuration test passed"
    echo "Reloading nginx..."
    sudo systemctl reload nginx
    echo "✓ Nginx reloaded successfully"
    echo ""
    echo "Host nginx is now configured!"
    echo "Application available at: https://streamlet.taranezy.com/"
else
    echo "✗ Configuration test failed"
    exit 1
fi
