import type { SQL } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../lib/db";
import { ok } from "../lib/response";
import { requireRole } from "../middleware/role";

const auditLogs = new Hono();

auditLogs.get("/", requireRole("FACULTY"), async (c) => {
  const userId = c.req.query("userId");
  const entity = c.req.query("entity");
  const entityId = c.req.query("entityId");

  const result = await db.query.auditLogsTable.findMany({
    where: (log, { and, eq }) => {
      const conditions: SQL[] = [];
      if (userId) conditions.push(eq(log.userId, userId));
      if (entity) conditions.push(eq(log.entity, entity));
      if (entityId) conditions.push(eq(log.entityId, entityId));
      return conditions.length
        ? and(...(conditions as [SQL, ...SQL[]]))
        : undefined;
    },
    orderBy: (log, { desc }) => desc(log.createdAt),
  });

  return ok(c, result);
});

export default auditLogs;
