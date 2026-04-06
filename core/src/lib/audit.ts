import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "VERIFY";

interface CreateAuditLogParams {
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  metadata?: Prisma.JsonObject;
}

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  metadata,
}: CreateAuditLogParams) {
  await prisma.auditLog.create({
    data: { userId, action, entity, entityId, metadata },
  });
}
