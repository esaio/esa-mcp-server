# syntax=docker/dockerfile:1

FROM node:alpine AS base

WORKDIR /app

FROM base AS deps

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --only=production

FROM base AS build

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

RUN npm run build

FROM base AS production

ENV NODE_ENV=production

USER node

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/bin ./bin

ENTRYPOINT ["node", "bin/index.js"]
