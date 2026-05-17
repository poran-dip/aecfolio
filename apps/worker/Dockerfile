FROM node:24-alpine AS builder
WORKDIR /app

RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/ui/package.json ./packages/ui/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/

RUN corepack enable && pnpm install --filter @aecfolio/worker...

COPY apps/worker ./apps/worker
COPY packages/ui ./packages/ui
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db

RUN pnpm --filter @aecfolio/worker build

FROM node:24-alpine
WORKDIR /app

RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/worker/package.json ./apps/worker/
RUN corepack enable && pnpm install --filter @aecfolio/worker --prod

COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/public ./apps/worker/public

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PORT=3001
EXPOSE 3001
CMD ["node", "apps/worker/dist/index.js"]
