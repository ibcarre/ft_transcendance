
COMPOSE = docker compose -f srcs/compose.yml
COMPOSE_DEV = docker compose -f srcs/compose.yml -f srcs/compose.dev.yml

all: up

up:
	${COMPOSE} up --build -d

down:
	${COMPOSE} down

logs:
	${COMPOSE} logs

du: dev
dev:
	${COMPOSE_DEV} up --build -d

dd: dev-down
dev-down:
	${COMPOSE_DEV} down

dl: dev-logs
dev-logs:
	${COMPOSE} logs

clean:
	${COMPOSE} down --remove-orphans

fclean: 
	${COMPOSE} down --rmi all --volumes --remove-orphans

re: fclean up

.PHONY: all up down logs dev-up dev-down dev-logs clean fclean re
