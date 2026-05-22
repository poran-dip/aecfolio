import { socialsTable } from "@aecfolio/db";
import { createSocialSchema, updateSocialSchema } from "@aecfolio/shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { createAuditLog } from "../lib/audit";
import { db } from "../lib/db";
import { fail, getUser, ok } from "../lib/response";
import { getStudentForUser } from "../lib/student";
import { requireRole } from "../middleware/role";
import type { AppEnv } from "../types/context";

const socials = new Hono<AppEnv>()
  .get("/", requireRole("STUDENT", "FACULTY"), async (c) => {
    const user = getUser(c);
    const paramStudentId = c.req.query("studentId");

    let studentId: string | null = null;

    if (user.role === "FACULTY" && paramStudentId) {
      studentId = paramStudentId;
    } else if (user.role === "STUDENT") {
      const student = await getStudentForUser(user.id);
      if (!student)
        return fail(c, "NOT_FOUND", "Student profile not found", 404);
      studentId = student.id;
    }

    const result = await db.query.socialsTable.findMany({
      where: (e, { eq }) =>
        studentId ? eq(e.studentId, studentId) : undefined,
    });

    return ok(c, result);
  })

  .post(
    "/",
    requireRole("STUDENT"),
    zValidator("json", createSocialSchema),
    async (c) => {
      const user = getUser(c);
      const body = c.req.valid("json");

      const student = await getStudentForUser(user.id);
      if (!student)
        return fail(c, "NOT_FOUND", "Student profile not found", 404);

      const [social] = await db
        .insert(socialsTable)
        .values({ ...body, studentId: student.id })
        .returning();
      await createAuditLog({
        userId: user.id,
        action: "CREATE",
        entity: "Social",
        entityId: social.id,
      });
      return ok(c, social, 201);
    },
  )

  .get("/:id", requireRole("STUDENT", "FACULTY"), async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");

    const social = await db.query.socialsTable.findFirst({
      where: (e, { eq }) => eq(e.id, id),
    });
    if (!social) return fail(c, "NOT_FOUND", "Social not found", 404);

    if (user.role === "STUDENT") {
      const student = await getStudentForUser(user.id);
      if (social.studentId !== student?.id)
        return fail(c, "FORBIDDEN", "Forbidden", 403);
    }

    return ok(c, social);
  })

  .patch(
    "/:id",
    requireRole("STUDENT", "FACULTY"),
    zValidator("json", updateSocialSchema),
    async (c) => {
      const user = getUser(c);
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const social = await db.query.socialsTable.findFirst({
        where: (e, { eq }) => eq(e.id, id),
      });
      if (!social) return fail(c, "NOT_FOUND", "Social not found", 404);

      if (user.role === "STUDENT") {
        const student = await getStudentForUser(user.id);
        if (social.studentId !== student?.id)
          return fail(c, "FORBIDDEN", "Forbidden", 403);
      }

      const [updated] = await db
        .update(socialsTable)
        .set(body)
        .where(eq(socialsTable.id, id))
        .returning();
      await createAuditLog({
        userId: user.id,
        action: "UPDATE",
        entity: "Social",
        entityId: id,
      });
      return ok(c, updated);
    },
  )

  .delete("/:id", requireRole("STUDENT", "FACULTY"), async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");

    const social = await db.query.socialsTable.findFirst({
      where: (e, { eq }) => eq(e.id, id),
    });
    if (!social) return fail(c, "NOT_FOUND", "Social not found", 404);

    if (user.role === "STUDENT") {
      const student = await getStudentForUser(user.id);
      if (social.studentId !== student?.id)
        return fail(c, "FORBIDDEN", "Forbidden", 403);
    }

    const [deleted] = await db
      .delete(socialsTable)
      .where(eq(socialsTable.id, id))
      .returning();
    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "Social",
      entityId: id,
    });
    return ok(c, deleted);
  });

export default socials;
