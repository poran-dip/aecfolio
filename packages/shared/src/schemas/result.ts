import { z } from "zod";
import {
  SEMESTER_MAX,
  SEMESTER_MIN,
  SGPA_MAX,
  SGPA_MIN,
} from "../constants/limits";
import { reviewFields, softDeleteFields, timestampFields } from "./common";

const semester = z.number().int().min(SEMESTER_MIN).max(SEMESTER_MAX);
const sgpa = z.number().min(SGPA_MIN).max(SGPA_MAX);

export const resultSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  semester,
  schemeId: z.string(),
  sgpa: sgpa.nullable(),
  pendingSgpa: sgpa.nullable(),
  ...reviewFields,
  ...timestampFields,
  ...softDeleteFields,
});

export const createResultSchema = z.object({
  semester,
  pendingSgpa: sgpa,
});

export const updateResultSchema = z.object({
  pendingSgpa: sgpa.optional(),
});

export type Result = z.infer<typeof resultSchema>;
export type CreateResultInput = z.infer<typeof createResultSchema>;
export type UpdateResultInput = z.infer<typeof updateResultSchema>;
