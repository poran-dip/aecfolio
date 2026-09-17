import { projectsTable } from "@aecfolio/db";
import {
  Capability,
  createProjectSchema,
  updateProjectSchema,
} from "@aecfolio/shared";
import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { AuditAction, AuditEntity, createAuditLog, diff } from "../lib/audit";
import { db } from "../lib/db";
import { resolveOwnStudent, resolveReadScope } from "../lib/ownership";
import { fail, getUser, ok } from "../lib/response";
import { validate } from "../lib/validate";
import { requireAuth, requireCapability } from "../middleware/capability";
import type { AppEnv } from "../types/context";

async function findOwned(id: string, studentId: string) {
  const [row] = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.id, id), isNull(projectsTable.deletedAt)))
    .limit(1);
  if (!row) return { row: null, owned: false };
  return { row, owned: row.studentId === studentId };
}

const projects = new Hono<AppEnv>()
  .get("/", requireAuth(), async (c) => {
    const user = getUser(c);
    const scope = await resolveReadScope(c, user, c.req.query("studentId"));
    if (!scope.ok) return scope.response;

    const rows = await db
      .select()
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.studentId, scope.studentId),
          isNull(projectsTable.deletedAt),
        ),
      );

    return ok(c, rows);
  })

  .post(
    "/",
    requireCapability(Capability.PROFILE_WRITE_SELF),
    validate("json", createProjectSchema),
    async (c) => {
      const user = getUser(c);
      const body = c.req.valid("json");

      const scope = await resolveOwnStudent(c, user);
      if (!scope.ok) return scope.response;

      const [row] = await db
        .insert(projectsTable)
        .values({ ...body, studentId: scope.studentId })
        .returning();

      await createAuditLog({
        userId: user.id,
        action: AuditAction.CREATE,
        entity: AuditEntity.PROJECT,
        entityId: row.id,
      });
      return ok(c, row, 201);
    },
  )

  .get("/:id", requireAuth(), async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");

    const [row] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, id), isNull(projectsTable.deletedAt)))
      .limit(1);
    if (!row) return fail(c, "NOT_FOUND", "Project not found", 404);

    const scope = await resolveReadScope(c, user, row.studentId);
    if (!scope.ok) return scope.response;

    return ok(c, row);
  })

  .patch(
    "/:id",
    requireCapability(Capability.PROFILE_WRITE_SELF),
    validate("json", updateProjectSchema),
    async (c) => {
      const user = getUser(c);
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const scope = await resolveOwnStudent(c, user);
      if (!scope.ok) return scope.response;

      const { row, owned } = await findOwned(id, scope.studentId);
      if (!row) return fail(c, "NOT_FOUND", "Project not found", 404);
      if (!owned) return fail(c, "FORBIDDEN", "Forbidden", 403);

      const [updated] = await db
        .update(projectsTable)
        .set(body)
        .where(eq(projectsTable.id, id))
        .returning();

      await createAuditLog({
        userId: user.id,
        action: AuditAction.UPDATE,
        entity: AuditEntity.PROJECT,
        entityId: id,
        metadata: diff(row, updated),
      });
      return ok(c, updated);
    },
  )

  .delete(
    "/:id",
    requireCapability(Capability.PROFILE_WRITE_SELF),
    async (c) => {
      const user = getUser(c);
      const id = c.req.param("id");

      const scope = await resolveOwnStudent(c, user);
      if (!scope.ok) return scope.response;

      const { row, owned } = await findOwned(id, scope.studentId);
      if (!row) return fail(c, "NOT_FOUND", "Project not found", 404);
      if (!owned) return fail(c, "FORBIDDEN", "Forbidden", 403);

      const [deleted] = await db
        .update(projectsTable)
        .set({ deletedAt: new Date() })
        .where(eq(projectsTable.id, id))
        .returning();

      await createAuditLog({
        userId: user.id,
        action: AuditAction.DELETE,
        entity: AuditEntity.PROJECT,
        entityId: id,
      });
      return ok(c, deleted);
    },
  );

export default projects;
