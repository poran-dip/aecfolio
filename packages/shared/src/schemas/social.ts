import { z } from "zod";
import { SocialType } from "../enums";

export const socialSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  type: z.enum(SocialType),
  url: z.url(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createSocialSchema = z.object({
  type: z.enum(SocialType),
  url: z.string().url(),
});

export const updateSocialSchema = z.object({
  url: z.url(),
});

export type Social = z.infer<typeof socialSchema>;
export type CreateSocialInput = z.infer<typeof createSocialSchema>;
export type UpdateSocialInput = z.infer<typeof updateSocialSchema>;
