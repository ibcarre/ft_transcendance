#!/bin/sh
set -e

if [ ! -f /run/secrets/api_key ]; then
  echo "secret api key not found" >&2
  exit 1
fi

api_key=$(cat /run/secrets/api_key)

curl -f -H "x-api-key: ${api_key}" http://localhost:5000/v1/health
