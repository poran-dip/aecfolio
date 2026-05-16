import { z } from "zod";

export const projectSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  title: z.string(),
  description: z.string(),
  techStack: z.array(z.string()),
  link: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  techStack: z.array(z.string()).optional(),
  link: z.string().url().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type Project = z.infer<typeof projectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
