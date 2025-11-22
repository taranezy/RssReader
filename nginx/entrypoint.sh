#!/bin/sh

# Nginx entrypoint script to choose between nginx.conf and nginx-https.conf
# If nginx-https.conf exists, use it; otherwise use nginx.conf

if [ -f /etc/nginx/nginx-https.conf ]; then
    echo "Using nginx-https.conf configuration"
    nginx -c /etc/nginx/nginx-https.conf -g "daemon off;"
else
    echo "Using nginx.conf configuration"
    nginx -c /etc/nginx/nginx.conf -g "daemon off;"
fi