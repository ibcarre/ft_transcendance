#!/bin/bash
set -e

env_file="srcs/.env"

if command -v podman &>/dev/null; then
  container="podman"
  echo "CI: using Podman"
else
  container="docker"
  echo "CI: using Docker"
fi

[ -f "$env_file" ] || cp srcs/.env.example "$env_file"

if grep -q "^CONTAINER=" "$env_file"; then
  sed -i "s|^CONTAINER=.*|CONTAINER=${container}|" "$env_file"
else
  echo "CONTAINER=${container}" >> "$env_file"
fi

if [ "$container" = "docker" ]; then
  socket="/var/run/docker.sock"
  if grep -q "^SOCKET=" "$env_file"; then
    sed -i "s|^SOCKET=.*|SOCKET=${socket}|" "$env_file"
  else
    echo "SOCKET=${socket}" >> "$env_file"
  fi
fi

echo "CI setup done (CONTAINER=${container})"
