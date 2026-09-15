import { z } from "zod";
import { AVATAR_MAX_BYTES, PROOF_MAX_BYTES } from "../constants/limits";

export const UploadPurpose = {
  PROOF: "proof",
  AVATAR: "avatar",
} as const;

export type UploadPurpose = (typeof UploadPurpose)[keyof typeof UploadPurpose];

export const UPLOAD_RULES = {
  [UploadPurpose.PROOF]: {
    contentTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    maxBytes: PROOF_MAX_BYTES,
  },
  [UploadPurpose.AVATAR]: {
    contentTypes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: AVATAR_MAX_BYTES,
  },
} as const satisfies Record<
  UploadPurpose,
  { contentTypes: readonly string[]; maxBytes: number }
>;

export type UploadContentType =
  (typeof UPLOAD_RULES)[UploadPurpose]["contentTypes"][number];

export const createUploadSchema = z
  .object({
    purpose: z.enum(UploadPurpose),
    contentType: z.string().trim().toLowerCase(),
    size: z.number().int().positive(),
  })
  .superRefine((input, ctx) => {
    const rules = UPLOAD_RULES[input.purpose];
    if (!(rules.contentTypes as readonly string[]).includes(input.contentType))
      ctx.addIssue({
        code: "custom",
        path: ["contentType"],
        message: `A ${input.purpose} must be one of: ${rules.contentTypes.join(", ")}`,
      });
    if (input.size > rules.maxBytes)
      ctx.addIssue({
        code: "custom",
        path: ["size"],
        message: `A ${input.purpose} can be at most ${rules.maxBytes} bytes`,
      });
  });

export const uploadTicketSchema = z.object({
  key: z.string(),
  url: z.url(),
  method: z.literal("PUT"),
  headers: z.record(z.string(), z.string()),
  expiresAt: z.coerce.date(),
});

export type CreateUploadInput = z.infer<typeof createUploadSchema>;
export type UploadTicket = z.infer<typeof uploadTicketSchema>;
