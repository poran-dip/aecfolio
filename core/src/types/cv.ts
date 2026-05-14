import { Achievement, Certification, Experience, Project, Result, Social, Student, User } from "@/generated/prisma/client";

export type CVTemplate = "professional-theme";

export type StudentWithRelations = Student & {
  user: User;
  experiences: Experience[];
  projects: Project[];
  achievements: Achievement[];
  certifications: Certification[];
  socials: Social[];
  results: Result[];
};

export type Props = { data: StudentWithRelations };

// What gets passed to the PDF microservice
export type CVPayload = {
  name: string;
  html: string;
};
