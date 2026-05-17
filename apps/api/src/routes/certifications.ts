import { certificationsTable } from "@aecfolio/db";
import {
  createCertificationSchema,
  updateCertificationSchema,
} from "@aecfolio/shared";
import { zValidator } from "@hono/zod-validator";
import { eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createAuditLog } from "../lib/audit";
import { db } from "../lib/db";
import { fail, getUser, ok } from "../lib/response";
import { getStudentForUser } from "../lib/student";
import { requireRole } from "../middleware/role";

const certifications = new Hono();

certifications.get("/", requireRole("STUDENT", "FACULTY"), async (c) => {
  const user = getUser(c);
  const paramStudentId = c.req.query("studentId");

  let studentId: string | null = null;

  if (user.role === "FACULTY" && paramStudentId) {
    studentId = paramStudentId;
  } else if (user.role === "STUDENT") {
    const student = await getStudentForUser(user.id);
    if (!student) return fail(c, "NOT_FOUND", "Student profile not found", 404);
    studentId = student.id;
  }

  const result = await db.query.certificationsTable.findMany({
    where: (a, { and, isNull, eq }) =>
      studentId
        ? and(isNull(a.deletedAt), eq(a.studentId, studentId))
        : isNull(a.deletedAt),
  });

  return ok(c, result);
});

certifications.post(
  "/",
  requireRole("STUDENT"),
  zValidator("json", createCertificationSchema),
  async (c) => {
    const user = getUser(c);
    const body = c.req.valid("json");

    const student = await getStudentForUser(user.id);
    if (!student) return fail(c, "NOT_FOUND", "Student profile not found", 404);

    const [achievement] = await db
      .insert(certificationsTable)
      .values({ ...body, studentId: student.id })
      .returning();
    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "Achievement",
      entityId: achievement.id,
    });
    return ok(c, achievement, 201);
  },
);

certifications.patch(
  "/verify",
  requireRole("FACULTY"),
  zValidator("json", z.object({ ids: z.array(z.string()).min(1) })),
  async (c) => {
    const user = getUser(c);
    const { ids } = c.req.valid("json");

    await db
      .update(certificationsTable)
      .set({ verified: true, verifiedBy: user.id, verifiedAt: new Date() })
      .where(inArray(certificationsTable.id, ids));

    await Promise.all(
      ids.map((id) =>
        createAuditLog({
          userId: user.id,
          action: "VERIFY",
          entity: "Achievement",
          entityId: id,
        }),
      ),
    );
    return ok(c, { verified: ids.length });
  },
);

certifications.get("/:id", requireRole("STUDENT", "FACULTY"), async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  const achievement = await db.query.certificationsTable.findFirst({
    where: (a, { and, eq, isNull }) => and(eq(a.id, id), isNull(a.deletedAt)),
  });
  if (!achievement) return fail(c, "NOT_FOUND", "Achievement not found", 404);

  if (user.role === "STUDENT") {
    const student = await getStudentForUser(user.id);
    if (achievement.studentId !== student?.id)
      return fail(c, "FORBIDDEN", "Forbidden", 403);
  }

  return ok(c, achievement);
});

certifications.patch(
  "/:id",
  requireRole("STUDENT", "FACULTY"),
  zValidator("json", updateCertificationSchema),
  async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const achievement = await db.query.certificationsTable.findFirst({
      where: (a, { and, eq, isNull }) => and(eq(a.id, id), isNull(a.deletedAt)),
    });
    if (!achievement) return fail(c, "NOT_FOUND", "Achievement not found", 404);

    if (user.role === "STUDENT") {
      const student = await getStudentForUser(user.id);
      if (achievement.studentId !== student?.id)
        return fail(c, "FORBIDDEN", "Forbidden", 403);
    }

    const [updated] = await db
      .update(certificationsTable)
      .set(body)
      .where(eq(certificationsTable.id, id))
      .returning();
    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "Achievement",
      entityId: id,
    });
    return ok(c, updated);
  },
);

certifications.patch("/:id/verify", requireRole("FACULTY"), async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  const existing = await db.query.certificationsTable.findFirst({
    where: (a, { and, eq, isNull }) => and(eq(a.id, id), isNull(a.deletedAt)),
  });
  if (!existing) return fail(c, "NOT_FOUND", "Achievement not found", 404);

  const [updated] = await db
    .update(certificationsTable)
    .set({ verified: true, verifiedBy: user.id, verifiedAt: new Date() })
    .where(eq(certificationsTable.id, id))
    .returning();

  await createAuditLog({
    userId: user.id,
    action: "VERIFY",
    entity: "Achievement",
    entityId: id,
  });
  return ok(c, updated);
});

certifications.delete("/:id", requireRole("STUDENT", "FACULTY"), async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  const achievement = await db.query.certificationsTable.findFirst({
    where: (a, { and, eq, isNull }) => and(eq(a.id, id), isNull(a.deletedAt)),
  });
  if (!achievement) return fail(c, "NOT_FOUND", "Achievement not found", 404);

  if (user.role === "STUDENT") {
    const student = await getStudentForUser(user.id);
    if (achievement.studentId !== student?.id)
      return fail(c, "FORBIDDEN", "Forbidden", 403);
  }

  const [deleted] = await db
    .update(certificationsTable)
    .set({ deletedAt: new Date() })
    .where(eq(certificationsTable.id, id))
    .returning();
  await createAuditLog({
    userId: user.id,
    action: "DELETE",
    entity: "Achievement",
    entityId: id,
  });
  return ok(c, deleted);
});

export default certifications;
