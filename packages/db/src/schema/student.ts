import { date, index, integer, pgTable, real, text, timestamp } from "drizzle-orm/pg-core"

export const studentsTable = pgTable(
  "students", {
    id: text().primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").unique().notNull(),
    rollNo: text("roll_no"),
    course: text().notNull(),
    branch: text().notNull(),
    semester: integer(),
    cgpa: real(),
    bio: text(),
    location: text(),
    motherName: text("mother_name"),
    fatherName: text("father_name"),
    createdAt: date("created_at").defaultNow().notNull(),
    updatedAt: date("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at")
  }, 
  (t) => [
    index("students_course_idx").on(t.course),
    index("students_branch_idx").on(t.branch),
    index("students_course_branch_idx").on(t.course, t.branch),
    index("students_semester_idx").on(t.semester),
  ]
);
