FROM node:22-bookworm-slim

WORKDIR /skyjo

COPY . .

RUN npm ci

CMD ["npm", "run", "dev"]
