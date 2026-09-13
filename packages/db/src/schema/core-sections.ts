import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { studentsTable } from "./student";

export const experiencesTable = pgTable(
  "experiences",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    type: text().notNull(),
    title: text().notNull(),
    organization: text().notNull(),
    description: text().notNull(),
    date: text(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("experiences_student_id_idx").on(t.studentId),
    index("experiences_student_type_idx").on(t.studentId, t.type),
    check(
      "experience_deletedat_past",
      sql`${t.deletedAt} IS NULL OR ${t.deletedAt} <= now()`,
    ),
  ],
);

export const projectsTable = pgTable(
  "projects",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    title: text().notNull(),
    description: text().notNull(),
    link: text(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("projects_student_id_idx").on(t.studentId),
    check(
      "project_deletedat_past",
      sql`${t.deletedAt} IS NULL OR ${t.deletedAt} <= now()`,
    ),
  ],
);
