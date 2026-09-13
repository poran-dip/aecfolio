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
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { branchEnum, courseEnum, studentStatusEnum } from "./enums";

export const studentsTable = pgTable(
  "students",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .unique()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    rollNo: text("roll_no").unique().notNull(),
    course: courseEnum().notNull(),
    branch: branchEnum().notNull(),
    semester: integer().notNull(),
    status: studentStatusEnum().default("ACTIVE").notNull(),
    admissionYear: integer("admission_year").notNull(),
    bio: text(),
    skills: text().array().default([]).notNull(),
    cgpa: real(),
    titleSought: text("title_sought"),
    dob: text(),
    gender: text(),
    caste: text(),
    religion: text(),
    spokenLanguages: text("spoken_languages").array().default([]).notNull(),
    motherName: text("mother_name"),
    motherContact: text("mother_contact"),
    fatherName: text("father_name"),
    fatherContact: text("father_contact"),
    location: text(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("students_course_idx").on(t.course),
    index("students_branch_idx").on(t.branch),
    index("students_course_branch_idx").on(t.course, t.branch),
    index("students_semester_idx").on(t.semester),
    index("students_admission_year_idx").on(t.admissionYear),
    index("students_status_idx").on(t.status),
    check(
      "student_semester_range",
      sql`${t.semester} >= 1 AND ${t.semester} <= 8`,
    ),
    check(
      "student_cgpa_range",
      sql`${t.cgpa} IS NULL OR (${t.cgpa} >= 0.0 AND ${t.cgpa} <= 10.0)`,
    ),
    check(
      "student_deletedat_past",
      sql`${t.deletedAt} IS NULL OR ${t.deletedAt} <= now()`,
    ),
  ],
);
