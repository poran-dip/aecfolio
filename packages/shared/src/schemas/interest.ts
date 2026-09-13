import { z } from "zod";
import { softDeleteFields, timestampFields } from "./common";

export const interestSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  ...timestampFields,
  ...softDeleteFields,
});

export const createInterestSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().nullable().optional(),
});

export const updateInterestSchema = createInterestSchema.partial();

export type Interest = z.infer<typeof interestSchema>;
export type CreateInterestInput = z.infer<typeof createInterestSchema>;
export type UpdateInterestInput = z.infer<typeof updateInterestSchema>;
