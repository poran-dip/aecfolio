# @aecfolio/shared

The contract layer between `apps/api` and `apps/web`: Zod schemas, enums, API envelope types, and the small utilities both sides need. Consumed as **source** (`exports: "./src/index.ts"`), so there is no build step and no `dist/` — a change here is visible to both apps immediately.

This README is where design decisions for this package live; the source files carry only short comments where the code alone would mislead.

## Layout

```bash
src/
├── enums.ts                  Role, Course, Branch, StudentStatus, VerificationStatus
├── constants/
│   ├── limits.ts             Numeric bounds mirroring the DB CHECKs
│   └── suggestions.ts        Free-text suggestion lists — NOT validation targets
├── schemas/
│   ├── common.ts             Shared field groups + the review-decision schema
│   └── <entity>.ts           One file per table, mirroring packages/db
├── types/api.ts              ApiSuccess / ApiError / PaginatedData
└── utils/date.ts             Free-text date parsing, ordering, formatting
```

## This package mirrors `packages/db`. It is not the source of truth.

`packages/db` owns the schema. Everything here is a hand-maintained reflection of it, which means it can drift — and it did: after the schema rewrite this package still described `verified: boolean`, `proofImage`, `techStack` and a `PENDING` role, and `main` could not typecheck.

`src/enums.test.ts` now asserts parity against the actual pgEnums, so an enum that drifts fails `pnpm test` rather than surfacing three phases later as a type error in a handler. There is no equivalent automatic check for table columns; when you change a table, change the matching `schemas/<entity>.ts` in the same commit.

## Three kinds of schema, per entity

- **`<entity>Schema`** — the row as it is read back. Mirrors every column, including the ones nobody writes directly (`status`, `reviewedBy`, `cgpa`).
- **`create<Entity>Schema`** — what a client may send to create one. Deliberately narrower than the row: see "What is left out on purpose".
- **`update<Entity>Schema`** — usually `.partial()` of create.

## What is left out on purpose

Zod strips unknown keys, so a field that is _absent_ from a create schema is a field a client cannot set — which is the enforcement mechanism for several of the schema's own invariants:

- **`results.schemeId`** — the credit scheme belongs to the student's `(branch, admissionYear, semester)` cohort. The server resolves it. A client that could name it could attach a result to another cohort's credit weighting and skew its own CGPA.
- **`results.sgpa`** — written only by the verify handler, promoting `pendingSgpa`. The `result_status_consistency` CHECK requires it on `VERIFIED`, which is what makes verification and promotion the same operation.
- **`students.cgpa`** — cached and derived, recomputed on every verification. Not importable, not editable.
- **`students.status` / `semester` / `rollNo` / `course` / `branch`** — academic record. Absent from `updateStudentProfileSchema` (what a student may change about themselves), present in `updateStudentSchema` (what faculty may change).
- **`status` / `reviewedBy` / `reviewedAt` / `rejectionReason`** — set by the review handlers via `reviewDecisionSchema`, never by the submitter.

## Free text with suggestions, not enums

`experiences.type` and `socials.title` are free-text columns (packages/db README, "Enums"). `constants/suggestions.ts` holds the values the UI offers and the platform list that maps a social title to an icon. **Nothing in `schemas/` narrows a field to those values**, and nothing should: a student in a non-tech branch has experience types nobody predicted, and a new coding platform should not need a migration.

`matchSocialPlatform()` returning `null` is a normal outcome, not an error — it means "render the generic link icon".

## Dates

Every date-shaped field on an entry is `text`. The Zod side is a shape check only (`freeTextDate`: non-empty, at most 64 characters) so "Present", "Summer 2024" and "Jun 2023 – Aug 2023" all pass.

`utils/date.ts` does best-effort parsing on top of that:

- `parseLooseDate` returns `null` rather than throwing for anything it cannot resolve, "Present" included.
- `isDateRangeOrdered` returns **true** — no objection — unless _both_ sides parse and are genuinely inverted. Guessing at freehand text would reject legitimate CV entries, and there is no DB-level ordering CHECK to be consistent with any more.
- `formatDate` is for free-text columns and leaves the student's own wording alone; `formatTimestamp` is for real `Date` columns (`createdAt`, `reviewedAt`).

## Composing entry dates

`utils/cv-date.ts`. The columns are `text`; the **input is a month/year picker**, and these two functions are the bridge:

