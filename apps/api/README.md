# `apps/api`

Hono + Drizzle HTTP API. Every route lives under `/api`.

## Response envelope

Success is `{ "success": true, "data": ... }`; failure is `{ "success": false, "error": { "code", "message", "details"? } }`.

Codes in use: `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `VALIDATION` (400), `CONFLICT` (409), `NO_CREDIT_SCHEME` (409), `INTERNAL` (500).

Nothing escapes the envelope. Validation failures go through `lib/validate.ts` rather than the stock `zValidator`, and `app.onError` catches everything else, so a Postgres constraint violation answers with `INTERNAL` rather than an unhandled throw. Where a violation is expected — a duplicate roll number, a taken email — the handler maps the constraint name to a readable message via `lib/db-error.ts`, which walks Drizzle's `cause` chain to reach the real Postgres error.

Paginated endpoints return `{ items, total, page, pageSize, hasNext }` as their `data`. `?page=` and `?pageSize=` are accepted everywhere; `pageSize` defaults to 25 and is capped at 100.

## Authentication

**There is no sign-up.** An account must exist before anyone can sign in:

1. `pnpm bootstrap --email you@aec.ac.in --name "Your Name"` creates the first ADMIN.
2. That admin creates mods, faculty and students through the API.
3. Everyone signs in with Google, which _claims_ their pre-created row.

The mechanism is `user.validateUserInfo` in `lib/auth.ts`, which rejects any sign-in whose action is `create-user`. Implicit account linking is enabled and Google is trusted, so a Google identity binds to the existing row with the same address.

Better Auth will not link into a local row whose email is unverified, so **every row this codebase creates is written with `emailVerified: true`** — a human administrator entering an institutional address is the verification. Miss that and a bulk-imported student's first sign-in is rejected as unprovisioned.

Domain restriction to `@aec.ac.in` is deliberately not enforced yet, to keep testing possible with ordinary Google accounts.

## Authorization

`requireCapability()` gates handlers; `requireRole()` is gone. The matrix lives in `lib/capabilities.ts` as data, and `src/routes/authorization.test.ts` drives one test per (role, endpoint) pair straight off it.

| Capability                    | STUDENT | FACULTY | MOD | ADMIN |
| ----------------------------- | :-----: | :-----: | :-: | :---: |
| `profile:write:self`          |    ✓    |    —    |  —  |   —   |
| `result:submit:self`          |    ✓    |    —    |  —  |   —   |
| `student:read`                |    —    |    ✓    |  ✓  |   ✓   |
| `student:manage`              |    —    |    —    |  ✓  |   ✓   |
| `academic:rectify`            |    —    |    —    |  ✓  |   ✓   |
| `claim:review`                |    —    |    —    |  ✓  |   ✓   |
| `faculty:manage`              |    —    |    —    |  ✓  |   ✓   |
| `audit:read`                  |    —    |    —    |  ✓  |   ✓   |
| `role:promote:faculty-to-mod` |    —    |    —    |  ✓  |   ✓   |
| `cohort:promote`              |    —    |    —    |  —  |   ✓   |
| `mod:manage`                  |    —    |    —    |  —  |   ✓   |
| `admin:manage`                |    —    |    —    |  —  |   ✓   |
| `role:demote:mod-to-faculty`  |    —    |    —    |  —  |   ✓   |
| `role:set:admin`              |    —    |    —    |  —  |   ✓   |
| `cv:export:self`              |    ✓    |    —    |  —  |   —   |
| `cv:export:standard`          |    —    |    ✓    |  ✓  |   ✓   |
| `proof:read`                  |  ✓ own  |    ✓    |  ✓  |   ✓   |

`cv:export:self` gates a student's own export and `cv:export:standard` the single and bulk standard exports. `proof:read` gates `GET /achievements/:id/proof` and `GET /certifications/:id/proof`; "own" for a student is enforced by the same read scope every other student-owned route uses.

Two rules are finer than a capability check and live in the same file:

- `canChangeRole(actor, from, to)` — a MOD may promote FACULTY → MOD but not demote, and only an ADMIN moves an account into or out of ADMIN. STUDENT is unreachable in either direction.
- `canManageStaffWithRole(actor, targetRole)` — a MOD manages FACULTY records; managing a MOD or ADMIN record is admin-only.

Nobody can change or delete their own account through these routes.

## Read models

`lib/profile.ts` holds one projection, parameterised by view, used by every read. See build-plan decisions #39 and #41.

- **owner** — everything, every status, with `reviewedBy`, `reviewedAt` and `rejectionReason`. The student themselves, plus MOD and ADMIN, because reviewing means seeing what is waiting.
- **staff** — FACULTY. Verified claims only, and no rejection reasons — but `reviewedBy` and `reviewedAt` are kept on what is shown, because provenance is the point of the faculty role.
- **public** — not reachable by any current role. Verified claims, no review metadata. It exists so the staff view is not mistaken for it.

Only `results`, `achievements` and `certifications` are filtered. `projects`, `experiences`, `interests`, `socials` and custom sections have no status and pass through — a CV without projects is not a CV.

Editing a verified claim sends it back to `PENDING`, which removes it from the staff view until it is reviewed again. `rejectionReason` deliberately survives a resubmission so the reviewer still sees the previous decision.

## Grading

`results.scheme_id` is NOT NULL and is **resolved by the server** from the student's own `(branch, admissionYear, semester)` — never accepted from the request, because a client that could name a scheme could attach a result to another cohort's credit weighting.

A cohort with no `semester_credit_schemes` row cannot accept SGPA submissions at all, and only an ADMIN can create one. That makes an absent scheme an admin-shaped blocker on ordinary student work, so both the submit endpoint and the promotion endpoint name the exact missing cohort rather than failing generically.

Verifying a result is the `pendingSgpa → sgpa` promotion — the `result_status_consistency` CHECK requires `sgpa` on VERIFIED, so it is forced. Every write that changes the set of verified results recomputes the student's cached `cgpa` as the credit-weighted average across verified semesters (`lib/grading.ts`).

## Route map

| Group                                                                                                              | Notes                                                                     |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `/auth/*`                                                                                                          | Delegated to Better Auth. Sign-in only.                                   |
| `/me`                                                                                                              | Own user, own student profile (owner view), own staff record (read-only). |
| `/users`                                                                                                           | Staff accounts and role changes, keyed by user id.                        |
| `/students`                                                                                                        | Paginated list, full profile, create, bulk import, rectify, soft delete.  |
| `/faculty`                                                                                                         | Staff record CRUD, keyed by faculty id.                                   |
| `/verifications`                                                                                                   | The review queue, plus single and bulk verify/reject.                     |
| `/admin`                                                                                                           | Credit schemes and cohort promotion.                                      |
| `/achievements` `/certifications` `/results` `/experiences` `/projects` `/socials` `/interests` `/custom-sections` | Student-owned entries.                                                    |
| `/audit-logs`                                                                                                      | Paginated, filterable by actor, entity, action and date range.            |
| `/uploads`                                                                                                         | Presigned upload tickets for proof and avatars.                           |
| `/cv`                                                                                                              | Preferences, own and standard exports, history, bulk export jobs.         |

Student-owned entry routes take `?studentId=` for staff. Staff who name no student get a 400 — they never get every row in the table.

## Files

Proof and avatars live in Garage (`infra/garage/README.md`). The database stores object keys, never URLs, and every byte a browser sends or receives goes directly to the bucket on a URL the API signed.

**Uploading is two steps.** `POST /uploads` with `{ purpose, contentType, size }` returns a ticket: a key under the caller's own prefix (`proofs/<studentId>/` or `avatars/<userId>/`), a PUT URL valid for five minutes, and the headers to send. The signature covers `Content-Type` and `Content-Length`, so the bucket itself rejects a different type or a single byte more. Only a student can ask for a proof ticket; anyone signed in can ask for an avatar one.

**Attaching is where the file is checked.** Sending the key as `proofKey` on an achievement or certification, or as `image` on `PATCH /me`, makes the API confirm that the key sits under the caller's own prefix, that the object exists, that it is within the size cap, and that its first bytes really are the JPEG, PNG, WebP or PDF it was stored as. A signed ticket is not trusted to mean a well-formed upload happened. Re-sending the key already on the row skips the check.

**Reading is a redirect.** `GET /achievements/:id/proof` and `GET /certifications/:id/proof` run the same read scope and projection as the entity itself — faculty get the proof behind a verified claim and a 404 for anything else — then 302 to a GET URL signed for five minutes, with `Cache-Control: no-store`. `GET /users/:id/avatar` does the same for yourself, or for anyone if you hold `student:read`.

The route is the durable address, not the signed URL. A PDF that links a checkmark to `<origin>/api/certifications/<id>/proof` keeps working after the signature it would have carried expires, keeps following the claim if the student replaces the file, and stops working the moment the claim is no longer visible to whoever clicks it.

**`users.image` holds an object key.** Better Auth only writes `image` when it creates a user, which never happens here, or when `overrideUserInfoOnSignIn` / `updateUserInfoOnLink` are on, which they are not. `lib/auth.test.ts` pins both off, because turning either on would overwrite an uploaded avatar's key with a Google URL on the next sign-in.

Replaced or orphaned uploads are not deleted yet.

A user's first Google sign-in copies their Google profile picture into the bucket, if they have no avatar yet. Better Auth's `account.create.after` hook fires once, when Google is first linked to the pre-created row, and never on later sign-ins. The picture URL comes from the stored ID token's `picture` claim and is fetched only if it is `https` on `googleusercontent.com`, with redirects refused, a five-second timeout, the avatar size cap and the same magic-byte check an upload gets. It runs after the sign-in rather than inside it, and any failure just leaves the user without a photo.

## CV export

**Nothing about a CV's content comes from the request**. A request names a template and, for a student's own export, a section config and options. The API loads the student from the database and shapes the data itself.

| Route                              | Who                                                      | What                                                                                                                                                                                             |
| ---------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /cv/preferences`              | student                                                  | Saved `(template, sections, options)` per template                                                                                                                                               |
| `PUT /cv/preferences`              | student                                                  | Upsert one. Unknown templates are refused, sections the template cannot draw or custom sections that are not the student's are dropped, options are normalised through the template's own schema |
| `POST /cv/exports/self`            | student                                                  | Own export, any template. `sections` / `options` in the body, else saved preferences, else the template's defaults                                                                               |
| `POST /cv/exports/standard`        | faculty, mod, admin                                      | One student, always the standard template with the student's saved standard preferences. Anything else in the body is ignored                                                                    |
| `GET /cv/exports`                  | student (own), staff with `student:read` (`?studentId=`) | History, newest first                                                                                                                                                                            |
| `GET /cv/exports/:id/download`     | same scope                                               | 302 to a signed GET with `attachment; filename="23162-Poran-Boruah.pdf"`                                                                                                                         |
| `POST /cv/jobs`                    | faculty, mod, admin                                      | Bulk standard export of up to 1,000 students. 202 with a queued job                                                                                                                              |
| `GET /cv/jobs`, `GET /cv/jobs/:id` | whoever started the job                                  | Progress: `status`, `total`, `completed`, `failed`                                                                                                                                               |
| `GET /cv/jobs/:id/download`        | whoever started the job                                  | A streamed zip, one PDF per student, plus `MISSING.txt` naming any that failed                                                                                                                   |

Exports return `{ export, cached }` — 201 when a PDF was rendered, 200 when an unchanged one was reused. If the worker cannot be reached the answer is 502 `WORKER_UNAVAILABLE`, never a half-made file.

### Two shapes, built in `lib/cv/data.ts`

- **`SELF`** (decision #42) — verified and pending claims render, only verified ones carry a mark, rejected ones are absent.
- **`STANDARD`** (#13, #39) — verified claims only, every one marked. Used for faculty, mods and admins alike: a mod reads the owner view on screen, but an institutional CV is the standard document regardless of who clicks export.

In both, a mark links to `<BETTER_AUTH_URL>/api/{achievements|certifications}/:id/proof` when the claim has proof and is bare when it does not; results and the CGPA are always bare. `reviewedBy`, `reviewedAt`, `rejectionReason` and `pendingSgpa` are nulled before the data leaves the API, so no reviewer and no rejection can reach a document even if a template tried to print one. The photo is read from the bucket and inlined as a `data:` URL, and only when the template's `printsPhoto(options)` says it will be shown.

### The short-circuit

Every export is checksummed over the shape, the template, the resolved sections and options, the shaped data, the avatar key and the worker's render version (`GET /version`, cached 30 s). If the student already has an export with that checksum it is returned without calling the worker. The checksum is over what is rendered rather than when rows were updated, so a reorder, an option, an edit, a different shape and a template deploy each produce a new PDF, and nothing else does. PDFs are stored at `exports/<studentId>/<cuid>.pdf`. The newest 100 per student are kept across both shapes; older rows and their objects are deleted after each new export.

**History is one list** shared by the student and staff. A staff member can therefore download a student's own export, which includes that student's pending claims unmarked. That was chosen on purpose; tightening it to standard exports for staff is a `where` clause in `GET /cv/exports` and the download route.

### Bulk jobs

`POST /cv/jobs` writes a job and one item per student in a transaction and wakes the runner. The runner lives in the API process (`startJobRunner()` in `index.ts`, not in `createApp`, so tests drive it with `runQueuedJobs()`), claims one queued job at a time with `FOR UPDATE SKIP LOCKED`, and works through it as a pipeline:

- students are loaded 50 at a time, the next batch loading while the current one renders,
- twice as many exports run at once as the worker has tabs, read from the worker's `GET /version`, so no tab waits on the database and changing `WORKER_PAGES` alone retunes both sides,
- each item runs the same `exportCv` as a single standard export, so unchanged students skip the worker entirely,
- a 503 from a busy worker is retried with backoff; any other failure marks that one item failed and the job carries on.

A job that produced nothing is `FAILED`; one with some failures is `SUCCEEDED` with `failed` counting them. On startup, jobs left `RUNNING` by a restart go back to `QUEUED` and resume from their unfinished items. Jobs older than seven days are deleted. **This assumes one API process** — a second replica would reset the first one's running job to queued on boot.

The zip is built on download, not stored: the route streams it straight from the students' stored PDFs, uncompressed (PDFs are already compressed), pulling the next object only when the client has taken the last one.

### Benchmarking the pipeline

`pnpm bench:cold --students <n>` seeds `<n>` fresh students with a realistic mix of achievements, certifications, results, experiences, projects, interests and socials, queues them as a real bulk job through `POST /api/cv/jobs` (chunked at `CV_EXPORT_JOB_MAX_STUDENTS` per job), and times until every job finishes — real API, real worker, real Postgres, real Garage, no mocks. `pnpm bench:warm --students <n>` resubmits the same students from the state file `bench-cold.ts` wrote, to measure the checksum short-circuit instead of a fresh render, and reports how many exports were actually reused. `pnpm bench:cleanup` removes everything either script creates. All three live in `scripts/` and, unlike the 480-student figure below, are kept as commands rather than a one-off manual run.

Recorded so far, at `WORKER_PAGES=16` on a 16-core Windows machine: **500 students, 17.9 s cold, 36 ms/pdf**. Two things worth knowing before trusting that number on the college's server:

- Going from `WORKER_PAGES=2` to `16` only cut per-PDF time by about a third, nowhere near the ~8x tab count would suggest. The likely reason: `packages/db/src/client.ts` creates the Postgres pool with no `max`, so node-postgres defaults to 10 connections, while `workerRenderConcurrency()` (`pages * 2`) asks for 32 concurrent exports at `WORKER_PAGES=16` — past `WORKER_PAGES=5` the DB pool is probably the real ceiling, not Chromium. Not yet fixed; raising that `max` is the first thing to try if more tabs still underperform on real hardware.
- - Headless Chromium's PDF printing measured meaningfully slower on Windows than in the 2-core Linux sandbox used for the earlier runs, even at matched tab counts, independent of core count or power settings. Worth re-measuring on whatever OS the college server actually runs before trusting a Windows dev machine's numbers.

## Tests

`pnpm -F @aecfolio/api test` runs against **real Postgres**. There is no mocked database and no in-memory substitute: the status CHECKs, the unique constraints and the audit-log immutability trigger are exactly what several of these tests assert.

The suite derives its database from `DATABASE_URL` by appending `_test` to the name (`aecfolio` → `aecfolio_test`), creates it on first run and applies the migrations. So with `compose.dev.yml` up, `pnpm test` works with no extra configuration and never touches dev data.

The CV tests start a fake worker on `WORKER_URL` (`src/test/fake-worker.ts`) that checks the shared secret, records every render payload and returns a stub PDF. That is a network stand-in, not a second seam into the code: everything in the API runs for real, and the assertions are on exactly what would have reached Chromium. Real PDFs are the worker's own suite.

The storage tests run against **real Garage** the same way. The suite uses `<S3_BUCKET>-test` (or `TEST_S3_BUCKET`) and creates it on first run, so it needs the `S3_*` values from `.env` and the dev Garage up. Test objects are not cleaned between tests; every key carries a fresh cuid, so nothing collides. Set `TEST_DATABASE_URL` to point somewhere else; the suite refuses any database whose name does not end in `_test`, because it truncates every table between tests.

Only the session lookup is substituted. `createApp({ sessionResolver })` lets a test act as a caller of a known role while the whole middleware, capability, handler and database stack runs for real — the alternative being an OAuth round trip in every authorization test.

## Build note

`packages/shared` is a built package. `apps/api` bundles it into `dist`, and the declaration bundler cannot compile a dependency's TypeScript source from inside this package's `tsconfig`, so shared has to ship its own `.d.mts`. If shared ever goes back to being source-only, `pnpm -F @aecfolio/api build` fails with `tsgo did not generate dts file`.
