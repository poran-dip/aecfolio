import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { branchEnum } from "./enums";

export const facultyTable = pgTable(
  "faculty",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").unique().notNull(),
    employeeId: text("employee_id").unique().notNull(),
    designation: text(),
    department: branchEnum(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    check(
      "faculty_deletedat_past",
      sql`${t.deletedAt} IS NULL OR ${t.deletedAt} <= now()`,
    ),
  ],
);
