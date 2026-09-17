FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json apps/worker/tsconfig.json ./apps/worker/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json packages/db/tsconfig.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/

RUN corepack enable && pnpm install --frozen-lockfile --filter @aecfolio/web...

COPY apps/web ./apps/web
COPY packages/config ./packages/config
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui

RUN pnpm --filter @aecfolio/config build \
  && pnpm --filter @aecfolio/shared build \
  && pnpm --filter @aecfolio/ui build \
  && pnpm --filter @aecfolio/web build

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

RUN corepack enable && pnpm install --frozen-lockfile --filter @aecfolio/web... --prod

COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/packages/shared/src ./packages/shared/src
COPY --from=builder /app/packages/ui/src ./packages/ui/src
COPY --from=builder /app/apps/web/dist ./apps/web/dist

ENV PORT=3000
EXPOSE 3000

USER node
WORKDIR /app/apps/web

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node_modules/.bin/react-router-serve", "dist/server/index.js"]
