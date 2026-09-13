# AECFolio

Verified academic profiles, one-click CVs, and placement tooling for Assam Engineering College.

---

## Running it

Two modes, kept separate on purpose.

### Development

```bash
docker compose -f compose.dev.yml up -d    # Postgres only
cp .env.example .env                       # then fill in the three blanks
pnpm install
pnpm db:migrate
pnpm dev
```

web `:3000` · api `:3002` · worker `:3001` · postgres `:15432`

The dev stack contains nothing but a database. Web, api and worker run on the host under `pnpm dev`, so a save reloads in milliseconds instead of rebuilding an image.

The three blanks in `.env` are `BETTER_AUTH_SECRET` (`openssl rand -base64 32`) and the two `GOOGLE_*` values. Everything else already holds a working local value. Google OAuth needs `http://localhost:3002/api/auth/callback/google` as an authorised redirect URI.

### Production

```bash
docker compose up -d --build
```

Builds and runs all five services behind nginx on port 80. To point it at a real domain, change `PUBLIC_ORIGIN` in `.env` — that one value becomes the API origin, the web origin and the browser's API origin, because nginx fronts both apps. The prod Google redirect URI is `<PUBLIC_ORIGIN>/api/auth/callback/google`, with no port.

`DATABASE_URL` is ignored in production; compose builds its own connection string from the `POSTGRES_*` values.

### Which `.env` values go where

`POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` initialise the Postgres container in both stacks, and in production also build the API's connection string. `DATABASE_URL` is read only by processes on your host — `pnpm dev`, `db:migrate`, `db:studio`, `bootstrap`. Its credentials must match the `POSTGRES_*` values, since both address the same database by different routes: `localhost:15432` from outside, `postgres:5432` from within.

---

## Configuration

All environment variables are read through `packages/config`, which validates them per-process with Zod and fails loudly at startup. See [`packages/config/README.md`](packages/config/README.md) for the scopes, the rules origin variables must satisfy, and how to add a variable.

The browser gets the API origin at **runtime**, not build time: `apps/web/app/lib/env.server.ts` reads it server-side, the root loader returns an allowlisted `{ API_URL }`, and the root route serialises it into the document before hydration. There is deliberately no `VITE_API_URL` — Vite inlines `VITE_`-prefixed variables when the bundle is built, which pins an image to the environment it was built for.

---

## Scripts

| Command                      | What it does                                            |
| ---------------------------- | ------------------------------------------------------- |
| `pnpm dev`                   | All apps in watch mode                                  |
| `pnpm build`                 | Turbo build: config → db → shared/ui → worker, api, web |
| `pnpm start`                 | Run built apps                                          |
| `pnpm lint` / `pnpm lint:ci` | Biome, with and without `--write`                       |
| `pnpm typecheck`             | `tsc` across every package                              |
| `pnpm test`                  | Vitest across every package                             |
| `pnpm db:generate`           | Generate a migration from schema changes                |
| `pnpm db:migrate`            | Apply migrations                                        |
| `pnpm db:push`               | Push schema without a migration (dev only)              |
| `pnpm db:studio`             | Drizzle Studio                                          |
| `pnpm bootstrap`             | Promote the first admin/faculty                         |

`dev`, `typecheck` and `test` all declare `^build` in `turbo.json`, so any of them works on a fresh clone without a separate build step first.

Every dev script runs through `dotenv-run`, which walks up to the repo-root `.env` from any workspace directory. There is one `.env`, at the root. A stray `.env` inside an app or package directory will take precedence over it and cause failures that look like credential problems — if one process can reach the database and another cannot, look for those first.

---

## Layout

```bash
aecfolio/
├── apps/
│   ├── api/          Hono API — auth, CRUD, verification, CV orchestration
│   ├── web/          React Router 7 SSR app (marketing + student + faculty)
│   └── worker/       PDF render service (Puppeteer); internal only
├── packages/
│   ├── config/       Scoped, lazily-validated environment configuration
│   ├── db/           Drizzle schema, migrations, client
│   ├── shared/       Zod schemas, enums, API envelope types, utils
│   └── ui/           CV templates + icons (consumed by web preview and worker)
├── infra/nginx/      Reverse proxy config
├── scripts/          bootstrap.ts — promote the first admin/faculty
├── compose.dev.yml   Postgres only, for the `pnpm dev` loop
└── compose.yml       Full production stack
```

`packages/shared` and `packages/ui` are consumed as source (`exports: "./src/index.ts"`). `packages/config` and `packages/db` are built with tsdown, because drizzle-kit and the api bundle resolve them through their `exports`.

---

## Containers

Four images: `api`, `web`, `worker`, and a one-shot `migrator` that runs to completion before the API starts. Each runs as a non-root `node` user with a `HEALTHCHECK`, and `depends_on` waits on `service_healthy` rather than merely "started".

A few constraints are easy to break by accident:

**Every image copies all seven workspace `package.json` files.** pnpm resolves the lockfile against the whole workspace, so omitting one fails the install even for a package nothing imports.

**The web image also needs `tsconfig.json` for the three packages whose source it does not copy** (`apps/api`, `apps/worker`, `packages/db`). Vite's `tsconfigPaths` resolver walks every workspace package and fails on any directory that has a `package.json` but no `tsconfig.json`. Omitting the directory entirely does not help — the lockfile still lists it as an importer.

**No image runs `pnpm` at runtime.** Each `CMD` invokes a binary directly. pnpm re-inspects the modules directory on startup, decides it needs rewriting, and fails as the non-root user. Nothing needs installing at that point anyway.

**The worker image skips puppeteer's Chromium download** and installs the system one via `apk`. Puppeteer's bundled binary is a glibc build and cannot execute on Alpine's musl. The binary has shipped under both `chromium` and `chromium-browser` across Alpine releases, so it is resolved to a stable path at build time rather than hardcoded.

**Postgres is published on 15432 in development**, not 5432 or 6432. 5432 collides with a local install and 6432 is PgBouncer's default; a collision on either produces authentication errors that look like wrong credentials rather than like a wrong target.
