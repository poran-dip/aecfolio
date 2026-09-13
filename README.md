## Dev

```bash
docker compose -f compose.dev.yml up -d
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

## Prod

```bash
docker compose up --build
```

## Scripts

Script to bootstrap first admin and faculty

```bash
pnpm bootstrap
```
