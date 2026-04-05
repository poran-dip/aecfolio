import { prisma } from "@/lib/prisma";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "VERIFY";

interface CreateAuditLogParams {
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  metadata,
}: CreateAuditLogParams) {
  await prisma.auditLog.create({
    data: { userId, action, entity, entityId, metadata: metadata as any },
  });
}
