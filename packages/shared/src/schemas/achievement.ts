import { z } from "zod";
import {
  objectKey,
  reviewFields,
  softDeleteFields,
  timestampFields,
} from "./common";

export const achievementSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  title: z.string(),
  description: z.string(),
  proofKey: z.string().nullable(),
  ...reviewFields,
  ...timestampFields,
  ...softDeleteFields,
});

export const createAchievementSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  proofKey: objectKey.nullable().optional(),
});

export const updateAchievementSchema = createAchievementSchema.partial();

export type Achievement = z.infer<typeof achievementSchema>;
export type CreateAchievementInput = z.infer<typeof createAchievementSchema>;
export type UpdateAchievementInput = z.infer<typeof updateAchievementSchema>;
