import { z } from "zod";
import {
  SEMESTER_MAX,
  SEMESTER_MIN,
  SGPA_MAX,
  SGPA_MIN,
} from "../constants/limits";

export const resultSchema = z.object({
  id: z.string(),
  studentId: z.string().nullable(),
  semester: z.number().int().min(SEMESTER_MIN).max(SEMESTER_MAX),
  sgpa: z.number().min(SGPA_MIN).max(SGPA_MAX).nullable(),
  pendingSgpa: z.number().min(SGPA_MIN).max(SGPA_MAX).nullable(),
  verified: z.boolean(),
  verifiedBy: z.string().nullable(),
  verifiedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createResultSchema = z.object({
  semester: z.number().int().min(SEMESTER_MIN).max(SEMESTER_MAX),
  sgpa: z.number().min(SGPA_MIN).max(SGPA_MAX).optional(),
  pendingSgpa: z.number().min(SGPA_MIN).max(SGPA_MAX).optional(),
});

export const updateResultSchema = createResultSchema.partial();

// Faculty-only
export const verifyResultSchema = z.object({
  verified: z.literal(true),
});

export type Result = z.infer<typeof resultSchema>;
export type CreateResultInput = z.infer<typeof createResultSchema>;
export type UpdateResultInput = z.infer<typeof updateResultSchema>;
export type VerifyResultInput = z.infer<typeof verifyResultSchema>;
