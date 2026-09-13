FROM node:24-alpine
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/

RUN corepack enable && pnpm install --frozen-lockfile --filter @aecfolio/db...

COPY packages/config ./packages/config
COPY packages/db ./packages/db

RUN pnpm --filter @aecfolio/config build

USER node
WORKDIR /app/packages/db

CMD ["node_modules/.bin/drizzle-kit", "migrate", "--config", "drizzle.config.ts"]
