FROM node:22-bookworm-slim

WORKDIR /skyjo

COPY ./package.json .
COPY ./package-lock.json .

RUN npm ci

COPY tsconfig.json server_test.ts .
CMD ["npx", "tsx", "server_test.ts"]
