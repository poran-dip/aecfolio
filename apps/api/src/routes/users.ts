import { usersTable } from "@aecfolio/db";
import {
  Capability,
  canChangeRole,
  canManageStaffWithRole,
  hasCapability,
  Role,
  STAFF_ROLES,
  setUserRoleSchema,
} from "@aecfolio/shared";
import { and, count, desc, eq, inArray, isNull, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { AuditAction, AuditEntity, createAuditLog } from "../lib/audit";
import { db } from "../lib/db";
import { paginationQuerySchema, toOffset, toPage } from "../lib/pagination";
import { fail, getUser, ok, paginated } from "../lib/response";
import { redirectToObject } from "../lib/uploads";
import { validate } from "../lib/validate";
import { requireAuth, requireCapability } from "../middleware/capability";
import type { AppEnv } from "../types/context";

const listQuerySchema = paginationQuerySchema.extend({
  role: z.enum(Role).optional(),
});

const users = new Hono<AppEnv>()
  .get("/:id/avatar", requireAuth(), async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");

    if (id !== user.id && !hasCapability(user.role, Capability.STUDENT_READ))
      return fail(c, "FORBIDDEN", "Forbidden", 403);

    const [row] = await db
      .select({ image: usersTable.image })
      .from(usersTable)
      .where(and(eq(usersTable.id, id), isNull(usersTable.deletedAt)))
      .limit(1);
    if (!row?.image) return fail(c, "NOT_FOUND", "No avatar", 404);

    return redirectToObject(c, row.image);
  })

  .get(
    "/",
    requireCapability(Capability.FACULTY_MANAGE),
    validate("query", listQuerySchema),
    async (c) => {
      const query = c.req.valid("query");

      const filters: SQL[] = [isNull(usersTable.deletedAt)];
      const roleFilter = query.role
        ? eq(usersTable.role, query.role)
        : inArray(usersTable.role, [...STAFF_ROLES]);
      filters.push(roleFilter);

      const where = and(...filters);
      const { limit, offset } = toOffset(query);

      const [items, [total]] = await Promise.all([
        db
          .select({
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            role: usersTable.role,
            banned: usersTable.banned,
            createdAt: usersTable.createdAt,
          })
          .from(usersTable)
          .where(where)
          .orderBy(desc(usersTable.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ value: count() }).from(usersTable).where(where),
      ]);

      return paginated(c, toPage(items, total?.value ?? 0, query));
    },
  )

  .patch(
    "/:id/role",
    requireCapability(
      Capability.ROLE_PROMOTE_FACULTY_TO_MOD,
      Capability.ROLE_DEMOTE_MOD_TO_FACULTY,
      Capability.ROLE_SET_ADMIN,
    ),
    validate("json", setUserRoleSchema),
    async (c) => {
      const actor = getUser(c);
      const id = c.req.param("id");
      const { role } = c.req.valid("json");

      const [target] = await db
        .select({ id: usersTable.id, role: usersTable.role })
        .from(usersTable)
        .where(and(eq(usersTable.id, id), isNull(usersTable.deletedAt)))
        .limit(1);
      if (!target) return fail(c, "NOT_FOUND", "User not found", 404);

      if (target.id === actor.id)
        return fail(c, "FORBIDDEN", "You cannot change your own role", 403);

      if (!canChangeRole(actor.role, target.role, role))
        return fail(
          c,
          "FORBIDDEN",
          `You cannot change a ${target.role} to ${role}`,
          403,
        );

      const [updated] = await db
        .update(usersTable)
        .set({ role })
        .where(eq(usersTable.id, id))
        .returning({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
          role: usersTable.role,
        });

      await createAuditLog({
        userId: actor.id,
        action: AuditAction.SET_ROLE,
        entity: AuditEntity.USER,
        entityId: id,
        metadata: { from: target.role, to: role },
      });
      return ok(c, updated);
    },
  )

  .delete("/:id", requireCapability(Capability.FACULTY_MANAGE), async (c) => {
    const actor = getUser(c);
    const id = c.req.param("id");

    const [target] = await db
      .select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable)
      .where(and(eq(usersTable.id, id), isNull(usersTable.deletedAt)))
      .limit(1);
    if (!target) return fail(c, "NOT_FOUND", "User not found", 404);

    if (target.id === actor.id)
      return fail(c, "FORBIDDEN", "You cannot delete your own account", 403);

    if (!canManageStaffWithRole(actor.role, target.role))
      return fail(
        c,
        "FORBIDDEN",
        `You cannot manage an account with the ${target.role} role`,
        403,
      );

    const [deleted] = await db
      .update(usersTable)
      .set({ deletedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning({ id: usersTable.id, deletedAt: usersTable.deletedAt });

    await createAuditLog({
      userId: actor.id,
      action: AuditAction.DELETE,
      entity: AuditEntity.USER,
      entityId: id,
    });
    return ok(c, deleted);
  });

export default users;
