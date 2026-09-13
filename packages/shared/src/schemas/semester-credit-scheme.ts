import { z } from "zod";
import {
  ADMISSION_YEAR_MAX,
  ADMISSION_YEAR_MIN,
  SEMESTER_MAX,
  SEMESTER_MIN,
  TOTAL_CREDITS_MAX,
  TOTAL_CREDITS_MIN,
} from "../constants/limits";
import { Branch } from "../enums";
import { timestampFields } from "./common";

const semester = z.coerce.number().int().min(SEMESTER_MIN).max(SEMESTER_MAX);
const admissionYear = z.coerce
  .number()
  .int()
  .min(ADMISSION_YEAR_MIN)
  .max(ADMISSION_YEAR_MAX);
const totalCredits = z.coerce
  .number()
  .int()
  .min(TOTAL_CREDITS_MIN)
  .max(TOTAL_CREDITS_MAX);

export const semesterCreditSchemeSchema = z.object({
  id: z.string(),
  branch: z.enum(Branch),
  admissionYear,
  semester,
  totalCredits,
  ...timestampFields,
});

export const createSemesterCreditSchemeSchema = z.object({
  branch: z.enum(Branch),
  admissionYear,
  semester,
  totalCredits,
});

export const updateSemesterCreditSchemeSchema = z.object({
  totalCredits,
});

export const semesterCreditSchemeKeySchema =
  createSemesterCreditSchemeSchema.omit({ totalCredits: true });

export type SemesterCreditScheme = z.infer<typeof semesterCreditSchemeSchema>;
export type CreateSemesterCreditSchemeInput = z.infer<
  typeof createSemesterCreditSchemeSchema
>;
export type UpdateSemesterCreditSchemeInput = z.infer<
  typeof updateSemesterCreditSchemeSchema
>;
export type SemesterCreditSchemeKey = z.infer<
  typeof semesterCreditSchemeKeySchema
>;
