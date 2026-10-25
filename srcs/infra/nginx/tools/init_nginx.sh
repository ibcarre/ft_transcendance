#!/bin/bash
set -eu

mkdir -p /etc/nginx/ssl
# Create certificate if not already here
if [ ! -f /etc/nginx/ssl/skyjo.crt ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/skyjo.key \
        -out /etc/nginx/ssl/skyjo.crt \
        -subj "/C=FR/ST=IDF/L=Paris/O=42/OU=Skyjo/CN=skyjo" \
		-addext "subjectAltName=DNS:skyjo,IP:127.0.0.1"

fi

exec nginx -g "daemon off;"
