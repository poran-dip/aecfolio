import { z } from "zod";
import { softDeleteFields, timestampFields } from "./common";

export const projectSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  title: z.string(),
  description: z.string(),
  link: z.string().nullable(),
  ...timestampFields,
  ...softDeleteFields,
});

export const createProjectSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  link: z.url().nullable().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type Project = z.infer<typeof projectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
