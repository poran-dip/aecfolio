import { z } from "zod";
import { FREE_TEXT_DATE_MAX } from "../constants/limits";
import { VerificationStatus } from "../enums";

export const freeTextDate = z.string().trim().min(1).max(FREE_TEXT_DATE_MAX);

export const objectKey = z.string().trim().min(1).max(512);

export const reviewFields = {
  status: z.enum(VerificationStatus),
  rejectionReason: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.coerce.date().nullable(),
};

export const timestampFields = {
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
};

export const softDeleteFields = {
  deletedAt: z.coerce.date().nullable(),
};

export const reviewDecisionSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal(VerificationStatus.VERIFIED) }),
  z.object({
    status: z.literal(VerificationStatus.REJECTED),
    rejectionReason: z.string().trim().min(1),
  }),
]);

export type ReviewDecisionInput = z.infer<typeof reviewDecisionSchema>;

export const bulkReviewSchema = z.object({
  ids: z.array(z.string()).min(1),
  decision: reviewDecisionSchema,
});

export type BulkReviewInput = z.infer<typeof bulkReviewSchema>;
