import { z } from "zod";
import { freeTextDate, softDeleteFields, timestampFields } from "./common";

export const experienceSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  type: z.string(),
  title: z.string(),
  organization: z.string(),
  description: z.string(),
  date: z.string().nullable(),
  ...timestampFields,
  ...softDeleteFields,
});

export const createExperienceSchema = z.object({
  type: z.string().trim().min(1),
  title: z.string().trim().min(1),
  organization: z.string().trim().min(1),
  description: z.string().trim().min(1),
  date: freeTextDate.nullable().optional(),
});

export const updateExperienceSchema = createExperienceSchema.partial();

export type Experience = z.infer<typeof experienceSchema>;
export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;