```
pickers → composeDate → "Jan 2025 – Dec 2025" → decomposeDate → pickers
```

| form state              | stored                                        |
| ----------------------- | --------------------------------------------- |
| custom text             | that text, trimmed — the pickers are ignored  |
| start only              | `Jan 2025`                                    |
| start + Present         | `Jan 2025 – Present`                          |
| start + end, same month | `Jan 2025` — collapsed, not a range to itself |
| start + end             | `Jan 2025 – Dec 2025`                         |
| nothing                 | `null`                                        |

`composeDate` is the **only** thing that should write one of these strings. Four entities have a date field and each gets its own form; if every form does its own joining, the same span is written differently depending on which screen a student used, and a CV shows `Jan 2025 - Dec 2025` above `Feb 2025 — Mar 2025`. The separator is a spaced en dash, settled once.

`decomposeDate` is what makes editing work — without it, reopening a saved entry could only drop the student into the free-text box. It reads separators it would never write (hyphen, em dash, `to`) because it also has to open values that predate it. Anything it cannot read comes back as `custom` with the text intact, which is the honest answer rather than an error: a hand-typed or imported value is a real entry and has to stay editable. A half-readable range — a good start and an unreadable end — goes to `custom` whole rather than silently losing the end.

`isYearMonthOrdered` is the typed counterpart to `isDateRangeOrdered`, for the picker values **before** composition. An end before its start is the one mistake a picker can make that a free-text box could not, and after composition there is one string and nothing left to compare.

`YearMonth.month` is **1-12**, not a `Date`'s 0-11. It crosses the wire as JSON and gets read by humans; an off-by-one that only surfaces in December is not worth matching `Date`'s constructor.

## Review decisions

`reviewDecisionSchema` is a discriminated union rather than a flat object, so "rejected" cannot be expressed without a reason. That is the same rule as the `*_status_consistency` CHECK on `results` / `achievements` / `certifications`, restated at the layer that can return a useful message instead of a constraint violation. `PENDING` is not a decision a reviewer can send.

## CV preferences

`cvSectionsConfigSchema` is the jsonb payload stored on `cv_preferences.sections` and copied verbatim into `cv_exports.config`. Ordering — of sections, of entries within a section, of social links — lives only here; no entity table has an `order` column. Storing the exact config rather than a checksum of the data is what makes the "skip regeneration if unchanged" short-circuit correct, since a reorder changes the rendered document without changing any row.

## Uploads

`schemas/upload.ts` is the contract for issuing an upload. `UPLOAD_RULES` names, per purpose, the content types allowed and the size cap: a **proof** is a JPEG, PNG, WebP or PDF up to 8 MiB, an **avatar** is a JPEG, PNG or WebP up to 2 MiB. SVG is excluded on purpose, since it is a document that can carry script, not an image.

The browser asks for a ticket with `{ purpose, contentType, size }` and uploads to the signed URL it gets back. What gets stored on the row is the object key the ticket named — `proofKey` on achievements and certifications, `image` on users — never a URL. `image` used to be `z.url()`; it is an `objectKey` now, and the server checks that the key really is the caller's own upload before it will store it.

## Export filenames

`utils/filename.ts`. A CV PDF is named **roll number first, then the name**:

```bash
23162-Poran-Boruah.pdf
```

Roll first because a folder of these gets sorted and roll order is what a placement cell wants. Digits only — roll numbers are written `23/162`, and a slash is a path separator everywhere.

It lives here rather than in the worker because the worker is not the only thing that will name one: the export branch has to name stored objects and re-serve them from export history, and two implementations of a naming convention is one too many.

### Non-Latin filenames won't be supported

Every account in this system is created from the college's Google Workspace, where names are stored in the Latin alphabet. There is no path by which a non-Latin name reaches this code in production. Supporting one means a second encoding, a second header parameter, a second set of cases in every test and a second way for the header to be wrong, all to serve a student who does not exist.

A name with no Latin characters still produces a working download: the roll number alone. That is a fallback so nothing crashes, not partial support for something to be finished later. `filename.test.ts` asserts the absence of the feature, so a change that re-adds it fails rather than passing quietly.

## Testing

`pnpm -F @aecfolio/shared test`. Five suites: enum parity with `packages/db`, free-text date behaviour, date composition, export filenames, and the schema invariants above. The tests are written to assert _intent_ — that a dropped field is really unsettable, that a rejection really needs a reason — rather than to restate the schema definitions.
