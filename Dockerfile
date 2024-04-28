FROM node:18-alpine
RUN npm install pnpm@^8.15.7 -g
RUN pnpm config set store-dir /path/to/.pnpm-store
WORKDIR /code
EXPOSE 8080