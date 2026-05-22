import { achievementsTable } from "@aecfolio/db";
import {
  createAchievementSchema,
  updateAchievementSchema,
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
import type { AppEnv } from "../types/context";

const achievements = new Hono<AppEnv>()
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

    const result = await db.query.achievementsTable.findMany({
      where: (a, { and, isNull, eq }) =>
        studentId
          ? and(isNull(a.deletedAt), eq(a.studentId, studentId))
          : isNull(a.deletedAt),
    });

    return ok(c, result);
  })

  .post(
    "/",
    requireRole("STUDENT"),
    zValidator("json", createAchievementSchema),
    async (c) => {
      const user = getUser(c);
      const body = c.req.valid("json");

      const student = await getStudentForUser(user.id);
      if (!student)
        return fail(c, "NOT_FOUND", "Student profile not found", 404);

      const [achievement] = await db
        .insert(achievementsTable)
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
  )

  .patch(
    "/verify",
    requireRole("FACULTY"),
    zValidator("json", z.object({ ids: z.array(z.string()).min(1) })),
    async (c) => {
      const user = getUser(c);
      const { ids } = c.req.valid("json");

      await db
        .update(achievementsTable)
        .set({ verified: true, verifiedBy: user.id, verifiedAt: new Date() })
        .where(inArray(achievementsTable.id, ids));

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
  )

  .get("/:id", requireRole("STUDENT", "FACULTY"), async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");

    const achievement = await db.query.achievementsTable.findFirst({
      where: (a, { and, eq, isNull }) => and(eq(a.id, id), isNull(a.deletedAt)),
    });
    if (!achievement) return fail(c, "NOT_FOUND", "Achievement not found", 404);

    if (user.role === "STUDENT") {
      const student = await getStudentForUser(user.id);
      if (achievement.studentId !== student?.id)
        return fail(c, "FORBIDDEN", "Forbidden", 403);
    }

    return ok(c, achievement);
  })

  .patch(
    "/:id",
    requireRole("STUDENT", "FACULTY"),
    zValidator("json", updateAchievementSchema),
    async (c) => {
      const user = getUser(c);
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const achievement = await db.query.achievementsTable.findFirst({
        where: (a, { and, eq, isNull }) =>
          and(eq(a.id, id), isNull(a.deletedAt)),
      });
      if (!achievement)
        return fail(c, "NOT_FOUND", "Achievement not found", 404);

      if (user.role === "STUDENT") {
        const student = await getStudentForUser(user.id);
        if (achievement.studentId !== student?.id)
          return fail(c, "FORBIDDEN", "Forbidden", 403);
      }

      const [updated] = await db
        .update(achievementsTable)
        .set(body)
        .where(eq(achievementsTable.id, id))
        .returning();
      await createAuditLog({
        userId: user.id,
        action: "UPDATE",
        entity: "Achievement",
        entityId: id,
      });
      return ok(c, updated);
    },
  )

  .patch("/:id/verify", requireRole("FACULTY"), async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");

    const existing = await db.query.achievementsTable.findFirst({
      where: (a, { and, eq, isNull }) => and(eq(a.id, id), isNull(a.deletedAt)),
    });
    if (!existing) return fail(c, "NOT_FOUND", "Achievement not found", 404);

    const [updated] = await db
      .update(achievementsTable)
      .set({ verified: true, verifiedBy: user.id, verifiedAt: new Date() })
      .where(eq(achievementsTable.id, id))
      .returning();

    await createAuditLog({
      userId: user.id,
      action: "VERIFY",
      entity: "Achievement",
      entityId: id,
    });
    return ok(c, updated);
  })

  .delete("/:id", requireRole("STUDENT", "FACULTY"), async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");

    const achievement = await db.query.achievementsTable.findFirst({
      where: (a, { and, eq, isNull }) => and(eq(a.id, id), isNull(a.deletedAt)),
    });
    if (!achievement) return fail(c, "NOT_FOUND", "Achievement not found", 404);

    if (user.role === "STUDENT") {
      const student = await getStudentForUser(user.id);
      if (achievement.studentId !== student?.id)
        return fail(c, "FORBIDDEN", "Forbidden", 403);
    }

    const [deleted] = await db
      .update(achievementsTable)
      .set({ deletedAt: new Date() })
      .where(eq(achievementsTable.id, id))
      .returning();
    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "Achievement",
      entityId: id,
    });
    return ok(c, deleted);
  });

export default achievements;
