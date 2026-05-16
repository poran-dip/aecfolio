import { studentsTable, usersTable } from "@aecfolio/db";
import {
  Branch,
  Course,
  createStudentSchema,
  updateStudentSchema,
} from "@aecfolio/shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createAuditLog } from "../lib/audit";
import { db } from "../lib/db";
import { fail, ok } from "../lib/response";
import type { SessionUser } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import type { AppEnv } from "../types/context";

const students = new Hono<AppEnv>();

students.get("/", requireRole("FACULTY"), async (c) => {
  const result = await db.query.studentsTable.findMany({
    where: (s, { isNull }) => isNull(s.deletedAt),
    with: { user: { columns: { name: true } } },
  });
  return ok(c, result);
});

students.post(
  "/",
  requireRole("FACULTY"),
  zValidator("json", createStudentSchema),
  async (c) => {
    const user = c.get("user") as SessionUser;
    const body = c.req.valid("json");

    const [student] = await db
      .insert(studentsTable)
      .values({ userId: user.id, skills: body.skills ?? [], ...body })
      .returning();
    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "Student",
      entityId: student.id,
    });
    return ok(c, student, 201);
  },
);

const importSchema = z.object({
  students: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        rollNo: z.string().min(1),
        course: z.nativeEnum(Course),
        branch: z.nativeEnum(Branch),
        semester: z.number().int().min(1).max(8),
        cgpa: z.number().min(0).max(10).optional().nullable(),
      }),
    )
    .min(1),
});

students.post(
  "/import",
  requireRole("FACULTY"),
  zValidator("json", importSchema),
  async (c) => {
    const user = c.get("user") as SessionUser;
    const { students: rows } = c.req.valid("json");

    const results = await Promise.allSettled(
      rows.map(async (row) => {
        const [existingUser, existingRoll] = await Promise.all([
          db.query.usersTable.findFirst({
            where: (u, { eq }) => eq(u.email, row.email),
          }),
          db.query.studentsTable.findFirst({
            where: (s, { eq }) => eq(s.rollNo, row.rollNo),
          }),
        ]);
        if (existingUser) throw new Error(`Email already exists: ${row.email}`);
        if (existingRoll)
          throw new Error(`Roll number already exists: ${row.rollNo}`);

        const [newUser] = await db
          .insert(usersTable)
          .values({ name: row.name, email: row.email, role: "STUDENT" })
          .returning();
        const [newStudent] = await db
          .insert(studentsTable)
          .values({
            userId: newUser.id,
            rollNo: row.rollNo,
            course: row.course,
            branch: row.branch,
            semester: row.semester,
            cgpa: row.cgpa ?? null,
            skills: [],
          })
          .returning();

        await createAuditLog({
          userId: user.id,
          action: "CREATE",
          entity: "Student",
          entityId: newStudent.id,
        });
        return row.email;
      }),
    );

    const created: string[] = [];
    const errors: { reason: string }[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") created.push(r.value);
      else errors.push({ reason: r.reason?.message ?? "Unknown error" });
    }

    return ok(c, { created: created.length, errors });
  },
);

students.patch(
  "/approve",
  requireRole("FACULTY"),
  zValidator("json", z.object({ ids: z.array(z.string()).min(1) })),
  async (c) => {
    const user = c.get("user") as SessionUser;
    const { ids } = c.req.valid("json");

    const found = await db.query.studentsTable.findMany({
      where: (s, { and, inArray, isNull }) =>
        and(inArray(s.id, ids), isNull(s.deletedAt)),
      columns: { id: true, userId: true },
    });

    await db
      .update(usersTable)
      .set({ role: "STUDENT" })
      .where(eq(usersTable.id, found.map((s) => s.userId)[0])); // updateMany via inArray below

    // Drizzle doesn't have updateMany with inArray natively in all adapters, use individual or raw
    await Promise.all(
      found.map((s) =>
        db
          .update(usersTable)
          .set({ role: "STUDENT" })
          .where(eq(usersTable.id, s.userId)),
      ),
    );

    await Promise.all(
      found.map((s) =>
        createAuditLog({
          userId: user.id,
          action: "APPROVE",
          entity: "Student",
          entityId: s.id,
        }),
      ),
    );

    return ok(c, { approved: found.length });
  },
);

students.get("/:id", requireRole("FACULTY"), async (c) => {
  const id = c.req.param("id");
  const student = await db.query.studentsTable.findFirst({
    where: (s, { and, eq, isNull }) => and(eq(s.id, id), isNull(s.deletedAt)),
    with: { user: true },
  });
  if (!student) return fail(c, "NOT_FOUND", "Student not found", 404);
  return ok(c, student);
});

students.patch(
  "/:id",
  requireRole("FACULTY"),
  zValidator("json", updateStudentSchema),
  async (c) => {
    const user = c.get("user") as SessionUser;
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const existing = await db.query.studentsTable.findFirst({
      where: (s, { and, eq, isNull }) => and(eq(s.id, id), isNull(s.deletedAt)),
    });
    if (!existing) return fail(c, "NOT_FOUND", "Student not found", 404);

    const [updated] = await db
      .update(studentsTable)
      .set(body)
      .where(eq(studentsTable.id, id))
      .returning();
    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "Student",
      entityId: id,
    });
    return ok(c, updated);
  },
);

students.delete("/:id", requireRole("FACULTY"), async (c) => {
  const user = c.get("user") as SessionUser;
  const id = c.req.param("id");

  const existing = await db.query.studentsTable.findFirst({
    where: (s, { and, eq, isNull }) => and(eq(s.id, id), isNull(s.deletedAt)),
  });
  if (!existing) return fail(c, "NOT_FOUND", "Student not found", 404);

  const [deleted] = await db
    .update(studentsTable)
    .set({ deletedAt: new Date() })
    .where(eq(studentsTable.id, id))
    .returning();
  await createAuditLog({
    userId: user.id,
    action: "DELETE",
    entity: "Student",
    entityId: id,
  });
  return ok(c, deleted);
});

export default students;
