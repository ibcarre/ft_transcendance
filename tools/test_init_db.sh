#bin/bash
set -eu

count0=$(podman compose -f srcs/compose.yml exec -T postgres psql -U skyjo -d skyjo_db -v ON_ERROR_STOP=1  -c "\dt;" -- | grep rows | awk '{print $1}' | cut -b 2)

count1=$(grep -c "TABLE" srcs/infra/postgres/init_sql/01_schema.sql)

if [ ${count0} != ${count1} ]; then 
	printf "\033[0;31mDB not well created (${count0}/${count1})\033[0m\n"
	exit 1
fi

printf "\033[0;32mDB well created (${count0}/${count1}) \033[0;0m\n"
