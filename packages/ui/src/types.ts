import type {
  achievementsTable,
  certificationsTable,
  experiencesTable,
  projectsTable,
  resultsTable,
  socialsTable,
  studentsTable,
  usersTable,
} from "@aecfolio/db";

export type CVUser = typeof usersTable.$inferSelect;
export type CVStudent = typeof studentsTable.$inferSelect;
export type CVExperience = typeof experiencesTable.$inferSelect;
export type CVProject = typeof projectsTable.$inferSelect;
export type CVAchievement = typeof achievementsTable.$inferSelect;
export type CVCertification = typeof certificationsTable.$inferSelect;
export type CVSocial = typeof socialsTable.$inferSelect;
export type CVResult = typeof resultsTable.$inferSelect;

export type CVData = CVStudent & {
  user: CVUser;
  experiences: CVExperience[];
  projects: CVProject[];
  achievements: CVAchievement[];
  certifications: CVCertification[];
  socials: CVSocial[];
  results: CVResult[];
};

export type CVProps = { data: CVData };
