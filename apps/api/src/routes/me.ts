import { studentsTable, usersTable } from "@aecfolio/db";
import { createStudentSchema, updateUserSchema } from "@aecfolio/shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { createAuditLog } from "../lib/audit";
import { db } from "../lib/db";
import { fail, ok } from "../lib/response";
import type { SessionUser } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import type { AppEnv } from "../types/context";

const me = new Hono<AppEnv>();

me.get("/", requireRole("STUDENT", "FACULTY"), async (c) => {
  const user = c.get("user") as SessionUser;

  const result = await db.query.usersTable.findFirst({
    where: (u, { and, eq, isNull }) =>
      and(eq(u.id, user.id), isNull(u.deletedAt)),
    with: { student: true, faculty: true },
  });

  if (!result) return fail(c, "NOT_FOUND", "User not found", 404);
  return ok(c, result);
});

me.patch(
  "/",
  requireRole("STUDENT", "FACULTY"),
  zValidator("json", updateUserSchema),
  async (c) => {
    const user = c.get("user") as SessionUser;
    const body = c.req.valid("json");

    const [updated] = await db
      .update(usersTable)
      .set(body)
      .where(eq(usersTable.id, user.id))
      .returning();

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "User",
      entityId: user.id,
    });
    return ok(c, updated);
  },
);

me.delete("/", requireRole("STUDENT", "FACULTY"), async (c) => {
  const user = c.get("user") as SessionUser;

  const [deleted] = await db
    .update(usersTable)
    .set({ deletedAt: new Date() })
    .where(eq(usersTable.id, user.id))
    .returning();

  await createAuditLog({
    userId: user.id,
    action: "DELETE",
    entity: "User",
    entityId: user.id,
  });
  return ok(c, deleted);
});

me.post(
  "/onboarding",
  requireRole("PENDING"),
  zValidator("json", createStudentSchema),
  async (c) => {
    const user = c.get("user") as SessionUser;
    const body = c.req.valid("json");

    const existing = await db.query.studentsTable.findFirst({
      where: (s, { eq }) => eq(s.userId, user.id),
    });
    if (existing)
      return fail(c, "CONFLICT", "Onboarding already completed", 409);

    const rollConflict = await db.query.studentsTable.findFirst({
      where: (s, { eq }) => eq(s.rollNo, body.rollNo),
    });
    if (rollConflict)
      return fail(c, "CONFLICT", "Roll number already in use", 409);

    const [student] = await db
      .insert(studentsTable)
      .values({ userId: user.id, skills: [], ...body })
      .returning();

    return ok(c, student, 201);
  },
);

export default me;
