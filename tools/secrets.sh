#!/bin/bash

set -eu

if [ !  -d "$PWD/secrets" ]; then
	if [ ! -f "$PWD/secrets.7z" ]; then
		printf "\033[0;31mNo zip file, and no secrets directory. Could not be launched\033[0m\n"
		exit 1
	else
		7z x "${PWD}/secrets.7z" -y
	fi
fi

source "${PWD}/srcs/.env"

if [ ! -f "${PWD}/secrets/SMTP_ADDRESS.txt" ]; then
	printf "\033[0;31mSecrets/SMTP_ADDRESS.txt not found\033[0m\n"
	exit 1
fi


smtp_mail=$(cat ${PWD}/secrets/SMTP_ADDRESS.txt)

sed -i "s#GF_SMTP_USER=.*#GF_SMTP_USER=${smtp_mail}#w changelog.txt" ${PWD}/srcs/.env
if [[ -s changelog.txt ]]; then
	printf "\033[0;32m.env SMTP_ADDRESS changed\033[0m\n"
else
	printf "\033[0;36m.env SMTP_ADDRESS create\033[0m\n"
	printf "SMTP_ADDRESS=${smtp_mail}\n" >> ${PWD}/srcs/.env
fi

rm -rf changelog.txt


if [ ! -f "${PWD}/secrets/POSTGRES_PASSWORD.txt" ]; then
	exit 1
fi
postgres_pswd=$(cat "${PWD}/secrets/POSTGRES_PASSWORD.txt")
db_url="postgresql://${POSTGRES_USER}:${postgres_pswd}@postgres:5432/${POSTGRES_DB}"

if [ ! -f "${PWD}/secrets/DATABASE_URL.txt" ]; then
	echo ${db_url} > "${PWD}/secrets/DATABASE_URL.txt"
fi
