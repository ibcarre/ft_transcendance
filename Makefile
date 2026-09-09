
COMPOSE = docker compose -f srcs/compose.yml
COMPOSE_DEV = docker compose -f srcs/compose.yml -f srcs/compose.dev.yml

all: up

up:
	${COMPOSE} up --build -d

down:
	${COMPOSE} down

logs:
	${COMPOSE} logs -f

dev-up:
	${COMPOSE_DEV} up --build


dev-up-d:
	${COMPOSE_DEV} up --build -d

dev-down:
	${COMPOSE_DEV} down

dev-logs:
	${COMPOSE} logs -f

clean:
	${COMPOSE} down --remove-orphans

fclean: 
	${COMPOSE} down --rmi all --volumes --remove-orphans

re: fclean up

.PHONY all up down logs dev-up dev-down dev-logs clean fclean re
