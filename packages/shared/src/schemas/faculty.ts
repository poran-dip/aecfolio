import { z } from "zod";
import { Branch } from "../enums";
import { softDeleteFields, timestampFields } from "./common";

export const facultySchema = z.object({
  id: z.string(),
  userId: z.string(),
  employeeId: z.string(),
  designation: z.string().nullable(),
  department: z.enum(Branch).nullable(),
  ...timestampFields,
  ...softDeleteFields,
});

export const createFacultySchema = z.object({
  employeeId: z.string().trim().min(1),
  designation: z.string().trim().nullable().optional(),
  department: z.enum(Branch).nullable().optional(),
});

export const updateFacultySchema = createFacultySchema.partial();

export type Faculty = z.infer<typeof facultySchema>;
export type CreateFacultyInput = z.infer<typeof createFacultySchema>;
export type UpdateFacultyInput = z.infer<typeof updateFacultySchema>;
