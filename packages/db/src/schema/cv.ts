import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { cvExportJobStatusEnum, cvExportKindEnum } from "./enums";
import { studentsTable } from "./student";

type JsonArray = readonly unknown[];
type JsonObject = Record<string, unknown>;

export const cvPreferencesTable = pgTable(
  "cv_preferences",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    templateId: text("template_id").notNull(),
    sections: jsonb().$type<JsonArray>().notNull().default([]),
    options: jsonb().$type<JsonObject>().notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("cv_preferences_student_template_unique").on(
      t.studentId,
      t.templateId,
    ),
  ],
);

export const cvExportsTable = pgTable(
  "cv_exports",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    templateId: text("template_id").notNull(),
    kind: cvExportKindEnum().notNull(),
    config: jsonb().$type<JsonArray>().notNull(),
    options: jsonb().$type<JsonObject>().notNull().default({}),
    checksum: text().notNull(),
    objectKey: text("object_key").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    requestedBy: text("requested_by").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("cv_exports_student_id_idx").on(t.studentId),
    index("cv_exports_student_created_idx").on(t.studentId, t.createdAt),
    index("cv_exports_student_checksum_idx").on(t.studentId, t.checksum),
  ],
);

export const cvExportJobsTable = pgTable(
  "cv_export_jobs",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    requestedBy: text("requested_by")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    status: cvExportJobStatusEnum().default("QUEUED").notNull(),
    total: integer().notNull(),
    completed: integer().default(0).notNull(),
    failed: integer().default(0).notNull(),
    error: text(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    startedAt: timestamp("started_at"),
    finishedAt: timestamp("finished_at"),
  },
  (t) => [
    index("cv_export_jobs_requested_by_idx").on(t.requestedBy, t.createdAt),
    index("cv_export_jobs_status_idx").on(t.status, t.createdAt),
    check(
      "cv_export_job_progress",
      sql`${t.completed} >= 0 AND ${t.failed} >= 0 AND ${t.completed} + ${t.failed} <= ${t.total}`,
    ),
  ],
);

export const cvExportJobItemsTable = pgTable(
  "cv_export_job_items",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    jobId: text("job_id")
      .notNull()
      .references(() => cvExportJobsTable.id, { onDelete: "cascade" }),
    position: integer().notNull(),
    studentId: text("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    exportId: text("export_id").references(() => cvExportsTable.id, {
      onDelete: "set null",
    }),
    error: text(),
    finishedAt: timestamp("finished_at"),
  },
  (t) => [
    unique("cv_export_job_items_job_student_unique").on(t.jobId, t.studentId),
    index("cv_export_job_items_job_position_idx").on(t.jobId, t.position),
  ],
);
