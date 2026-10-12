#!/bin/bash
set -eu

if [ ! -f /run/secrets/postgres_password ]; then
  echo "secret postgres_password not found" >&2
  exit 1
fi

if [ ! -f /run/secrets/jwt_secret_key ]; then
  echo "secret jwt not found" >&2
  exit 1
fi

if [ ! -f /run/secrets/api_key ]; then
  echo "secret api key not found" >&2
  exit 1
fi


postgres_pswd=$(cat /run/secrets/postgres_password)


export DATABASE_URL="posgressql://${POSTGRES_USER}:${postgres_pswd}@postgres:5432/${POSTGRES_DB}"
export JWT_SECRET_KEY=$(cat /run/secrets/jwt_secret_key)
export API_KEY=$(cat /run/secrets/api_key)

$(/bin/sh)

# enpm ci
if [ $1 == "build" ] ; then
	exec npm run build
else
	exec npm run dev
fi
