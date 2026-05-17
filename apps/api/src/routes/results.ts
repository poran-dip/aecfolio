import { resultsTable } from "@aecfolio/db";
import { createResultSchema, updateResultSchema } from "@aecfolio/shared";
import { zValidator } from "@hono/zod-validator";
import { eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createAuditLog } from "../lib/audit";
import { db } from "../lib/db";
import { fail, getUser, ok } from "../lib/response";
import { getStudentForUser } from "../lib/student";
import { requireRole } from "../middleware/role";
import type { AppEnv } from "../types/context";

const results = new Hono<AppEnv>();

results.get("/", requireRole("STUDENT", "FACULTY"), async (c) => {
  const user = getUser(c);
  const paramStudentId = c.req.query("studentId");

  if (user.role === "STUDENT") {
    const student = await getStudentForUser(user.id);
    if (!student) return fail(c, "NOT_FOUND", "Student profile not found", 404);

    const result = await db.query.resultsTable.findMany({
      where: (r, { eq }) => eq(r.studentId, student.id),
    });
    return ok(c, result);
  }

  // FACULTY
  const result = await db.query.resultsTable.findMany({
    where: paramStudentId
      ? (r, { eq }) => eq(r.studentId, paramStudentId)
      : undefined,
  });
  return ok(c, result);
});

results.post(
  "/",
  requireRole("STUDENT"),
  zValidator("json", createResultSchema),
  async (c) => {
    const user = getUser(c);
    const body = c.req.valid("json");

    const student = await getStudentForUser(user.id);
    if (!student) return fail(c, "NOT_FOUND", "Student profile not found", 404);

    const [result] = await db
      .insert(resultsTable)
      .values({ ...body, studentId: student.id })
      .returning();

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "Result",
      entityId: result.id,
    });
    return ok(c, result, 201);
  },
);

results.patch(
  "/verify",
  requireRole("FACULTY"),
  zValidator("json", z.object({ ids: z.array(z.string()).min(1) })),
  async (c) => {
    const user = getUser(c);
    const { ids } = c.req.valid("json");

    await db
      .update(resultsTable)
      .set({ verified: true, verifiedBy: user.id, verifiedAt: new Date() })
      .where(inArray(resultsTable.id, ids));

    await Promise.all(
      ids.map((id) =>
        createAuditLog({
          userId: user.id,
          action: "VERIFY",
          entity: "Result",
          entityId: id,
        }),
      ),
    );

    return ok(c, { verified: ids.length });
  },
);

results.get("/:id", requireRole("STUDENT", "FACULTY"), async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  const result = await db.query.resultsTable.findFirst({
    where: (r, { eq }) => eq(r.id, id),
  });
  if (!result) return fail(c, "NOT_FOUND", "Result not found", 404);

  if (user.role === "STUDENT") {
    const student = await getStudentForUser(user.id);
    if (result.studentId !== student?.id)
      return fail(c, "FORBIDDEN", "Forbidden", 403);
  }

  return ok(c, result);
});

results.patch(
  "/:id",
  requireRole("STUDENT", "FACULTY"),
  zValidator("json", updateResultSchema),
  async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const result = await db.query.resultsTable.findFirst({
      where: (r, { eq }) => eq(r.id, id),
    });
    if (!result) return fail(c, "NOT_FOUND", "Result not found", 404);

    if (user.role === "STUDENT") {
      const student = await getStudentForUser(user.id);
      if (result.studentId !== student?.id)
        return fail(c, "FORBIDDEN", "Forbidden", 403);
    }

    const [updated] = await db
      .update(resultsTable)
      .set(body)
      .where(eq(resultsTable.id, id))
      .returning();

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "Result",
      entityId: id,
    });
    return ok(c, updated);
  },
);

results.patch("/:id/verify", requireRole("FACULTY"), async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  const existing = await db.query.resultsTable.findFirst({
    where: (r, { eq }) => eq(r.id, id),
  });
  if (!existing) return fail(c, "NOT_FOUND", "Result not found", 404);

  const [updated] = await db
    .update(resultsTable)
    .set({ verified: true, verifiedBy: user.id, verifiedAt: new Date() })
    .where(eq(resultsTable.id, id))
    .returning();

  await createAuditLog({
    userId: user.id,
    action: "VERIFY",
    entity: "Result",
    entityId: id,
  });
  return ok(c, updated);
});

results.delete("/:id", requireRole("STUDENT", "FACULTY"), async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  const result = await db.query.resultsTable.findFirst({
    where: (r, { eq }) => eq(r.id, id),
  });
  if (!result) return fail(c, "NOT_FOUND", "Result not found", 404);

  if (user.role === "STUDENT") {
    const student = await getStudentForUser(user.id);
    if (result.studentId !== student?.id)
      return fail(c, "FORBIDDEN", "Forbidden", 403);
  }

  await db.delete(resultsTable).where(eq(resultsTable.id, id));
  await createAuditLog({
    userId: user.id,
    action: "DELETE",
    entity: "Result",
    entityId: id,
  });
  return ok(c, { deleted: true });
});

export default results;
