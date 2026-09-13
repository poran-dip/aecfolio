FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/

RUN corepack enable && pnpm install --frozen-lockfile --filter @aecfolio/api...

COPY apps/api ./apps/api
COPY packages/config ./packages/config
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared

RUN pnpm --filter @aecfolio/config build \
  && pnpm --filter @aecfolio/db build \
  && pnpm --filter @aecfolio/api build

FROM node:24-alpine
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/

RUN corepack enable && pnpm install --frozen-lockfile --filter @aecfolio/api... --prod

COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

ENV API_PORT=3002
EXPOSE 3002

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3002/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/dist/index.mjs"]
