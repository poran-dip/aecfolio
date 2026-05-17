FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/

RUN corepack enable && pnpm install --filter @aecfolio/api

COPY apps/api ./apps/api
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared

RUN pnpm --filter @aecfolio/api build

FROM node:24-alpine
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
RUN corepack enable && pnpm install --filter @aecfolio/api --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist

ENV PORT=3002
EXPOSE 3002
CMD ["node", "apps/api/dist/index.js"]
