FROM node:22-bookworm-slim

WORKDIR /skyjo

COPY . .

RUN npm ci

RUN npm run build

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
