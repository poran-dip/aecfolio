import { z } from "zod";

export const achievementSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  title: z.string(),
  description: z.string(),
  proofImage: z.string().nullable(),
  verified: z.boolean(),
  verifiedBy: z.string().nullable(),
  verifiedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createAchievementSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  proofImage: z.url().optional(),
});

export const updateAchievementSchema = createAchievementSchema.partial();

// Faculty-only
export const verifyAchievementSchema = z.object({
  verified: z.literal(true),
});

export type Achievement = z.infer<typeof achievementSchema>;
export type CreateAchievementInput = z.infer<typeof createAchievementSchema>;
export type UpdateAchievementInput = z.infer<typeof updateAchievementSchema>;
export type VerifyAchievementInput = z.infer<typeof verifyAchievementSchema>;
