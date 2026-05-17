FROM node:24-alpine

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY packages/db/package.json ./packages/db/
RUN corepack enable && pnpm install --filter @aecfolio/db

COPY packages/db ./packages/db

CMD ["pnpm", "--filter", "@aecfolio/db", "migrate"]
