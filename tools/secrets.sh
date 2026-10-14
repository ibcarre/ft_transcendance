#!/bin/bash

set -eu

smtp_mail=$(cat ${PWD}/secrets/SMTP_ADDRESS.txt)

sed -i "s#GF_SMTP_USER=.*#GF_SMTP_USER=${smtp_mail}#w changelog.txt" ${PWD}/srcs/.env
if [[ -s changelog.txt ]]; then
	printf "\033[0;32m.env SMTP_ADDRESS changed\033[0m\n"
else
	printf "\033[0;36m.env SMTP_ADDRESS create\033[0m\n"
	printf "SMTP_ADDRESS=${smtp_mail}\n" >> ${PWD}/srcs/.env
fi

rm -rf changelog.txt

if [ !  -d "$PWD/secrets" ]; then
	if [ ! -f "$PWD/secrets.7z" ]; then
		echo "No zip file, and no secrets directory. Could not be launched" >&2
		exit 1
	else
		exec 7z x "${PWD}/secrets.7z" -o"${PWD}" -y
	fi
fi

source "${PWD}/srcs/.env"

if [ ! -f "${PWD}/secrets/POSTGRES_PASSWORD.txt" ]; then
	exit 1
fi
postgres_pswd=$(cat "${PWD}/secrets/POSTGRES_PASSWORD.txt")
db_url="postgresql://${POSTGRES_USER}:${postgres_pswd}@postgres:5432/${POSTGRES_DB}"

if [ ! -f "${PWD}/secrets/POSTGRES_PASSWORD" ]; then
	exec echo ${db_url} > "${PWD}/secrets/DATABASE_URL.txt"
fi
