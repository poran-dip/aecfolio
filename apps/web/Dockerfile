FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN corepack enable && pnpm install --filter @aecfolio/web

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

RUN pnpm --filter @aecfolio/web build

FROM node:24-alpine
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
RUN corepack enable && pnpm install --filter @aecfolio/web --prod

COPY --from=builder /app/apps/web/dist ./apps/web/dist

ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "cd /app/apps/web && node_modules/.bin/react-router-serve dist/server/index.js"]
