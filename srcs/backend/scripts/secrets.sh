#!/bin/sh
set -e

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
export JWT_SECRETKEY=$(cat /run/secrets/jwt_secret_key)
export API_KEY=$(cat /run/secrets/api_key)

if [ $1 != "build" ] ; then
	exec npm run dev
else
	exec npm run build
fi
