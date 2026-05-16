import { z } from "zod";
import { ExperienceType } from "../enums";

export const experienceSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  type: z.enum(ExperienceType),
  title: z.string(),
  organization: z.string(),
  description: z.string(),
  startDate: z.coerce.date().nullable(),
  endDate: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createExperienceSchema = z
  .object({
    type: z.enum(ExperienceType),
    title: z.string().min(1),
    organization: z.string().min(1),
    description: z.string().min(1),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const updateExperienceSchema = z
  .object({
    type: z.enum(ExperienceType).optional(),
    title: z.string().min(1).optional(),
    organization: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type Experience = z.infer<typeof experienceSchema>;
export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;
