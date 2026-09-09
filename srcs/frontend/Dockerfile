FROM node:22-bookworm-slim

WORKDIR /skyjo

COPY ./package.json .
COPY ./package-lock.json .

RUN npm ci

COPY . .

RUN npm run build

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
