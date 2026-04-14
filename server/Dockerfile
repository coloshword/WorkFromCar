# Build from repo root: docker build -f server/Dockerfile .
FROM node:20-alpine AS builder
WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
# tsconfig paths map Types/* -> ../types/* (repo root types/)
COPY types /types
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/build ./build
COPY server/migrations ./migrations
CMD ["node", "build/api/server.js"]
