#!/bin/bash
set -euo pipefail

env_file="srcs/.env"


if command -v podman &>/dev/null; then
	container="podman"
	if [ -S /run/podman/podman.sock ]; then
		socket="/run/podman/podman.sock"
	elif [ -n "${XDG_RUNTIME_DIR:-}" ] && [ -S "${XDG_RUNTIME_DIR}/podman/podman.sock" ]; then
		socket="${XDG_RUNTIME_DIR}/podman/podman.sock"
	else
		socket=""
	fi
	echo "CI: using Podman"
elif command -v docker &>/dev/null; then
	container="docker"
	socket="/var/run/docker.sock"
	echo "CI: using Docker"
else
	echo "Neither found" >&2
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
