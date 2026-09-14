import { auditLogsTable, facultyTable, usersTable } from "@aecfolio/db";
import {
  Branch,
  createFacultySchema,
  Role,
  updateFacultySchema,
} from "@aecfolio/shared";
import { and, count, desc, eq, isNull, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { AuditAction, AuditEntity, createAuditLog, diff } from "../lib/audit";
import { Capability, canManageStaffWithRole } from "../lib/capabilities";
import { db } from "../lib/db";
import { constraintOf, pgMessage } from "../lib/db-error";
import { paginationQuerySchema, toOffset, toPage } from "../lib/pagination";
import { fail, getUser, ok, paginated } from "../lib/response";
import { validate } from "../lib/validate";
import { requireCapability } from "../middleware/capability";
import type { AppEnv } from "../types/context";

const STAFF_ROLE_VALUES = [Role.FACULTY, Role.MOD, Role.ADMIN] as const;

const listQuerySchema = paginationQuerySchema.extend({
  role: z.enum(STAFF_ROLE_VALUES).optional(),
  department: z.enum(Branch).optional(),
});

const createFacultyAccountSchema = createFacultySchema.extend({
  name: z.string().trim().min(1),
  email: z.email(),
  role: z.enum(STAFF_ROLE_VALUES).default(Role.FACULTY),
});

function describeFailure(error: unknown) {
  switch (constraintOf(error)) {
    case "users_email_unique":
      return "Email already in use";
    case "faculty_employee_id_unique":
      return "Employee ID already in use";
    case "faculty_user_id_unique":
      return "That user already has a faculty record";
    default:
      return pgMessage(error);
  }
}

async function findStaff(id: string) {
  const [row] = await db
    .select({
      id: facultyTable.id,
      userId: facultyTable.userId,
      employeeId: facultyTable.employeeId,
      designation: facultyTable.designation,
      department: facultyTable.department,
      createdAt: facultyTable.createdAt,
      updatedAt: facultyTable.updatedAt,
      role: usersTable.role,
      name: usersTable.name,
      email: usersTable.email,
    })
    .from(facultyTable)
    .innerJoin(usersTable, eq(facultyTable.userId, usersTable.id))
    .where(and(eq(facultyTable.id, id), isNull(facultyTable.deletedAt)))
    .limit(1);
  return row ?? null;
}

const faculty = new Hono<AppEnv>()
  .get(
    "/",
    requireCapability(Capability.FACULTY_MANAGE),
    validate("query", listQuerySchema),
    async (c) => {
      const query = c.req.valid("query");

      const filters: SQL[] = [
        isNull(facultyTable.deletedAt),
        isNull(usersTable.deletedAt),
      ];
      if (query.role) filters.push(eq(usersTable.role, query.role));
      if (query.department)
        filters.push(eq(facultyTable.department, query.department));

      const where = and(...filters);
      const { limit, offset } = toOffset(query);

      const [items, [total]] = await Promise.all([
        db
          .select({
            id: facultyTable.id,
            userId: facultyTable.userId,
            employeeId: facultyTable.employeeId,
            designation: facultyTable.designation,
            department: facultyTable.department,
            role: usersTable.role,
            name: usersTable.name,
            email: usersTable.email,
          })
          .from(facultyTable)
          .innerJoin(usersTable, eq(facultyTable.userId, usersTable.id))
          .where(where)
          .orderBy(desc(facultyTable.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ value: count() })
          .from(facultyTable)
          .innerJoin(usersTable, eq(facultyTable.userId, usersTable.id))
          .where(where),
      ]);

      return paginated(c, toPage(items, total?.value ?? 0, query));
    },
  )

  .post(
    "/",
    requireCapability(Capability.FACULTY_MANAGE),
    validate("json", createFacultyAccountSchema),
    async (c) => {
      const user = getUser(c);
      const body = c.req.valid("json");

      if (!canManageStaffWithRole(user.role, body.role))
        return fail(
          c,
          "FORBIDDEN",
          `You cannot create an account with the ${body.role} role`,
          403,
        );

      try {
        const created = await db.transaction(async (tx) => {
          const [account] = await tx
            .insert(usersTable)
            .values({
              name: body.name,
              email: body.email,
              emailVerified: true,
              role: body.role,
            })
            .returning({ id: usersTable.id });

          const [record] = await tx
            .insert(facultyTable)
            .values({
              userId: account.id,
              employeeId: body.employeeId,
              designation: body.designation ?? null,
              department: body.department ?? null,
            })
            .returning();

          await tx.insert(auditLogsTable).values({
            userId: user.id,
            action: AuditAction.CREATE,
            entity: AuditEntity.FACULTY,
            entityId: record.id,
            metadata: { role: body.role, email: body.email },
          });

          return record;
        });

        return ok(c, created, 201);
      } catch (error) {
        return fail(c, "CONFLICT", describeFailure(error), 409);
      }
    },
  )

  .get("/:id", requireCapability(Capability.FACULTY_MANAGE), async (c) => {
    const row = await findStaff(c.req.param("id"));
    if (!row) return fail(c, "NOT_FOUND", "Faculty not found", 404);
    return ok(c, row);
  })

  .patch(
    "/:id",
    requireCapability(Capability.FACULTY_MANAGE),
    validate("json", updateFacultySchema),
    async (c) => {
      const user = getUser(c);
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const existing = await findStaff(id);
      if (!existing) return fail(c, "NOT_FOUND", "Faculty not found", 404);

      if (!canManageStaffWithRole(user.role, existing.role))
        return fail(
          c,
          "FORBIDDEN",
          `You cannot manage an account with the ${existing.role} role`,
          403,
        );

      try {
        const [updated] = await db
          .update(facultyTable)
          .set(body)
          .where(eq(facultyTable.id, id))
          .returning();

        await createAuditLog({
          userId: user.id,
          action: AuditAction.UPDATE,
          entity: AuditEntity.FACULTY,
          entityId: id,
          metadata: diff(existing, updated),
        });
        return ok(c, updated);
      } catch (error) {
        return fail(c, "CONFLICT", describeFailure(error), 409);
      }
    },
  )

  .delete("/:id", requireCapability(Capability.FACULTY_MANAGE), async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");

    const existing = await findStaff(id);
    if (!existing) return fail(c, "NOT_FOUND", "Faculty not found", 404);

    if (!canManageStaffWithRole(user.role, existing.role))
      return fail(
        c,
        "FORBIDDEN",
        `You cannot manage an account with the ${existing.role} role`,
        403,
      );

    if (existing.userId === user.id)
      return fail(c, "FORBIDDEN", "You cannot delete your own account", 403);

    const [deleted] = await db
      .update(facultyTable)
      .set({ deletedAt: new Date() })
      .where(eq(facultyTable.id, id))
      .returning();

    await createAuditLog({
      userId: user.id,
      action: AuditAction.DELETE,
      entity: AuditEntity.FACULTY,
      entityId: id,
    });
    return ok(c, deleted);
  });

export default faculty;
