import { z } from "zod";
import { freeTextDate, softDeleteFields, timestampFields } from "./common";

export const customSectionSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  name: z.string(),
  ...timestampFields,
  ...softDeleteFields,
});

export const createCustomSectionSchema = z.object({
  name: z.string().trim().min(1),
});

export const updateCustomSectionSchema = createCustomSectionSchema.partial();

export const customSectionEntrySchema = z.object({
  id: z.string(),
  customSectionId: z.string(),
  title: z.string(),
  org: z.string().nullable(),
  date: z.string().nullable(),
  body: z.string().nullable(),
  ...timestampFields,
  ...softDeleteFields,
});

export const createCustomSectionEntrySchema = z.object({
  title: z.string().trim().min(1),
  org: z.string().trim().nullable().optional(),
  date: freeTextDate.nullable().optional(),
  /** Markdown. */
  body: z.string().nullable().optional(),
});

export const updateCustomSectionEntrySchema =
  createCustomSectionEntrySchema.partial();

export type CustomSection = z.infer<typeof customSectionSchema>;
export type CreateCustomSectionInput = z.infer<
  typeof createCustomSectionSchema
>;
export type UpdateCustomSectionInput = z.infer<
  typeof updateCustomSectionSchema
>;
export type CustomSectionEntry = z.infer<typeof customSectionEntrySchema>;
export type CreateCustomSectionEntryInput = z.infer<
  typeof createCustomSectionEntrySchema
>;
export type UpdateCustomSectionEntryInput = z.infer<
  typeof updateCustomSectionEntrySchema
>;
