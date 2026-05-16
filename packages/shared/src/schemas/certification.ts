import { z } from "zod";

export const certificationSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  name: z.string(),
  issuer: z.string(),
  issueDate: z.coerce.date().nullable(),
  proofImage: z.string().nullable(),
  verified: z.boolean(),
  verifiedBy: z.string().nullable(),
  verifiedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createCertificationSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().min(1),
  issueDate: z.coerce.date().optional(),
  proofImage: z.url().optional(),
});

export const updateCertificationSchema = createCertificationSchema.partial();

// Faculty-only
export const verifyCertificationSchema = z.object({
  verified: z.literal(true),
});

export type Certification = z.infer<typeof certificationSchema>;
export type CreateCertificationInput = z.infer<
  typeof createCertificationSchema
>;
export type UpdateCertificationInput = z.infer<
  typeof updateCertificationSchema
>;
export type VerifyCertificationInput = z.infer<
  typeof verifyCertificationSchema
>;
