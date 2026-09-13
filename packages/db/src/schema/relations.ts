import { relations } from "drizzle-orm";
import {
  achievementsTable,
  certificationsTable,
  customSectionEntriesTable,
  customSectionsTable,
  interestsTable,
  socialsTable,
} from "./additional-sections";
import { auditLogsTable } from "./audit";
import { accountsTable, sessionsTable, usersTable } from "./auth";
import { experiencesTable, projectsTable } from "./core-sections";
import { cvExportsTable, cvPreferencesTable } from "./cv";
import { facultyTable } from "./faculty";
import { resultsTable, semesterCreditSchemesTable } from "./grading";
import { studentsTable } from "./student";

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  student: one(studentsTable, {
    fields: [usersTable.id],
    references: [studentsTable.userId],
  }),
  faculty: one(facultyTable, {
    fields: [usersTable.id],
    references: [facultyTable.userId],
  }),
  accounts: many(accountsTable),
  sessions: many(sessionsTable),
  auditLogs: many(auditLogsTable),
}));

export const accountsRelations = relations(accountsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [accountsTable.userId],
    references: [usersTable.id],
  }),
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  }),
}));

export const studentsRelations = relations(studentsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [studentsTable.userId],
    references: [usersTable.id],
  }),
  results: many(resultsTable),
  experiences: many(experiencesTable),
  projects: many(projectsTable),
  achievements: many(achievementsTable),
  certifications: many(certificationsTable),
  socials: many(socialsTable),
  interests: many(interestsTable),
  customSections: many(customSectionsTable),
  cvPreferences: many(cvPreferencesTable),
  cvExports: many(cvExportsTable),
}));

export const semesterCreditSchemesRelations = relations(
  semesterCreditSchemesTable,
  ({ many }) => ({
    results: many(resultsTable),
  }),
);

export const resultsRelations = relations(resultsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [resultsTable.studentId],
    references: [studentsTable.id],
  }),
  scheme: one(semesterCreditSchemesTable, {
    fields: [resultsTable.schemeId],
    references: [semesterCreditSchemesTable.id],
  }),
  reviewer: one(usersTable, {
    fields: [resultsTable.reviewedBy],
    references: [usersTable.id],
  }),
}));

export const experiencesRelations = relations(experiencesTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [experiencesTable.studentId],
    references: [studentsTable.id],
  }),
}));

export const projectsRelations = relations(projectsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [projectsTable.studentId],
    references: [studentsTable.id],
  }),
}));

export const achievementsRelations = relations(
  achievementsTable,
  ({ one }) => ({
    student: one(studentsTable, {
      fields: [achievementsTable.studentId],
      references: [studentsTable.id],
    }),
    reviewer: one(usersTable, {
      fields: [achievementsTable.reviewedBy],
      references: [usersTable.id],
    }),
  }),
);

export const certificationsRelations = relations(
  certificationsTable,
  ({ one }) => ({
    student: one(studentsTable, {
      fields: [certificationsTable.studentId],
      references: [studentsTable.id],
    }),
    reviewer: one(usersTable, {
      fields: [certificationsTable.reviewedBy],
      references: [usersTable.id],
    }),
  }),
);

export const socialsRelations = relations(socialsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [socialsTable.studentId],
    references: [studentsTable.id],
  }),
}));

export const interestsRelations = relations(interestsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [interestsTable.studentId],
    references: [studentsTable.id],
  }),
}));

export const customSectionsRelations = relations(
  customSectionsTable,
  ({ one, many }) => ({
    student: one(studentsTable, {
      fields: [customSectionsTable.studentId],
      references: [studentsTable.id],
    }),
    entries: many(customSectionEntriesTable),
  }),
);

export const customSectionEntriesRelations = relations(
  customSectionEntriesTable,
  ({ one }) => ({
    section: one(customSectionsTable, {
      fields: [customSectionEntriesTable.customSectionId],
      references: [customSectionsTable.id],
    }),
  }),
);

export const cvPreferencesRelations = relations(
  cvPreferencesTable,
  ({ one }) => ({
    student: one(studentsTable, {
      fields: [cvPreferencesTable.studentId],
      references: [studentsTable.id],
    }),
  }),
);

export const cvExportsRelations = relations(cvExportsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [cvExportsTable.studentId],
    references: [studentsTable.id],
  }),
}));

export const facultyRelations = relations(facultyTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [facultyTable.userId],
    references: [usersTable.id],
  }),
}));

export const auditLogsRelations = relations(auditLogsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [auditLogsTable.userId],
    references: [usersTable.id],
  }),
}));
