FROM node:24-alpine AS builder
WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/

RUN corepack enable && pnpm install --frozen-lockfile --filter @aecfolio/worker...

COPY apps/worker ./apps/worker
COPY packages/config ./packages/config
COPY packages/ui ./packages/ui
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db

RUN pnpm --filter @aecfolio/config build \
  && pnpm --filter @aecfolio/db build \
  && pnpm --filter @aecfolio/worker build

FROM node:24-alpine
WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont \
  && ln -sf "$(command -v chromium || command -v chromium-browser)" /usr/local/bin/chromium-resolved

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/

RUN corepack enable && pnpm install --frozen-lockfile --filter @aecfolio/worker... --prod

COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/public ./apps/worker/public

ENV PUPPETEER_EXECUTABLE_PATH=/usr/local/bin/chromium-resolved
ENV WORKER_PORT=3001
EXPOSE 3001

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/worker/dist/index.mjs"]
