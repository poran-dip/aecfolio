import { z } from "zod";

export const auditLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  action: z.string(),
  entity: z.string(),
  entityId: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.coerce.date(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;
