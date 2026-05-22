import { z } from "zod";
import {
  CGPA_MAX,
  CGPA_MIN,
  SEMESTER_MAX,
  SEMESTER_MIN,
} from "../constants/limits";
import { Branch, Course } from "../enums";

export const studentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  rollNo: z.string(),
  course: z.enum(Course),
  branch: z.enum(Branch),
  semester: z.number().int().min(SEMESTER_MIN).max(SEMESTER_MAX),
  bio: z.string().nullable(),
  skills: z.array(z.string()),
  cgpa: z.number().min(CGPA_MIN).max(CGPA_MAX).nullable(),
  motherName: z.string().nullable(),
  fatherName: z.string().nullable(),
  location: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createStudentSchema = z.object({
  rollNo: z.string().min(1),
  course: z.enum(Course),
  branch: z.enum(Branch),
  semester: z.coerce.number().int().min(SEMESTER_MIN).max(SEMESTER_MAX),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  cgpa: z.coerce.number().min(CGPA_MIN).max(CGPA_MAX).optional(),
  motherName: z.string().optional(),
  fatherName: z.string().optional(),
  location: z.string().optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

export type Student = z.infer<typeof studentSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
