#!/bin/sh

# Start nginx with the main configuration
nginx -c /etc/nginx/nginx.conf -g "daemon off;"