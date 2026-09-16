import { z } from "zod";
import { CV_EXPORT_JOB_MAX_STUDENTS } from "../constants/limits";
import { CvExportJobStatus, CvExportKind } from "../enums";
import { timestampFields } from "./common";

export const BUILT_IN_CV_SECTION_TYPES = [
  "summary",
  "skills",
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

export const cvTemplateOptionsSchema = z.record(z.string(), z.unknown());

export type CvTemplateOptions = z.infer<typeof cvTemplateOptionsSchema>;

export const cvPreferenceSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  templateId: z.string(),
  sections: cvSectionsConfigSchema,
  options: cvTemplateOptionsSchema,
  ...timestampFields,
});

export const upsertCvPreferenceSchema = z.object({
  templateId: z.string().trim().min(1),
  sections: cvSectionsConfigSchema,
  options: cvTemplateOptionsSchema.optional().default({}),
});

export const cvExportSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  templateId: z.string(),
  kind: z.enum(CvExportKind),
  config: cvSectionsConfigSchema,
  options: cvTemplateOptionsSchema,
  checksum: z.string(),
  objectKey: z.string(),
  sizeBytes: z.number().int(),
  requestedBy: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const createSelfCvExportSchema = z.object({
  templateId: z.string().trim().min(1),
  sections: cvSectionsConfigSchema.optional(),
  options: cvTemplateOptionsSchema.optional(),
});

export const createStandardCvExportSchema = z.object({
  studentId: z.string().min(1),
});

export const createCvExportJobSchema = z.object({
  studentIds: z
    .array(z.string().min(1))
    .min(1)
    .max(CV_EXPORT_JOB_MAX_STUDENTS)
    .refine((ids) => new Set(ids).size === ids.length, "Duplicate student ids"),
});

export const cvExportJobSchema = z.object({
  id: z.string(),
  requestedBy: z.string(),
  status: z.enum(CvExportJobStatus),
  total: z.number().int(),
  completed: z.number().int(),
  failed: z.number().int(),
  error: z.string().nullable(),
  createdAt: z.coerce.date(),
  startedAt: z.coerce.date().nullable(),
  finishedAt: z.coerce.date().nullable(),
});

export type CvPreference = z.infer<typeof cvPreferenceSchema>;
export type UpsertCvPreferenceInput = z.infer<typeof upsertCvPreferenceSchema>;
export type CvExport = z.infer<typeof cvExportSchema>;
export type CreateSelfCvExportInput = z.infer<typeof createSelfCvExportSchema>;
export type CreateStandardCvExportInput = z.infer<
  typeof createStandardCvExportSchema
>;
export type CreateCvExportJobInput = z.infer<typeof createCvExportJobSchema>;
export type CvExportJob = z.infer<typeof cvExportJobSchema>;
