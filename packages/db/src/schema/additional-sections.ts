import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { verificationStatusEnum } from "./enums";
import { studentsTable } from "./student";

export const achievementsTable = pgTable(
  "achievements",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    title: text().notNull(),
    description: text().notNull(),
    proofKey: text("proof_key"),
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
    index("achievements_student_id_idx").on(t.studentId),
    index("achievements_status_idx").on(t.status),
    check(
      "achievement_status_consistency",
      sql`
      (${t.status} = 'PENDING' AND ${t.reviewedBy} IS NULL AND ${t.reviewedAt} IS NULL) OR
      (${t.status} = 'VERIFIED' AND ${t.reviewedBy} IS NOT NULL AND ${t.reviewedAt} IS NOT NULL AND ${t.rejectionReason} IS NULL) OR
      (${t.status} = 'REJECTED' AND ${t.reviewedBy} IS NOT NULL AND ${t.reviewedAt} IS NOT NULL AND ${t.rejectionReason} IS NOT NULL)
    `,
    ),
    check(
      "achievement_deletedat_past",
      sql`${t.deletedAt} IS NULL OR ${t.deletedAt} <= now()`,
    ),
  ],
);

export const certificationsTable = pgTable(
  "certifications",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    name: text().notNull(),
    issuer: text().notNull(),
    issueDate: text("issue_date"),
    expiryDate: text("expiry_date"),
    credentialLink: text("credential_link"),
    proofKey: text("proof_key"),
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
    index("certifications_student_id_idx").on(t.studentId),
    index("certifications_status_idx").on(t.status),
    check(
      "certification_status_consistency",
      sql`
      (${t.status} = 'PENDING' AND ${t.reviewedBy} IS NULL AND ${t.reviewedAt} IS NULL) OR
      (${t.status} = 'VERIFIED' AND ${t.reviewedBy} IS NOT NULL AND ${t.reviewedAt} IS NOT NULL AND ${t.rejectionReason} IS NULL) OR
      (${t.status} = 'REJECTED' AND ${t.reviewedBy} IS NOT NULL AND ${t.reviewedAt} IS NOT NULL AND ${t.rejectionReason} IS NOT NULL)
    `,
    ),
    check(
      "certification_deletedat_past",
      sql`${t.deletedAt} IS NULL OR ${t.deletedAt} <= now()`,
    ),
  ],
);

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
    body: text(),
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

export const socialsTable = pgTable(
  "socials",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    title: text().notNull(),
    url: text().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("socials_student_id_idx").on(t.studentId),
    check("social_url_format", sql`${t.url} ~ '^https?://'`),
    check(
      "social_deletedat_past",
      sql`${t.deletedAt} IS NULL OR ${t.deletedAt} <= now()`,
    ),
  ],
);

export const customSectionsTable = pgTable(
  "custom_sections",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    name: text().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("custom_sections_student_id_idx").on(t.studentId),
    check(
      "custom_section_deletedat_past",
      sql`${t.deletedAt} IS NULL OR ${t.deletedAt} <= now()`,
    ),
  ],
);

export const customSectionEntriesTable = pgTable(
  "custom_section_entries",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    customSectionId: text("custom_section_id")
      .notNull()
      .references(() => customSectionsTable.id, { onDelete: "cascade" }),
    title: text().notNull(),
    org: text(),
    date: text(),
    body: text(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("custom_section_entries_section_id_idx").on(t.customSectionId),
    check(
      "custom_section_entry_deletedat_past",
      sql`${t.deletedAt} IS NULL OR ${t.deletedAt} <= now()`,
    ),
  ],
);
