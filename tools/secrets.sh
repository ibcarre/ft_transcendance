#!/bin/bash

set -eu
if [ -d "$PWD/secrets" ]; then
	exit 0
fi

if [ ! -f "$PWD/secrets.7z" ]; then
	echo "No zip file, and no secrets directory. Could not be launched" >&2
	exit 1
else
	echo "Enter password (will not be echoed):" >&2
	exec 7z x "${PWD}/secrets.7z" -o"${PWD}" -y
fi
