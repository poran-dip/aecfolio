import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { branchEnum, courseEnum } from "./enums";

export const experienceTypeEnum = pgEnum("experience_type", [
  "INTERNSHIP",
  "VOLUNTEER",
  "CLUB",
  "OTHER",
]);
export const socialTypeEnum = pgEnum("social_type", [
  "LINKEDIN",
  "GITHUB",
  "LEETCODE",
  "CODEFORCES",
  "OTHER",
]);

export const studentsTable = pgTable(
  "students",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").unique().notNull(),
    rollNo: text("roll_no").unique().notNull(),
    course: courseEnum().notNull(),
    branch: branchEnum().notNull(),
    semester: integer().notNull(),
    bio: text(),
    skills: text().array().default([]).notNull(),
    cgpa: real(),
    motherName: text("mother_name"),
    fatherName: text("father_name"),
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
    check(
      "student_semester_range",
      sql`${t.semester} >= 1 AND ${t.semester} <= 8`,
    ),
    check("student_cgpa_range", sql`${t.cgpa} >= 0.0 AND ${t.cgpa} <= 10.0`),
    check(
      "student_deletedat_past",
      sql`${t.deletedAt} IS NULL OR ${t.deletedAt} <= now()`,
    ),
  ],
);

export const resultsTable = pgTable(
  "results",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("student_id").notNull(),
    semester: integer().notNull(),
    sgpa: real(),
    pendingSgpa: real("pending_sgpa"),
    verified: boolean().default(false).notNull(),
    verifiedBy: text("verified_by"),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("results_student_semester_unique").on(t.studentId, t.semester),
    index("results_verified_idx").on(t.verified),
    check(
      "result_semester_range",
      sql`${t.semester} >= 1 AND ${t.semester} <= 8`,
    ),
    check("result_sgpa_range", sql`${t.sgpa} >= 0.0 AND ${t.sgpa} <= 10.0`),
    check(
      "result_pending_sgpa_range",
      sql`${t.pendingSgpa} IS NULL OR (${t.pendingSgpa} >= 0.0 AND ${t.pendingSgpa} <= 10.0)`,
    ),
    check(
      "result_verified_consistency",
      sql`
      (${t.verified} = false AND ${t.verifiedBy} IS NULL AND ${t.verifiedAt} IS NULL) OR
      (${t.verified} = true AND ${t.verifiedBy} IS NOT NULL AND ${t.verifiedAt} IS NOT NULL)
    `,
    ),
  ],
);

export const experiencesTable = pgTable(
  "experiences",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("student_id").notNull(),
    type: experienceTypeEnum().notNull(),
    title: text().notNull(),
    organization: text().notNull(),
    description: text().notNull(),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
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
      "experience_date_order",
      sql`${t.endDate} IS NULL OR ${t.startDate} IS NULL OR ${t.endDate} >= ${t.startDate}`,
    ),
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
    studentId: text("student_id").notNull(),
    title: text().notNull(),
    description: text().notNull(),
    techStack: text("tech_stack").array().default([]).notNull(),
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

export const achievementsTable = pgTable(
  "achievements",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("student_id").notNull(),
    title: text().notNull(),
    description: text().notNull(),
    proofImage: text("proof_image"),
    verified: boolean().default(false).notNull(),
    verifiedBy: text("verified_by"),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("achievements_student_id_idx").on(t.studentId),
    index("achievements_verified_idx").on(t.verified),
    check(
      "achievement_verified_consistency",
      sql`
      (${t.verified} = false AND ${t.verifiedBy} IS NULL AND ${t.verifiedAt} IS NULL) OR
      (${t.verified} = true AND ${t.verifiedBy} IS NOT NULL AND ${t.verifiedAt} IS NOT NULL)
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
    studentId: text("student_id").notNull(),
    name: text().notNull(),
    issuer: text().notNull(),
    issueDate: timestamp("issue_date"),
    proofImage: text("proof_image"),
    verified: boolean().default(false).notNull(),
    verifiedBy: text("verified_by"),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("certifications_student_id_idx").on(t.studentId),
    index("certifications_verified_idx").on(t.verified),
    check(
      "certification_verified_consistency",
      sql`
      (${t.verified} = false AND ${t.verifiedBy} IS NULL AND ${t.verifiedAt} IS NULL) OR
      (${t.verified} = true AND ${t.verifiedBy} IS NOT NULL AND ${t.verifiedAt} IS NOT NULL)
    `,
    ),
    check(
      "certification_deletedat_past",
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
    studentId: text("student_id").notNull(),
    type: socialTypeEnum().notNull(),
    url: text().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("socials_student_type_unique").on(t.studentId, t.type),
    index("socials_student_id_idx").on(t.studentId),
    check("social_url_format", sql`${t.url} ~ '^https?://'`),
  ],
);
