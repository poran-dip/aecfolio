import { z } from "zod";
import {
  ADMISSION_YEAR_MAX,
  ADMISSION_YEAR_MIN,
  CGPA_MAX,
  CGPA_MIN,
  SEMESTER_MAX,
  SEMESTER_MIN,
} from "../constants/limits";
import { Branch, Course, StudentStatus } from "../enums";
import { freeTextDate, softDeleteFields, timestampFields } from "./common";

const semester = z.coerce.number().int().min(SEMESTER_MIN).max(SEMESTER_MAX);
const admissionYear = z.coerce
  .number()
  .int()
  .min(ADMISSION_YEAR_MIN)
  .max(ADMISSION_YEAR_MAX);

export const studentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  rollNo: z.string(),
  course: z.enum(Course),
  branch: z.enum(Branch),
  semester,
  status: z.enum(StudentStatus),
  admissionYear,
  bio: z.string().nullable(),
  skills: z.array(z.string()),
  cgpa: z.number().min(CGPA_MIN).max(CGPA_MAX).nullable(),
  titleSought: z.string().nullable(),
  dob: z.string().nullable(),
  gender: z.string().nullable(),
  caste: z.string().nullable(),
  religion: z.string().nullable(),
  spokenLanguages: z.array(z.string()),
  motherName: z.string().nullable(),
  motherContact: z.string().nullable(),
  fatherName: z.string().nullable(),
  fatherContact: z.string().nullable(),
  location: z.string().nullable(),
  ...timestampFields,
  ...softDeleteFields,
});

export const createStudentSchema = z.object({
  rollNo: z.string().trim().min(1),
  course: z.enum(Course),
  branch: z.enum(Branch),
  semester,
  admissionYear,
  status: z.enum(StudentStatus).optional(),
});

export const updateStudentProfileSchema = z.object({
  bio: z.string().nullable().optional(),
  skills: z.array(z.string().trim().min(1)).optional(),
  titleSought: z.string().nullable().optional(),
  dob: freeTextDate.nullable().optional(),
  gender: z.string().nullable().optional(),
  caste: z.string().nullable().optional(),
  religion: z.string().nullable().optional(),
  spokenLanguages: z.array(z.string().trim().min(1)).optional(),
  motherName: z.string().nullable().optional(),
  motherContact: z.string().nullable().optional(),
  fatherName: z.string().nullable().optional(),
  fatherContact: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
});

export const updateStudentSchema = createStudentSchema
  .partial()
  .extend(updateStudentProfileSchema.shape);

export type Student = z.infer<typeof studentSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type UpdateStudentProfileInput = z.infer<
  typeof updateStudentProfileSchema
>;
