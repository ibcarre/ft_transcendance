FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y curl \
		&& rm -rf /var/apt/list/*

WORKDIR /app

COPY . .

RUN chmod +x ./scripts/secrets.sh
RUN chmod +x ./scripts/healthcheck.sh

RUN npm ci

ENTRYPOINT ["/bin/sh", "./scripts/secrets.sh", "build"]
