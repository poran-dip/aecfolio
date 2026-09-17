import { auditLogsTable, usersTable } from "@aecfolio/db";
import { Capability } from "@aecfolio/shared";
import { and, count, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../lib/db";
import { paginationQuerySchema, toOffset, toPage } from "../lib/pagination";
import { paginated } from "../lib/response";
import { validate } from "../lib/validate";
import { requireCapability } from "../middleware/capability";
import type { AppEnv } from "../types/context";

const listQuerySchema = paginationQuerySchema.extend({
  userId: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const auditLogs = new Hono<AppEnv>().get(
  "/",
  requireCapability(Capability.AUDIT_READ),
  validate("query", listQuerySchema),
  async (c) => {
    const query = c.req.valid("query");

    const filters: SQL[] = [];
    if (query.userId) filters.push(eq(auditLogsTable.userId, query.userId));
    if (query.entity) filters.push(eq(auditLogsTable.entity, query.entity));
    if (query.entityId)
      filters.push(eq(auditLogsTable.entityId, query.entityId));
    if (query.action) filters.push(eq(auditLogsTable.action, query.action));
    if (query.from) filters.push(gte(auditLogsTable.createdAt, query.from));
    if (query.to) filters.push(lte(auditLogsTable.createdAt, query.to));

    const where = filters.length ? and(...filters) : undefined;
    const { limit, offset } = toOffset(query);

    const [items, [total]] = await Promise.all([
      db
        .select({
          id: auditLogsTable.id,
          userId: auditLogsTable.userId,
          action: auditLogsTable.action,
          entity: auditLogsTable.entity,
          entityId: auditLogsTable.entityId,
          metadata: auditLogsTable.metadata,
          createdAt: auditLogsTable.createdAt,
          actorName: usersTable.name,
          actorEmail: usersTable.email,
        })
        .from(auditLogsTable)
        .innerJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
        .where(where)
        .orderBy(desc(auditLogsTable.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(auditLogsTable).where(where),
    ]);

    return paginated(c, toPage(items, total?.value ?? 0, query));
  },
);

export default auditLogs;
