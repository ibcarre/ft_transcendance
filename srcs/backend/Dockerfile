FROM node:22-bookworm-slim

WORKDIR /app

COPY . .

RUN chmod +x ./scripts/secrets.sh

RUN npm ci

ENTRYPOINT ["/bin/sh", "./scripts/secrets.sh", "build"]
