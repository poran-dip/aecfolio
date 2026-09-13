import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { branchEnum, verificationStatusEnum } from "./enums";
import { studentsTable } from "./student";

export const semesterCreditSchemesTable = pgTable(
  "semester_credit_schemes",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    branch: branchEnum().notNull(),
    admissionYear: integer("admission_year").notNull(),
    semester: integer().notNull(),
    totalCredits: integer("total_credits").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("scheme_branch_year_semester_unique").on(
      t.branch,
      t.admissionYear,
      t.semester,
    ),
    check(
      "scheme_semester_range",
      sql`${t.semester} >= 1 AND ${t.semester} <= 8`,
    ),
    check("scheme_total_credits_positive", sql`${t.totalCredits} > 0`),
  ],
);

export const resultsTable = pgTable(
  "results",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    semester: integer().notNull(),
    schemeId: text("scheme_id")
      .notNull()
      .references(() => semesterCreditSchemesTable.id, {
        onDelete: "restrict",
      }),
    sgpa: real(),
    pendingSgpa: real("pending_sgpa"),
    status: verificationStatusEnum().default("PENDING").notNull(),
    rejectionReason: text("rejection_reason"),
    reviewedBy: text("reviewed_by").references(() => usersTable.id, {
      onDelete: "restrict",
    }),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    unique("results_student_semester_unique").on(t.studentId, t.semester),
    index("results_status_idx").on(t.status),
    check(
      "result_semester_range",
      sql`${t.semester} >= 1 AND ${t.semester} <= 8`,
    ),
    check(
      "result_sgpa_range",
      sql`${t.sgpa} IS NULL OR (${t.sgpa} >= 0.0 AND ${t.sgpa} <= 10.0)`,
    ),
    check(
      "result_pending_sgpa_range",
      sql`${t.pendingSgpa} IS NULL OR (${t.pendingSgpa} >= 0.0 AND ${t.pendingSgpa} <= 10.0)`,
    ),
    check(
      "result_status_consistency",
      sql`
      (${t.status} = 'PENDING' AND ${t.reviewedBy} IS NULL AND ${t.reviewedAt} IS NULL) OR
      (${t.status} = 'VERIFIED' AND ${t.reviewedBy} IS NOT NULL AND ${t.reviewedAt} IS NOT NULL AND ${t.sgpa} IS NOT NULL AND ${t.rejectionReason} IS NULL) OR
      (${t.status} = 'REJECTED' AND ${t.reviewedBy} IS NOT NULL AND ${t.reviewedAt} IS NOT NULL AND ${t.rejectionReason} IS NOT NULL)
    `,
    ),
    check(
      "result_deletedat_past",
      sql`${t.deletedAt} IS NULL OR ${t.deletedAt} <= now()`,
    ),
  ],
);
