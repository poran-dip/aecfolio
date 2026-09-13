import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { studentsTable } from "./student";

// Its own entity, not an array field on students — decision #7. Same
// family shape as achievements/projects: a title and a markdown body.
export const interestsTable = pgTable(
  "interests",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    title: text().notNull(),
    body: text(), // markdown
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("interests_student_id_idx").on(t.studentId),
    check(
      "interest_deletedat_past",
      sql`${t.deletedAt} IS NULL OR ${t.deletedAt} <= now()`,
    ),
  ],
);
