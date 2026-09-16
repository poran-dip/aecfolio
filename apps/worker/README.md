# `apps/worker`

Turns a CV into a PDF. One job, done by a long-lived headless Chromium, called only by the API.

The worker never touches the database or the bucket. The API sends it everything a render needs — the template id, the student's data already shaped for the export, the section config, the options, and the photo already inlined as a `data:` URL — and gets PDF bytes back. What to cache, where to store it and who may download it are all the API's business.

---

## Routes

| Route          | Auth   | What                                                                 |
| -------------- | ------ | -------------------------------------------------------------------- |
| `GET /`        | open   | Liveness text, for the container healthcheck                         |
| `GET /health`  | open   | Starts Chromium and a tab if they are not running yet                |
| `GET /version` | secret | The render version and the pool's counts, including its size in tabs |
| `POST /render` | secret | `{ templateId, data, sections?, options? }` → `application/pdf`      |

`POST /render` answers 400 for an unknown template or a body that is not a render request, 413 above 8 MiB, 422 if the template throws on the data, **503 with `Retry-After` when the queue is full**, and 500 if Chromium fails.

There is no bulk route. Bulk export is a job in the API that calls `/render` once per student, so each PDF can be checksummed, stored and reused on its own.

## Authentication

Every route except `/` and `/health` requires `Authorization: Bearer <WORKER_SECRET>`, compared in constant time. The API is the only thing that holds the secret. The worker also publishes no port and nginx has no route to it (`infra/nginx/README.md`), so both the network and the secret have to be got past, not just one.

`/health` stays open, and it still starts the browser: warming Chromium on the health check is what keeps the first real export from paying the cold start. Do not make it lazy.

## One browser, a few tabs, contents swapped

The slow part of a PDF is not Chromium starting, which happens once. It is how each page gets loaded. The worker keeps `WORKER_PAGES` tabs (default 2) open for as long as it runs. Each tab loads a shell document once, holding the fonts and the compiled CV stylesheet. A render then:

1. takes a free tab from the pool, or waits in a queue of at most 64 (`RENDER_QUEUE_MAX`), past which the request gets a 503 instead of piling up,
2. replaces the shell's `<body>` with the template's markup,
3. waits for images to decode and fonts to be ready,
4. prints, honouring the template's own `@page` size and margins,
5. hands the tab back.

A tab that errors is closed rather than returned, every tab is replaced after 250 renders so memory cannot creep, and if Chromium dies the pool starts a new one on the next render.

Measured on a 2-core sandbox with the standard template's fixture: the old path (new tab per PDF, the page loaded as a `data:` URL, `networkidle0`, one at a time) took **1,156 ms** per PDF; swapping the body in a reused tab takes about **40–50 ms** with two tabs, and 480 full CVs through the API's job, database and bucket included, took 14 s cold and 1 s warm. More tabs than cores does not help — printing is CPU-bound — so `WORKER_PAGES` wants measuring on the real server. The `speed` test prints its own number on every run.

## Chromium makes no network requests

Every request a tab makes is intercepted, and anything that is not a `data:` URL is aborted. An `<img src="http://api:3002/...">` in a template, a stylesheet `url()`, a link prefetch — none of them leave the container. This is C03's fix: there is no fetch path to harden, because there is no fetch. The photo arrives already inlined by the API, and a test runs a local HTTP server and asserts it receives nothing while a CV pointing at it renders.

## Fonts

The shell document embeds the four Outfit faces from `public/fonts/outfit` as base64 `@font-face` rules. A `data:` or shell document cannot resolve a relative URL, which is why the old `/fonts/*` static route never worked (U05). Because the shell loads once per tab, the ~300 KB of font data is parsed once per tab rather than once per PDF. A test asserts Outfit is embedded in the output.

## The render version

`X-Render-Version` on every PDF, and `GET /version`, identify what is doing the rendering. In production it is a hash of the running bundle, the stylesheet and the fonts, so a deploy that changes a template changes it. Outside production it is random per process, so restarting `pnpm dev` after a template change never serves a stale cached PDF. The API puts it in every export's checksum.

## Tests

`pnpm -F @aecfolio/worker test` renders real PDFs in real Chromium and reads them back with `pdfjs-dist`: authentication, the three rejection statuses, fonts, proof links pointing at the durable `/api/.../proof` route and never at a signed URL, no network from Chromium, **a three-page CV whose ink starts at the same offset on every page** (the multi-page margin bug), tab reuse, no content leaking between renders, the 503 on a full queue, and a timing run.

Chromium comes from puppeteer's own download. Where that binary cannot run, point `PUPPETEER_EXECUTABLE_PATH` at a system Chromium.
