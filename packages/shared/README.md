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

## Review decisions

`reviewDecisionSchema` is a discriminated union rather than a flat object, so "rejected" cannot be expressed without a reason. That is the same rule as the `*_status_consistency` CHECK on `results` / `achievements` / `certifications`, restated at the layer that can return a useful message instead of a constraint violation. `PENDING` is not a decision a reviewer can send.

## CV preferences

`cvSectionsConfigSchema` is the jsonb payload stored on `cv_preferences.sections` and copied verbatim into `cv_exports.config`. Ordering — of sections, of entries within a section, of social links — lives only here; no entity table has an `order` column. Storing the exact config rather than a checksum of the data is what makes the "skip regeneration if unchanged" short-circuit correct, since a reorder changes the rendered document without changing any row.

## Testing

`pnpm -F @aecfolio/shared test`. Three suites: enum parity with `packages/db`, free-text date behaviour, and the schema invariants above. The tests are written to assert _intent_ — that a dropped field is really unsettable, that a rejection really needs a reason — rather than to restate the schema definitions.
