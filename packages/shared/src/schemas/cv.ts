import { z } from "zod";
import { timestampFields } from "./common";

export const BUILT_IN_CV_SECTION_TYPES = [
  "experiences",
  "projects",
  "achievements",
  "certifications",
  "interests",
  "socials",
  "results",
] as const;

export type BuiltInCvSectionType = (typeof BUILT_IN_CV_SECTION_TYPES)[number];

const sectionCommon = {
  include: z.boolean(),
  order: z.number().int().min(0),
  entryOrder: z.array(z.string()).default([]),
};

export const cvSectionPreferenceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.enum(BUILT_IN_CV_SECTION_TYPES),
    ...sectionCommon,
  }),
  z.object({
    type: z.literal("custom"),
    customSectionId: z.string().min(1),
    ...sectionCommon,
  }),
]);

export type CvSectionPreference = z.infer<typeof cvSectionPreferenceSchema>;

export const cvSectionsConfigSchema = z
  .array(cvSectionPreferenceSchema)
  .superRefine((sections, ctx) => {
    const seen = new Set<string>();
    for (const [i, section] of sections.entries()) {
      const key =
        section.type === "custom"
          ? `custom:${section.customSectionId}`
          : section.type;
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate section: ${key}`,
          path: [i, "type"],
        });
      }
      seen.add(key);
    }
  });

export type CvSectionsConfig = z.infer<typeof cvSectionsConfigSchema>;

export const cvPreferenceSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  templateId: z.string(),
  sections: cvSectionsConfigSchema,
  ...timestampFields,
});

export const upsertCvPreferenceSchema = z.object({
  templateId: z.string().trim().min(1),
  sections: cvSectionsConfigSchema,
});

export const cvExportSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  templateId: z.string(),
  config: cvSectionsConfigSchema,
  objectKey: z.string(),
  createdAt: z.coerce.date(),
});

export type CvPreference = z.infer<typeof cvPreferenceSchema>;
export type UpsertCvPreferenceInput = z.infer<typeof upsertCvPreferenceSchema>;
export type CvExport = z.infer<typeof cvExportSchema>;
