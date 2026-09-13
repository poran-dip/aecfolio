import { z } from "zod";
import {
  freeTextDate,
  objectKey,
  reviewFields,
  softDeleteFields,
  timestampFields,
} from "./common";

export const certificationSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  name: z.string(),
  issuer: z.string(),
  issueDate: z.string().nullable(),
  credentialLink: z.string().nullable(),
  proofKey: z.string().nullable(),
  ...reviewFields,
  ...timestampFields,
  ...softDeleteFields,
});

export const createCertificationSchema = z.object({
  name: z.string().trim().min(1),
  issuer: z.string().trim().min(1),
  issueDate: freeTextDate.nullable().optional(),
  credentialLink: z.url().nullable().optional(),
  proofKey: objectKey.nullable().optional(),
});

export const updateCertificationSchema = createCertificationSchema.partial();

export type Certification = z.infer<typeof certificationSchema>;
export type CreateCertificationInput = z.infer<
  typeof createCertificationSchema
>;
export type UpdateCertificationInput = z.infer<
  typeof updateCertificationSchema
>;
