import { facultyTable } from "@aecfolio/db";
import { createFacultySchema, updateFacultySchema } from "@aecfolio/shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { createAuditLog } from "../lib/audit";
import { db } from "../lib/db";
import { fail, getUser, ok } from "../lib/response";
import { requireRole } from "../middleware/role";
import type { AppEnv } from "../types/context";

const faculty = new Hono<AppEnv>()
  .get("/", requireRole("FACULTY"), async (c) => {
    const result = await db.query.facultyTable.findMany({
      where: (f, { isNull }) => isNull(f.deletedAt),
      with: { user: { columns: { name: true, email: true } } },
    });
    return ok(c, result);
  })

  .post(
    "/",
    requireRole("FACULTY"),
    zValidator("json", createFacultySchema),
    async (c) => {
      const user = getUser(c);
      const body = c.req.valid("json");

      const [f] = await db
        .insert(facultyTable)
        .values({ ...body, userId: user.id })
        .returning();
      await createAuditLog({
        userId: user.id,
        action: "CREATE",
        entity: "Faculty",
        entityId: f.id,
      });
      return ok(c, f, 201);
    },
  )

  .get("/verifications", requireRole("FACULTY"), async (c) => {
    const [results, achievements, certifications] = await Promise.all([
      db.query.resultsTable.findMany({
        where: (r, { eq }) => eq(r.verified, false),
        with: { student: { with: { user: { columns: { name: true } } } } },
        orderBy: (r, { asc }) => asc(r.createdAt),
      }),
      db.query.achievementsTable.findMany({
        where: (a, { and, eq, isNull }) =>
          and(eq(a.verified, false), isNull(a.deletedAt)),
        with: { student: { with: { user: { columns: { name: true } } } } },
        orderBy: (a, { asc }) => asc(a.createdAt),
      }),
      db.query.certificationsTable.findMany({
        where: (cert, { and, eq, isNull }) =>
          and(eq(cert.verified, false), isNull(cert.deletedAt)),
        with: { student: { with: { user: { columns: { name: true } } } } },
        orderBy: (cert, { asc }) => asc(cert.createdAt),
      }),
    ]);

    type StudentShape = {
      id: string;
      rollNo: string;
      branch: string;
      user?: {
        name: string | null;
      } | null;
    };

    const shape = (
      type: string,
      id: string,
      name: string,
      proofImage: string | null | undefined,
      student: StudentShape,
      createdAt: Date,
    ) => ({
      type,
      id,
      name,
      proofImage: proofImage ?? null,
      createdAt: createdAt.toISOString(),
      student: {
        id: student.id,
        name: student.user?.name ?? null,
        rollNo: student.rollNo,
        branch: student.branch,
      },
    });

    const pending = [
      ...results
        .filter((r) => r.student)
        .map((r) =>
          shape(
            "Result",
            r.id,
            `Semester ${r.semester} Result`,
            null,
            r.student,
            r.createdAt,
          ),
        ),
      ...achievements
        .filter((a) => a.student)
        .map((a) =>
          shape(
            "Achievement",
            a.id,
            a.title,
            a.proofImage,
            a.student,
            a.createdAt,
          ),
        ),
      ...certifications
        .filter((cert) => cert.student)
        .map((cert) =>
          shape(
            "Certification",
            cert.id,
            cert.name,
            cert.proofImage,
            cert.student,
            cert.createdAt,
          ),
        ),
    ];

    return ok(c, { pending, total: pending.length });
  })

  .get("/:id", requireRole("FACULTY"), async (c) => {
    const id = c.req.param("id");
    const f = await db.query.facultyTable.findFirst({
      where: (fac, { and, eq, isNull }) =>
        and(eq(fac.id, id), isNull(fac.deletedAt)),
      with: { user: true },
    });
    if (!f) return fail(c, "NOT_FOUND", "Faculty not found", 404);
    return ok(c, f);
  })

  .patch(
    "/:id",
    requireRole("FACULTY"),
    zValidator("json", updateFacultySchema),
    async (c) => {
      const user = getUser(c);
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const existing = await db.query.facultyTable.findFirst({
        where: (f, { and, eq, isNull }) =>
          and(eq(f.id, id), isNull(f.deletedAt)),
      });
      if (!existing) return fail(c, "NOT_FOUND", "Faculty not found", 404);

      const [updated] = await db
        .update(facultyTable)
        .set(body)
        .where(eq(facultyTable.id, id))
        .returning();
      await createAuditLog({
        userId: user.id,
        action: "UPDATE",
        entity: "Faculty",
        entityId: id,
      });
      return ok(c, updated);
    },
  )

  .delete("/:id", requireRole("FACULTY"), async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");

    const existing = await db.query.facultyTable.findFirst({
      where: (f, { and, eq, isNull }) => and(eq(f.id, id), isNull(f.deletedAt)),
    });
    if (!existing) return fail(c, "NOT_FOUND", "Faculty not found", 404);

    const [deleted] = await db
      .update(facultyTable)
      .set({ deletedAt: new Date() })
      .where(eq(facultyTable.id, id))
      .returning();
    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "Faculty",
      entityId: id,
    });
    return ok(c, deleted);
  });

export default faculty;
