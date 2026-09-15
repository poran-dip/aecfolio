import { z } from "zod";

export const standardOptionsSchema = z.object({
  accent: z.enum(["turquoise", "red", "ink"]).default("turquoise"),
  density: z.enum(["comfortable", "compact"]).default("comfortable"),
  showPhoto: z.boolean().default(true),
  showLanguages: z.boolean().default(true),
  showLocation: z.boolean().default(true),
  showSemesterResults: z.boolean().default(false),
  contactColumns: z.union([z.literal(2), z.literal(3)]).default(3),
});

export type StandardOptions = z.infer<typeof standardOptionsSchema>;
