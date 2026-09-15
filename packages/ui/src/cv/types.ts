import type {
  Achievement,
  Certification,
  CustomSection,
  CustomSectionEntry,
  Experience,
  Interest,
  Project,
  Result,
  Social,
  Student,
  User,
} from "@aecfolio/shared";

export type CvMark = {
  proofUrl: string | null;
};

export type WithMark<T> = T & {
  mark: CvMark | null;
};

export type CvCustomSectionData = CustomSection & {
  entries: CustomSectionEntry[];
};

export type CvInstitution = {
  name: string;
  location: string;
};

export const DEFAULT_INSTITUTION: CvInstitution = {
  name: "Assam Engineering College",
  location: "Guwahati, Assam, India",
};

export type CvData = {
  student: Student;
  user: User;
  institution: CvInstitution;

  experiences: Experience[];
  projects: Project[];
  interests: Interest[];
  socials: Social[];
  customSections: CvCustomSectionData[];

  achievements: WithMark<Achievement>[];
  certifications: WithMark<Certification>[];
  results: WithMark<Result>[];

  cgpaMark: CvMark | null;
};
