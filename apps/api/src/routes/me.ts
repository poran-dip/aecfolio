import { studentsTable, usersTable } from "@aecfolio/db";
import {
  createStudentSchema,
  updateStudentSchema,
  updateUserSchema,
} from "@aecfolio/shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { createAuditLog } from "../lib/audit";
import { db } from "../lib/db";
import { fail, getUser, ok } from "../lib/response";
import { getStudentForUser } from "../lib/student";
import { requireRole } from "../middleware/role";
import type { AppEnv } from "../types/context";

const me = new Hono<AppEnv>();

me.get(
  "/",
  requireRole("STUDENT", "FACULTY", "PENDING", "ADMIN"),
  async (c) => {
    const user = getUser(c);

    const result = await db.query.usersTable.findFirst({
      where: (u, { and, eq, isNull }) =>
        and(eq(u.id, user.id), isNull(u.deletedAt)),
      with: { student: true, faculty: true },
    });

    if (!result) return fail(c, "NOT_FOUND", "User not found", 404);
    return ok(c, result);
  },
);

me.patch(
  "/",
  requireRole("STUDENT", "FACULTY"),
  zValidator("json", updateUserSchema),
  async (c) => {
    const user = getUser(c);
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

me.patch(
  "/student",
  requireRole("STUDENT"),
  zValidator("json", updateStudentSchema),
  async (c) => {
    const user = getUser(c);
    const body = c.req.valid("json");

    const student = await getStudentForUser(user.id);
    if (!student) return fail(c, "NOT_FOUND", "Student profile not found", 404);

    const [updated] = await db
      .update(studentsTable)
      .set(body)
      .where(eq(studentsTable.id, student.id))
      .returning();

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "Student",
      entityId: student.id,
    });
    return ok(c, updated);
  },
);

me.delete("/", requireRole("STUDENT", "FACULTY"), async (c) => {
  const user = getUser(c);

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
    const user = getUser(c);
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

me.get("/onboarding", requireRole("PENDING"), async (c) => {
  const user = getUser(c);

  const student = await db.query.studentsTable.findFirst({
    where: (s, { eq }) => eq(s.userId, user.id),
  });

  if (!student) return fail(c, "NOT_FOUND", "No onboarding data found", 404);
  return ok(c, student);
});

me.patch(
  "/onboarding",
  requireRole("PENDING"),
  zValidator("json", createStudentSchema),
  async (c) => {
    const user = getUser(c);
    const body = c.req.valid("json");

    const existing = await db.query.studentsTable.findFirst({
      where: (s, { eq }) => eq(s.userId, user.id),
    });
    if (!existing)
      return fail(c, "NOT_FOUND", "No onboarding data to update", 404);

    const rollConflict = await db.query.studentsTable.findFirst({
      where: (s, { and, eq, ne }) =>
        and(eq(s.rollNo, body.rollNo), ne(s.userId, user.id)),
    });
    if (rollConflict)
      return fail(c, "CONFLICT", "Roll number already in use", 409);

    const [updated] = await db
      .update(studentsTable)
      .set(body)
      .where(eq(studentsTable.userId, user.id))
      .returning();

    return ok(c, updated);
  },
);

export default me;
