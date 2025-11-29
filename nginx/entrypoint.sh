#!/bin/sh

# Nginx entrypoint script for RSS Reader
# Use nginx.conf configuration

echo "Starting nginx with RSS Reader configuration"
nginx -c /etc/nginx/nginx.conf -g "daemon off;"