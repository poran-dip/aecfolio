import { experiencesTable } from "@aecfolio/db";
import {
  createExperienceSchema,
  updateExperienceSchema,
} from "@aecfolio/shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { createAuditLog } from "../lib/audit";
import { db } from "../lib/db";
import { fail, ok } from "../lib/response";
import { getStudentForUser } from "../lib/student";
import type { SessionUser } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import type { AppEnv } from "../types/context";

const experiences = new Hono<AppEnv>();

experiences.get("/", requireRole("STUDENT", "FACULTY"), async (c) => {
  const user = c.get("user") as SessionUser;
  const paramStudentId = c.req.query("studentId");

  let studentId: string | null = null;

  if (user.role === "FACULTY" && paramStudentId) {
    studentId = paramStudentId;
  } else if (user.role === "STUDENT") {
    const student = await getStudentForUser(user.id);
    if (!student) return fail(c, "NOT_FOUND", "Student profile not found", 404);
    studentId = student.id;
  }

  const result = await db.query.experiencesTable.findMany({
    where: (e, { and, isNull, eq }) =>
      studentId
        ? and(isNull(e.deletedAt), eq(e.studentId, studentId))
        : isNull(e.deletedAt),
  });

  return ok(c, result);
});

experiences.post(
  "/",
  requireRole("STUDENT"),
  zValidator("json", createExperienceSchema),
  async (c) => {
    const user = c.get("user") as SessionUser;
    const body = c.req.valid("json");

    const student = await getStudentForUser(user.id);
    if (!student) return fail(c, "NOT_FOUND", "Student profile not found", 404);

    const [experience] = await db
      .insert(experiencesTable)
      .values({ ...body, studentId: student.id })
      .returning();
    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "Experience",
      entityId: experience.id,
    });
    return ok(c, experience, 201);
  },
);

experiences.get("/:id", requireRole("STUDENT", "FACULTY"), async (c) => {
  const user = c.get("user") as SessionUser;
  const id = c.req.param("id");

  const experience = await db.query.experiencesTable.findFirst({
    where: (e, { and, eq, isNull }) => and(eq(e.id, id), isNull(e.deletedAt)),
  });
  if (!experience) return fail(c, "NOT_FOUND", "Experience not found", 404);

  if (user.role === "STUDENT") {
    const student = await getStudentForUser(user.id);
    if (experience.studentId !== student?.id)
      return fail(c, "FORBIDDEN", "Forbidden", 403);
  }

  return ok(c, experience);
});

experiences.patch(
  "/:id",
  requireRole("STUDENT", "FACULTY"),
  zValidator("json", updateExperienceSchema),
  async (c) => {
    const user = c.get("user") as SessionUser;
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const experience = await db.query.experiencesTable.findFirst({
      where: (e, { and, eq, isNull }) => and(eq(e.id, id), isNull(e.deletedAt)),
    });
    if (!experience) return fail(c, "NOT_FOUND", "Experience not found", 404);

    if (user.role === "STUDENT") {
      const student = await getStudentForUser(user.id);
      if (experience.studentId !== student?.id)
        return fail(c, "FORBIDDEN", "Forbidden", 403);
    }

    const [updated] = await db
      .update(experiencesTable)
      .set(body)
      .where(eq(experiencesTable.id, id))
      .returning();
    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "Experience",
      entityId: id,
    });
    return ok(c, updated);
  },
);

experiences.delete("/:id", requireRole("STUDENT", "FACULTY"), async (c) => {
  const user = c.get("user") as SessionUser;
  const id = c.req.param("id");

  const experience = await db.query.experiencesTable.findFirst({
    where: (e, { and, eq, isNull }) => and(eq(e.id, id), isNull(e.deletedAt)),
  });
  if (!experience) return fail(c, "NOT_FOUND", "Experience not found", 404);

  if (user.role === "STUDENT") {
    const student = await getStudentForUser(user.id);
    if (experience.studentId !== student?.id)
      return fail(c, "FORBIDDEN", "Forbidden", 403);
  }

  const [deleted] = await db
    .update(experiencesTable)
    .set({ deletedAt: new Date() })
    .where(eq(experiencesTable.id, id))
    .returning();
  await createAuditLog({
    userId: user.id,
    action: "DELETE",
    entity: "Experience",
    entityId: id,
  });
  return ok(c, deleted);
});

export default experiences;
