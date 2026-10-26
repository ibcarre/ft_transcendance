*This project has been created as part of the 42 curriculum by ibaaziz{PO-dev} , homohame{PM-dev}, mkerrien{PM}, benjamsc{ARC-dev}*
# Descrtiption
The goal of our project is to create an online version of the game Skyjo [rules](./docs/rules/RULES.en.md)
    that can accommodate 2 to 4 players in real time, with basic user interactions.
Dashboards build with grafana and exporter like prometheus and postgres-exporter.

To do this, the four of us have divided the tasks among ourselves as follows:
- DevOps (infrastructure/containerization)
- Front-end (React)
- Back-end (Express)
- Game engine (server-side state machine)

# Instruction
## Users
To use the project as a product:
A simple `make` command is all that’s needed to initialize it, then use `make down` to stop the services and `make up` to restart them (without losing data).

To recompile everything without losing the volumes, use `make rl` or `make clean && make`.

`make clean-volumes` deletes the volumes as well as the local images.

The `make fclean` command deletes everything: the volumes, the local images, the downloaded images, and even the Docker/Podman cache.

There are a few additional `make` utility commands listed in `make help`.

## Dev
The basic `make` commands all have a dev version (listed in `make help`) (ex: make dev, make dev-rl, ...)

The changes are:
- The module nodes in the frontend and backend are mounted as volumes to avoid having to rebuild everything every time
- The frontend and backend sources are also mounted as volumes to allow for more responsive changes
- All services are exposed locally to facilitate testing

For information on the game engine, see [GE Dev Docs](./docs/DEV_DOC_GAME.en.md);

![Architectural diagram](./docs/Skyjo_architecture_EN_2026-10-25.pbg.svg)

## Ressources

### Containerization
- [Healthcheck](https://docs.docker.com/reference/compose-file/services/#healthcheck)
- [compose build](https://docs.docker.com/reference/compose-file/build/)
- [dependecies](https://docs.docker.com/compose/gettingstarted/)
- [podman](https://docs.podman.io/en/latest/)

### Postgres
- [doc](https://docs.postgresql.fr/18/intro-whatis.html)
- [docker hub ](https://hub.docker.com/_/postgres/)
- [docker env var](https://github.com/docker-library/docs/blob/master/postgres/README.md#environment-variables)
- [sql cheatsheet](https://www.geeksforgeeks.org/sql/sql-cheat-sheet/)
- [sql course](https://www.w3schools.com/sql/)

### Grafana
- [main Doc](https://grafana.com/docs/grafana/latest/)
- [alerting](https://grafana.com/docs/grafana-cloud/observe-and-act/alert-and-measure-reliability/alerting/)
#### Loki
- [deployement modes](https://grafana.com/docs/loki/latest/get-started/deployment-modes/)
#### Alloy
- [alloy](https://grafana.com/docs/alloy/latest/)

### Node
- [Best practices docker node](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [docker hub Node](https://hub.docker.com/_/node/)
- [socket io](https://socket.io/docs/v4)
- [expresJs](https://expressjs.com/)
- [TypeScript documentation](https://www.typescriptlang.org/docs/)
- [pg_promise](https://vitaly-t.github.io/pg-promise/)
#### React
- [ecole-du-web](https://github.com/ecole-du-web/react-modal/tree/main)
- [Popup Modal](https://www.youtube.com/watch?v=Gy4G68WoHq4)
- [Websockets (socket.io)](https://www.youtube.com/watch?v=JyW9NDdXAtM)
- [JS Form Validation](https://www.youtube.com/watch?v=brcHK3P6ChQ&list=PL0Zuz27SZ-6PRCpm9clX0WiBEMB70FWwd&index=4)
- [Router](https://reactrouter.com/start/framework/navigating)
- [Full course](https://www.youtube.com/watch?v=TtPXvEcE11E)



### AI usage
- Assistance in creating scripts that run curl requests to create users and retrieve their “access_token” and UUID, so that tests and verifications can then be performed manually
- Assistance in setting up connections between the game engine and the rest of the backend
- Assistance with translating certain commit/PR messages
- Assistance in diagram creation/doc redaction or translation


| Module | Type | Pts|
|---------------------------------------|:------:|:---:|
| Use frontend framework| minor| 1 |
| Use backend framework| minor| 1 |
| Support for additional browsers| minor| 1 |
| Game statistics and match history| minor| 1 |
| Content moderation AI (auto mods, auto deletion) | minor| 1 |
| Public Api| major| 2 |
| Andvanced analytics dashboard with data visualization| major| 2 |
| Monitoring system with Prometheus and Grafana| major| 2 |
| Implemented a complete web-based game where user can play each other| major| 2 |
| Remote Players | major | 2 | 
| Multiplayer Game (more than 2)| major| 2 |
| Introduce an Ai Opponent for games| major| 2 |
| Standard user management and authentication| major| 2 |
| Implement real-time features useing Websocket| major| 2 |
| Allow users to interact with other users (basic, chat, friends)| major| 2 |
|TOTAL| | 25 |


