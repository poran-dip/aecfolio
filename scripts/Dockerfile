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

RUN corepack enable && pnpm install --frozen-lockfile --filter . --filter @aecfolio/db... --filter @aecfolio/shared...

COPY scripts ./scripts
COPY packages/config ./packages/config
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared

RUN pnpm --filter @aecfolio/config build \
  && pnpm --filter @aecfolio/db build \
  && pnpm --filter @aecfolio/shared build

USER node

ENTRYPOINT ["node_modules/.bin/tsx", "scripts/bootstrap.ts"]
