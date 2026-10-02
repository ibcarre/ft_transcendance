
COMPOSE = docker compose -f srcs/compose.yml
COMPOSE_DEV = docker compose -f srcs/compose.yml -f srcs/compose.dev.yml

all: up

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

game-test:
	docker run --rm -v "./srcs/backend:/app" -w /app node:22-bookworm-slim sh -c "npm ci && npm run game:verify"

#
# Clean
#

clean:
	${COMPOSE} down --remove-orphans

clean-volumes:
	$(COMPOSE) down --remove-orphans -v
	$(COMPOSE_DEV) down --remove-orphans -v

clean-images:
	$(COMPOSE) down --remove-orphans --rmi local
	$(COMPOSE_DEV) down --remove-orphans --rmi local

dev-clean:
	${COMPOSE_DEV} down --remove-orphans --rmi local -v

fclean: 
	${COMPOSE} down --rmi all --volumes --remove-orphans
	${COMPOSE_DEV} down --rmi all --volumes --remove-orphans
	-docker volume prune -f
	-docker image prune -af

rl: clean up

dev-rl: dev-clean dev

re: fclean up

rd: fclean dev

#
# Inspect
#

inspect:
	@docker images
	@echo "\n\e[44;97mVOLUMES:\e[0m"
	@docker volume ls
	@echo "\n\e[44;97mPROCESS:\e[0m"
	@docker ps

dev-inspect:
	@echo "\n\e[44;97mVOLUMES:\e[0m"
	@docker volume ls
	@echo "\n\e[44;97mPROCESS:\e[0m"
	@docker ps -a

ps:
	$(COMPOSE) ps

color-ps:
	./tools/dps.sh

watch-psa:
	watch -c -n 1 ./tools/dps.sh

dev-ps:
	$(COMPOSE_DEV) ps -a

#
# Helps
#

help: help-prod help-dev help-clean help-info help-services

help-prod:
	@echo "\n  \033[1m--- prod\033[0m\n"
	@echo "    make up          	build + start\n"
	@echo "    make down        	stop\n"
	@echo "    make logs 		follow logs\n"

help-dev:
	@echo "\n  \033[1m--- dev\033[0m\n"
	@echo "    make dev        	build + start (compose.dev)\n"
	@echo "    make dev-down   	stop\n"
	@echo "    make dev-logs   	follow logs\n"

help-clean:
	@echo "\n  \033[1m--- clean\033[0m\n"
	@echo "    make clean       	only containers\n"
	@echo "    make clean-volumes  clean + volumes\n"
	@echo "    make clean-images   clean + images\n"
	@echo "    make dev-clean   	containers + volumes + local images\n"
	@echo "    make fclean   	everything (rmi all + prune)\n"
	@echo "    make re   		fclean + up\n"
	@echo "    make rl   		clean + up\n"
	@echo "    make drl		   	clean + dev-up\n"

help-info:
	@echo "\n  \033[1m--- info\033[0m\n"
	@echo "    make inspect   	images + volumes + ps\n"
	@echo "    make dev-inspect 	volumes + ps -a\n"
	@echo "    make ps   		[prod] ps\n"
	@echo "    make watch-psa   [dev] watch -n 1 ps -a\n"
	@echo "    make dev-ps   	[dev] ps -a\n"

help-services:
	@echo "\n  \033[1m--- services\033[0m\n"
	@echo "    make game-test  	tmp container run GE tests\n"


.PHONY: all \
	up down logs \
	dev-up dev-down dev-logs \
	clean clean-volumes clean-images dev-clean fclean re rl rd drl \
	inspect dev-inspect ps watch-psa dev-ps \
	game-test \
	help help-prod help-dev help-clean help-info help-services
