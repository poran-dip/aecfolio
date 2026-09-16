# AECFolio Config Package — @aecfolio/config

Every environment variable the monorepo reads passes through this package. It exists so that a missing or malformed variable fails at startup, with a message naming the variable, instead of surfacing as a confusing runtime error somewhere downstream.

Two properties define it: configuration is **scoped** per process, and validation is **lazy**.

---

## Scopes

Each export covers exactly one process's needs.

| Export      | Variables                                                                                                 | Read by                                              |
| ----------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `dbEnv`     | `DATABASE_URL`                                                                                            | `packages/db`, `drizzle-kit`, `scripts/bootstrap.ts` |
| `authEnv`   | `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                       | `apps/api`                                           |
| `apiEnv`    | `NODE_ENV`, `API_PORT`, `CORS_ORIGIN`, `WORKER_URL`, `WORKER_SECRET`                                      | `apps/api`                                           |
| `s3Env`     | `S3_ENDPOINT`, `S3_PUBLIC_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | `apps/api`                                           |
| `workerEnv` | `NODE_ENV`, `WORKER_PORT`, `WORKER_SECRET`, `WORKER_PAGES`, `PUPPETEER_EXECUTABLE_PATH`                   | `apps/worker`                                        |
| `webEnv`    | `NODE_ENV`, `PUBLIC_API_URL`, `INTERNAL_API_URL`                                                          | `apps/web`, server-side only                         |

Scoping is not organisational tidiness — it is what makes the package usable at all. A single flat object would mean `drizzle.config.ts`, which needs only `DATABASE_URL`, failing because an unrelated auth or worker variable is absent from the environment. Running a migration must not require the Google OAuth credentials.

## Laziness

Nothing is read or validated until a property is accessed. Importing the module can never throw.

On the first property access of a scope, that scope's entire schema validates at once and the result is cached. A failure reports **every** problem in the scope, not just the first:

```
Invalid environment for "auth":
  BETTER_AUTH_URL: required — origin of the API, as an absolute http(s) URL
  BETTER_AUTH_SECRET: must be at least 32 chars — generate with `openssl rand -base64 32`
  GOOGLE_CLIENT_ID: required — Google OAuth client ID
  GOOGLE_CLIENT_SECRET: required — Google OAuth client secret

See .env.example at the repo root.
```

Each scope is a `Proxy` over a Zod schema; the proxy's `get` trap triggers the parse.

---

## Origins are validated as origins

`BETTER_AUTH_URL`, `CORS_ORIGIN`, `WORKER_URL`, `PUBLIC_API_URL`, `INTERNAL_API_URL`, `S3_ENDPOINT` and `S3_PUBLIC_ENDPOINT` all go through the same `origin()` helper, which enforces three things:

**It must be an absolute `http(s)` URL.** `new URL()` alone is far too permissive here — it parses `localhost:3000` as a valid URL whose protocol is `localhost:`. That kind of value produces requests that silently go nowhere, so the protocol is checked explicitly.

**It must have no path.** A trailing `/api` is rejected outright. Every call site appends its own `/api/...`, so an origin ending in `/api` produces `/api/api/...`. Rejecting the value makes that class of bug unexpressible rather than fixed once.

**Trailing slashes are stripped**, so string concatenation at call sites stays clean.

## Two pairs that are easy to swap

These are the variables most likely to be set wrong on a first deployment, because in each pair both values are plausible-looking origins:

- **`BETTER_AUTH_URL` is the API's origin. `CORS_ORIGIN` is the web app's origin.** Behind a single reverse proxy they happen to be the same value, which hides the mistake until the two are split across hosts.
- **`PUBLIC_API_URL` is how the browser reaches the API. `INTERNAL_API_URL` is how the SSR server reaches it.** In containers the second is an internal service name and the first is the public origin.
- **`S3_PUBLIC_ENDPOINT` is how the browser reaches the object store. `S3_ENDPOINT` is how the API reaches it.** The API signs upload and download URLs against the public one, and a signature is bound to the host it was signed for, so a URL signed for `http://garage:3900` is useless to a browser. In development both are `http://localhost:3900`; in production the public one is `PUBLIC_ORIGIN`, which nginx routes to Garage.

---

## Adding a variable

1. Add the key to the right scope's schema in `src/index.ts`. If it belongs to more than one process, it belongs in more than one scope — duplication here is correct, since each scope describes one process's requirements.
2. Add it to `.env.example` at the repo root, under the matching section, with a working development value.
3. Add it to `docker-compose.yml` for whichever services need it. Containers never read a `.env` file; compose passes real environment variables.
4. Give it a message that says what to put there, not just that it is missing.

Required strings use the `required()` helper rather than bare `z.string()`. Without it, an absent variable reports Zod's default `expected string, received undefined`, which tells the reader nothing actionable.

## Testing

`pnpm -F @aecfolio/config test`

The suite covers scope isolation, laziness, defaults and coercion, aggregate error reporting, and the origin rules — including a regression test for the trailing-`/api` case.

Tests stub `process.env` with `vi.stubEnv` and reset module state between cases, because each scope caches after its first read.

## Notes

- `NODE_ENV` defaults to `development` and only accepts `development`, `production` or `test`.
- Ports are coerced from strings and range-checked, with defaults matching the ports used across the repo.
- `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` are validated in the shape Garage accepts — `GK` plus 24 hex characters, and 64 hex characters. Garage would refuse anything else at startup, in its own logs, where a wrong value is much harder to spot.
- `WORKER_SECRET` is in both `apiEnv` and `workerEnv` and must be the same value in both processes. It is required, at least 32 characters, with no default: a worker that starts without one would render for anyone who can reach it.
- `WORKER_PAGES` is how many Chromium tabs the worker keeps open, and so how many PDFs it prints at once. Rendering is CPU-bound, so more tabs than cores buys nothing, and the right number wants measuring on the real server. It is the only knob: the API reads the worker's tab count from `GET /version` and sizes bulk exports from it, so the two cannot drift apart.
- `PUPPETEER_EXECUTABLE_PATH` is optional. Set it only where a system Chromium exists; leaving it unset uses the Chromium that puppeteer downloads.
- `webEnv` carries no port. In development the port is pinned in `apps/web/vite.config.ts`; in production `react-router-serve` owns it through `PORT`.
- `apps/web` must only touch `webEnv` from `app/lib/env.server.ts`. The `.server.ts` suffix keeps this package — which reads `process.env` — out of the browser bundle.
