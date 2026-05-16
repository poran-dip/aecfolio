import { z } from "zod";
import { Branch } from "../enums";

export const facultySchema = z.object({
  id: z.string(),
  userId: z.string(),
  employeeId: z.string(),
  designation: z.string().nullable(),
  department: z.enum(Branch).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createFacultySchema = z.object({
  employeeId: z.string().min(1),
  designation: z.string().optional(),
  department: z.enum(Branch).optional(),
});

export const updateFacultySchema = createFacultySchema.partial();

export type Faculty = z.infer<typeof facultySchema>;
export type CreateFacultyInput = z.infer<typeof createFacultySchema>;
export type UpdateFacultyInput = z.infer<typeof updateFacultySchema>;
