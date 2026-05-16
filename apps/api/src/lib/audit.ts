import { auditLogsTable } from "@aecfolio/db";
import { db } from "./db";

interface AuditLogParams {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(params: AuditLogParams) {
  await db.insert(auditLogsTable).values(params);
}
