import { projectsTable } from "@aecfolio/db";
import { createProjectSchema, updateProjectSchema } from "@aecfolio/shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { createAuditLog } from "../lib/audit";
import { db } from "../lib/db";
import { fail, getUser, ok } from "../lib/response";
import { getStudentForUser } from "../lib/student";
import { requireRole } from "../middleware/role";
import type { AppEnv } from "../types/context";

const projects = new Hono<AppEnv>()
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

    const result = await db.query.projectsTable.findMany({
      where: (e, { and, isNull, eq }) =>
        studentId
          ? and(isNull(e.deletedAt), eq(e.studentId, studentId))
          : isNull(e.deletedAt),
    });

    return ok(c, result);
  })

  .post(
    "/",
    requireRole("STUDENT"),
    zValidator("json", createProjectSchema),
    async (c) => {
      const user = getUser(c);
      const body = c.req.valid("json");

      const student = await getStudentForUser(user.id);
      if (!student)
        return fail(c, "NOT_FOUND", "Student profile not found", 404);

      const [project] = await db
        .insert(projectsTable)
        .values({ ...body, studentId: student.id })
        .returning();
      await createAuditLog({
        userId: user.id,
        action: "CREATE",
        entity: "Project",
        entityId: project.id,
      });
      return ok(c, project, 201);
    },
  )

  .get("/:id", requireRole("STUDENT", "FACULTY"), async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");

    const project = await db.query.projectsTable.findFirst({
      where: (e, { and, eq, isNull }) => and(eq(e.id, id), isNull(e.deletedAt)),
    });
    if (!project) return fail(c, "NOT_FOUND", "Project not found", 404);

    if (user.role === "STUDENT") {
      const student = await getStudentForUser(user.id);
      if (project.studentId !== student?.id)
        return fail(c, "FORBIDDEN", "Forbidden", 403);
    }

    return ok(c, project);
  })

  .patch(
    "/:id",
    requireRole("STUDENT", "FACULTY"),
    zValidator("json", updateProjectSchema),
    async (c) => {
      const user = getUser(c);
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const project = await db.query.projectsTable.findFirst({
        where: (e, { and, eq, isNull }) =>
          and(eq(e.id, id), isNull(e.deletedAt)),
      });
      if (!project) return fail(c, "NOT_FOUND", "Project not found", 404);

      if (user.role === "STUDENT") {
        const student = await getStudentForUser(user.id);
        if (project.studentId !== student?.id)
          return fail(c, "FORBIDDEN", "Forbidden", 403);
      }

      const [updated] = await db
        .update(projectsTable)
        .set(body)
        .where(eq(projectsTable.id, id))
        .returning();
      await createAuditLog({
        userId: user.id,
        action: "UPDATE",
        entity: "Project",
        entityId: id,
      });
      return ok(c, updated);
    },
  )

  .delete("/:id", requireRole("STUDENT", "FACULTY"), async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");

    const project = await db.query.projectsTable.findFirst({
      where: (e, { and, eq, isNull }) => and(eq(e.id, id), isNull(e.deletedAt)),
    });
    if (!project) return fail(c, "NOT_FOUND", "Project not found", 404);

    if (user.role === "STUDENT") {
      const student = await getStudentForUser(user.id);
      if (project.studentId !== student?.id)
        return fail(c, "FORBIDDEN", "Forbidden", 403);
    }

    const [deleted] = await db
      .update(projectsTable)
      .set({ deletedAt: new Date() })
      .where(eq(projectsTable.id, id))
      .returning();
    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "Project",
      entityId: id,
    });
    return ok(c, deleted);
  });

export default projects;
