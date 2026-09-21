# @aecfolio/db

Drizzle schema, relations, and the shared database client for AECFolio. This README is the only place schema design decisions live — the schema files themselves are kept comment-free. Update this doc in the same change as any schema edit that isn't self-explanatory from the code.

## Layout

```bash
src/
├── client.ts                   drizzle(pool, { schema }) — the shared `db` export
├── index.ts                    re-exports client + schema
└── schema/
    ├── enums.ts                every pgEnum used across the schema
    ├── auth.ts                 users, sessions, accounts, verifications (better-auth tables)
    ├── faculty.ts              faculty
    ├── student.ts              students (core academic identity + personal info)
    ├── core-sections.ts        experiences, projects
    ├── additional-sections.ts  achievements, certifications, interests, socials, custom_sections, custom_section_entries
    ├── grading.ts              semester_credit_schemes, results
    ├── cv.ts                   cv_preferences, cv_exports, cv_export_jobs, cv_export_job_items
    ├── audit.ts                audit_logs
    ├── relations.ts            Drizzle relational-query API relations for every table above (no DDL)
    └── index.ts                re-exports every file above — this is what drizzle.config.ts points at
```

`client.ts` and top-level `index.ts` don't reference specific tables, so they're correct for any schema shape and rarely need touching. One thing worth doing in a later pass: `client.ts` still reads `process.env.DATABASE_URL` directly, while `drizzle.config.ts` already uses `@aecfolio/config`'s typed env loader — worth aligning once that loader is rolled out further (env/dev-loop work, not a schema concern).

## Why files are split the way they are

Each file is named for what it actually holds, not for when it was written: `student.ts` is just `studentsTable` — the core academic identity and personal-info row, nothing else. `core-sections.ts` holds the two CV-native sections every student has (experiences, projects). `additional-sections.ts` holds every other student-owned entry type (achievements, certifications, interests, socials, custom sections). `grading.ts` is the credit/results machinery. `cv.ts` is export preferences and history. Splitting along these lines keeps each file scoped to one concept, so a change to (say) the verification workflow only touches the files that actually have verification columns.

A separate `student_personal_details` table (1:1 with `students`) was considered and rejected. Reasoning: personal fields (dob, gender, caste, religion, spoken languages, parent contacts, location, title sought) have no independent lifecycle — no separate review/verification step, no separate access pattern, always read and written alongside the rest of the student row (the profile page and CV always need both at once). Splitting them out would add a join to nearly every student read for a categorization benefit only, not a functional one. If a real reason shows up later — e.g. an access-control policy that specifically needs to gate sensitive fields (caste, religion) behind a narrower permission than the rest of the profile — splitting then is a normal, low-cost migration (new table, backfill, drop columns from `students`). Nothing about keeping it together now forecloses that.

## Enums (`enums.ts`)

- `role` — `STUDENT | FACULTY | MOD | ADMIN`. No `PENDING`. Self-service sign-up doesn't exist in this product: every account is created with an explicit role by whoever has authority to create it (faculty create students, mod/admin create faculty, `scripts/bootstrap.ts` creates the first admin — and any later admin/mod/faculty account, faculty row included). There is no intermediate "signed up, not yet approved" state to model.
- `course` — `BTECH | MTECH | BCA | MCA`.
- `branch` — the nine engineering/CA branches AEC offers.
- `student_status` — `ACTIVE | ALUMNI | SUSPENDED | LEFT`. Drives the moderator bulk-promotion flow (final-semester students become `ALUMNI`) and gives real states for the two other cases a college has to track: a student temporarily barred (`SUSPENDED`) and one who withdrew or transferred out entirely (`LEFT`), as distinct from a normal graduate.
- `cv_export_kind` — `SELF | STANDARD`. Which export shape produced a PDF: a student's own (verified and pending claims, only verified marked) or the faculty/standard one (verified claims only). Part of every export's checksum, so one shape is never served in place of the other.
- `cv_export_job_status` — `QUEUED | RUNNING | SUCCEEDED | FAILED`. A job that finishes with some students failed is still `SUCCEEDED`, with `failed` counting them; `FAILED` means nothing could be produced at all, or the run itself broke.
- `verification_status` — `PENDING | VERIFIED | REJECTED`. Shared by `results`, `achievements`, and `certifications` — the three entity types a faculty member reviews. See "Verification workflow" below for the full state machine, including why rejection reasons persist across resubmission.

`experience_type` and `social_type` are deliberately **not** enums. Both are free-text columns with an application-level suggested-values list (Internship/Volunteer/Club/Freelance/Other for experience type; a known-platforms list for socials, used only to pick an icon). Neither is universal enough to enforce at the DB level, and application-layer lists don't need a migration to extend.

`audit_logs.action` and `audit_logs.entity` are also plain `text`, not enums, for the same reason: this list grows as more entity types get added to the product, and a free-text column means adding one is a one-line application change, not a migration.

