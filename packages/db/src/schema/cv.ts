import { createId } from "@paralleldrive/cuid2";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { studentsTable } from "./student";

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
    sections: jsonb().notNull().default([]),
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
    config: jsonb().notNull(),
    objectKey: text("object_key").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("cv_exports_student_id_idx").on(t.studentId),
    index("cv_exports_student_created_idx").on(t.studentId, t.createdAt),
  ],
);
