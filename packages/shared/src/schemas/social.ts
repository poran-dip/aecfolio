import { z } from "zod";
import { softDeleteFields, timestampFields } from "./common";

export const socialSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  title: z.string(),
  url: z.string(),
  ...timestampFields,
  ...softDeleteFields,
});

export const createSocialSchema = z.object({
  title: z.string().trim().min(1),
  url: z.url({ protocol: /^https?$/ }),
});

export const updateSocialSchema = createSocialSchema.partial();

export type Social = z.infer<typeof socialSchema>;
export type CreateSocialInput = z.infer<typeof createSocialSchema>;
export type UpdateSocialInput = z.infer<typeof updateSocialSchema>;
