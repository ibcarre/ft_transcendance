#!/bin/bash
set -e

env_file="srcs/.env"

if command -v podman &>/dev/null; then
	container="podman"
	socket="/run/podman/podman.sock"
	echo "CI: using Podman"
else
	echo "Podman not found" >&2
	exit 1
fi

[ -f "$env_file" ] || cp srcs/.env.example "$env_file"

if grep -q "^CONTAINER=" "$env_file"; then
  sed -i "s|^CONTAINER=.*|CONTAINER=${container}|" "$env_file"
else
  echo "CONTAINER=${container}" >> "$env_file"
fi

if [ -n "$socket" ]; then
	if grep -q "^SOCKET=" "$env_file"; then
		sed -i "s|^SOCKET=.*|SOCKET=${socket}|" "$env_file"
	else
		echo "SOCKET=${socket}" >> "$env_file"
	fi
fi

# cat "$env_file"
echo "CI setup done (CONTAINER=${container}, SOCKET=${socket})"