## Verification workflow (`results`, `achievements`, `certifications`)

All three share the same shape: `status` (`verification_status`), `rejectionReason`, `reviewedBy` → `users.id`, `reviewedAt`. Columns are named `reviewedBy`/`reviewedAt`, not `verifiedBy`/`verifiedAt` — they record who made the review decision either way, verify or reject, not only who verified. The intended flow:

1. Student submits. `status = PENDING`, `reviewedBy`/`reviewedAt` null.
2. Faculty verifies or rejects. **Verified**: `status = VERIFIED`, `reviewedBy`/`reviewedAt` set, `rejectionReason` cleared. For `results` specifically, `sgpa` must also be set at this point — the CHECK constraint enforces the `pendingSgpa → sgpa` promotion at the database level, not just by convention. **Rejected**: `status = REJECTED`, `reviewedBy`/`reviewedAt` set, `rejectionReason` required.
3. Student can edit and resubmit. This resets `status` to `PENDING` and clears `reviewedBy`/`reviewedAt` (a new review is needed) — but **does not** clear `rejectionReason`. The point: if the previous submission was rejected, the student edits based on that reason and resubmits, and faculty reviewing the resubmission can still see why the last one was declined. `rejectionReason` is only cleared when a submission is actually accepted.

The CHECK constraint (`*_status_consistency` on each table) encodes exactly this:

```sql
(status = 'PENDING'  AND reviewed_by IS NULL     AND reviewed_at IS NULL) OR
(status = 'VERIFIED' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL AND rejection_reason IS NULL) OR
(status = 'REJECTED' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL AND rejection_reason IS NOT NULL)
```

The `PENDING` branch doesn't constrain `rejectionReason` at all — it's free to be null (first-ever submission) or carry a previous rejection forward (resubmission). The `REJECTED` branch requires `reviewedBy`/`reviewedAt` to be set, same as `VERIFIED` — a rejection is a review decision too, so it needs a reviewer and a timestamp just as much as an acceptance does.

## CGPA and the credit-scheme model

`students.cgpa` is a cached, real-valued column. It is **never written directly** by a student, and never computed in SQL. Application code recomputes it every time one of that student's results is verified, as the credit-weighted average across all of their `VERIFIED` semesters.

The credits each semester is worth come from `semester_credit_schemes`, not from a column on `results` itself: one row per `(branch, admission_year, semester)`, set by an admin/mod during college-wide semester promotion, and shared by every student in that cohort via `results.scheme_id`. This guarantees no two students of the same batch and branch can end up with a different total credit count for the same semester — something a per-result or per-student credit field couldn't guarantee.

## Dates are free text, not timestamps

Every date-shaped field on an entry is a plain `text` column, not a Postgres `timestamp`. This is what lets a student type "Present" for a current role, "Summer 2024," or any informal/partial date, the way people actually fill out a CV. Formatting is entirely an application-layer concern — pick a start/end in the UI, convert to a string before it hits the DB, or let the student type it freehand. There is no DB-level date-order CHECK anywhere in this schema, since a free-text field isn't something the database can meaningfully validate as ordered.

`experiences.date` and `customSectionEntries.date` are each a single free-text column, not a `startDate`/`endDate` pair — a CV entry is usually described as one span ("2023 – Present", "Jun–Aug 2024"), so the application layer owns the full string rather than the database owning two separate ends of it.

`certifications.issueDate` is the one exception, and it stays alone (no `expiryDate`): when a credential was issued is worth keeping, but an expiry date isn't treated as meaningful information for this product.

## Ordering lives in `cv_preferences` / `cv_exports`, nowhere else

No entity table — `socials`, `projects`, `achievements`, any of them — has an `order` column. Section order, the order of entries within a section, and the order of social links are all a CV-presentation concern, not a property of the underlying data, so they live entirely in:

- `cv_preferences` — one row per `(student, template)`, unique on that pair. `sections` (jsonb) holds the student's saved defaults: `[{ type, include, order, entryOrder: [id, ...], hiddenEntries: [id, ...], ...options }, ...]`. `entryOrder` applies to every section type, built-in and custom alike, and to the socials list, with one exception: `results` ignores it, because semesters always print first to last. A stored `entryOrder` on a `results` section is harmless and simply not read. `hiddenEntries` lists the entries the student switched off in that section, so a list of what to leave out rather than what to keep: an entry created after the row was saved shows by default. A row saved before the field existed has none, and reads as showing everything. Staff exports use the same saved row, so what a student switches off stays off for them too.
- `cv_exports` — one row per generated PDF, storing the **exact** `sections` config and `options` used for that export, which export shape produced it (`kind`: `SELF` or `STANDARD`), who asked for it, and a `checksum`. The checksum covers the shape, the template, the config, the options, every field of student data the render received, the avatar's object key and the worker's render version — so a reorder, an edit, a different export shape or a template change each produce a new PDF, and an export where none of those changed reuses the stored one. A config alone is not enough to key on: the same config over edited data is a different document. The last 100 rows per student are kept, across both kinds; older rows are deleted with their objects.
- `cv_export_jobs` / `cv_export_job_items` — bulk exports. A job is one staff member's request over a list of students, with running `completed` / `failed` counts (a CHECK keeps them within `total`); an item is one student in it, pointing at the `cv_exports` row it produced or carrying the error that stopped it. Jobs are deleted after seven days; the PDFs they point at belong to the students' histories, not to the job.

