import { relations } from "drizzle-orm";
import { auditLogsTable } from "./audit";
import { accountsTable, sessionsTable, usersTable } from "./auth";
import { facultyTable } from "./faculty";
import {
  achievementsTable,
  certificationsTable,
  experiencesTable,
  projectsTable,
  resultsTable,
  socialsTable,
  studentsTable,
} from "./student";

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
}));

export const resultsRelations = relations(resultsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [resultsTable.studentId],
    references: [studentsTable.id],
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
  }),
);

export const certificationsRelations = relations(
  certificationsTable,
  ({ one }) => ({
    student: one(studentsTable, {
      fields: [certificationsTable.studentId],
      references: [studentsTable.id],
    }),
  }),
);

export const socialsRelations = relations(socialsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [socialsTable.studentId],
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
