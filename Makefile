
$(shell ./tools/podman-sock.sh > /dev/null)
include srcs/.env

COMPOSE = ${CONTAINER} compose -f srcs/compose.yml
COMPOSE_DEV = ${CONTAINER} compose -f srcs/compose.yml -f srcs/compose.dev.yml

all: secrets up

#
# Prod
#

up:
	${COMPOSE} up --build -d

down:
	${COMPOSE} down

logs:
	${COMPOSE} logs

#
# CI
#

ci: up

ci-dev:
	${COMPOSE_DEV} up --build -d

#
# Dev
#

dev:
	${COMPOSE_DEV} up --build -d

dev-down:
	${COMPOSE_DEV} down

dev-logs:
	${COMPOSE_DEV} logs

#
# Services
#

db-test:
	./tools/test_init_db.sh

game-test:
	${CONTAINER} run --rm -t --name game-test_skyjo -v "./srcs/backend:/app" -w /app node:22-bookworm-slim sh -c "npm ci && npm run game:verify"

#
# Clean
#

clean:
	${COMPOSE_DEV} down --remove-orphans

clean-volumes:
	$(COMPOSE_DEV) down --remove-orphans -v

clean-images:
	$(COMPOSE_DEV) down --remove-orphans --rmi local

fclean: 
	${COMPOSE_DEV} down --rmi all --volumes --remove-orphans
	-${CONTAINER} volume prune -f
	-${CONTAINER} image prune -af
	@rm -rf ./.last_user_id ./changelog.txt ./changelog0.txt

rl: clean up

dev-rl: clean dev

re: fclean all

rd: fclean dev

#
# Inspect
#

inspect:
	@${CONTAINER} images
	@printf "\n\e[44;97mVOLUMES:\e[0m\n" >&2
	@${CONTAINER} volume ls
	@printf "\n\e[44;97mPROCESS:\e[0m\n" >&2
	@${CONTAINER} ps

dev-inspect:
	@printf "\n\e[44;97mVOLUMES:\e[0m\n" >&2
	@${CONTAINER} volume ls
	@printf "\n\e[44;97mPROCESS:\e[0m\n" >&2
	@${CONTAINER} ps -a

ps:
	$(COMPOSE) ps

color-ps:
	./tools/dps.sh

watch-psa:
	watch -c -n 1 ./tools/dps.sh

dev-ps:
	./tools/dps.sh

#
#	Tools
#

secrets:
	./tools/secrets.sh

#
# Helps
#

help: help-prod help-dev help-clean help-info help-services

help-prod:
	@printf "\n  \033[1m--- prod\033[0m\n"
	@printf "    make up          	build + start\n"
	@printf "    make down        	stop\n"
	@printf "    make logs 		follow logs\n"

help-dev:
	@printf "\n  \033[1m--- dev\033[0m\n"
	@printf "    make dev        	build + start (compose.dev)\n"
	@printf "    make dev-down   	stop\n"
	@printf "    make dev-logs   	follow logs\n"

help-clean:
	@printf "\n  \033[1m--- clean\033[0m\n"
	@printf "    make clean       	only containers\n"
	@printf "    make clean-volumes  clean + volumes\n"
	@printf "    make clean-images   clean + images\n"
	@printf "    make dev-clean   	containers + volumes + local images\n"
	@printf "    make fclean   	everything (rmi all + prune)\n"
	@printf "    make re   		fclean + up\n"
	@printf "    make rl   		clean + up\n"
	@printf "    make drl		   	clean + dev-up\n"

help-info:
	@printf "\n  \033[1m--- info\033[0m\n"
	@printf "    make inspect   	images + volumes + ps\n"
	@printf "    make dev-inspect 	volumes + ps -a\n"
	@printf "    make ps   		[prod] ps\n"
	@printf "    make watch-psa   [dev] watch -n 1 ps -a\n"
	@printf "    make dev-ps   	[dev] ps -a\n"

help-services:
	@printf "\n  \033[1m--- services\033[0m\n"
	@printf "    make game-test  	tmp container run GE tests\n"

.PHONY: all \
	up down logs \
	dev-up dev-down dev-logs \
	clean clean-volumes clean-images dev-clean fclean re rl rd drl \
	inspect dev-inspect ps watch-psa dev-ps \
	game-test \
	help help-prod help-dev help-clean help-info help-services \
	secrets