`cv_preferences` is keyed per template, not per student, because different templates can support a different number of columns or a different set of sections/options — whether a given template accepts a given section is an application-level check against that template's own definition, not a DB constraint.

One `templateId` value is the fixed **standard template** — the only one faculty and institutional (bulk) exports ever render. Every other `templateId` a student has preferences for exists purely for their own off-campus use and is never selected by faculty. That distinction is enforced by the export code path, not by this schema (there's nothing here that marks one row as "the" standard row — that ID lives in the template registry, in the UI/API layer).

## Foreign keys and delete policy

Every relation in this schema has an explicit `.references()` with a deliberate `onDelete`:

| Relationship                                                                                                                                                                                             | Policy     | Why                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `students/faculty/sessions/accounts.userId` → `users.id`                                                                                                                                                 | `cascade`  | The row has no meaning without its user                                                                |
| every student-owned entity (`results`, `experiences`, `projects`, `achievements`, `certifications`, `socials`, `interests`, `customSections`, `cvPreferences`, `cvExports`) `.studentId` → `students.id` | `cascade`  | Owned data                                                                                             |
| `customSectionEntries.customSectionId` → `customSections.id`                                                                                                                                             | `cascade`  | Owned data, one level deeper                                                                           |
| `results.schemeId` → `semesterCreditSchemes.id`                                                                                                                                                          | `restrict` | A scheme in use for CGPA weighting shouldn't be deletable out from under the results that reference it |
| `*.reviewedBy` → `users.id` (achievements, certifications, results)                                                                                                                                      | `restrict` | Preserve who made a review decision even if that user account is later removed                         |
| `cvExports.requestedBy` → `users.id`                                                                                                                                                                     | `set null` | The export belongs to the student's history; who asked for it is incidental                            |
| `cvExportJobs.requestedBy` → `users.id`, `cvExportJobItems.jobId` → `cvExportJobs.id`, `cvExportJobItems.studentId` → `students.id`                                                                      | `cascade`  | A job is a staff member's working state, with no meaning once they or the students are gone            |
| `cvExportJobItems.exportId` → `cvExports.id`                                                                                                                                                             | `set null` | History pruning may remove a PDF an old job pointed at; the job's zip lists it as missing              |
| `auditLogs.userId` → `users.id`                                                                                                                                                                          | `restrict` | The log must outlive the actor — the whole point of the immutability trigger below                     |

## Soft deletes

Every student-owned table has `deletedAt` and a `*_deletedat_past` CHECK, including `results` and `socials`. `verifications` (better-auth) and `semester_credit_schemes` don't; neither has a product reason to be "deleted" by a user in a way that needs a trace kept.

## Audit log immutability trigger

`audit_logs` has no `deletedAt` — it isn't meant to be edited or removed at all. That's enforced by a trigger, not by application discipline, but a trigger is not something Drizzle's schema DSL can declare — it has to be a hand-written custom migration, generated with `drizzle-kit generate --custom` after the baseline migration exists. **This is easy to forget when regenerating migrations from scratch, so it's recorded here in full:**

```sql
CREATE OR REPLACE FUNCTION prevent_auditlog_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog records are immutable and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auditlog_immutable ON "audit_logs";
CREATE TRIGGER auditlog_immutable
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW EXECUTE FUNCTION prevent_auditlog_mutation();
```

Add this as its own custom migration immediately after generating the baseline schema migration, before applying anything to a real database.

## Known gaps

- **`src/seed.ts` and `src/seed-fake.ts` were deleted** — they targeted an older schema shape (`verified: boolean`, no `admissionYear`, no `schemeId`, etc.) and no longer typechecked or ran. Seed data needs to be rebuilt from scratch against the current schema, with real values for the now-required fields (credit schemes, admission years, etc.), which is worth doing thoughtfully rather than as a rushed side effect of any single schema pass.
- **`packages/shared`'s mirrored enums** (`role`, `course`, `branch`, and the app-level `experienceType`/`socialType` lists) need to stay in sync with this package — that package is the Zod/type contract layer consumed by both `apps/api` and `apps/web`.
- **Any API route or web component reading or writing `results`, `achievements`, `certifications`, `socials`, `projects`, or `students`** needs to match whatever shape those tables are currently in.
