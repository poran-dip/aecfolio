import type {
  Achievement,
  Certification,
  Experience,
  Project,
  Result,
  Social,
  Student,
  User,
} from "@aecfolio/shared";

export type StudentWithRelations = Student & {
  user: User;
  experiences: Experience[];
  projects: Project[];
  achievements: Achievement[];
  certifications: Certification[];
  socials: Social[];
  results: Result[];
};
