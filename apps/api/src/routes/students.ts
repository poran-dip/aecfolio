import { auditLogsTable, studentsTable, usersTable } from "@aecfolio/db";
import {
  Branch,
  Capability,
  Course,
  createStudentSchema,
  Role,
  StudentStatus,
  updateStudentSchema,
} from "@aecfolio/shared";
import { and, count, desc, eq, ilike, isNull, or, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { getActorDepartment } from "../lib/actor";
import { AuditAction, AuditEntity, createAuditLog, diff } from "../lib/audit";
import { db } from "../lib/db";
import { constraintOf, pgMessage } from "../lib/db-error";
import { paginationQuerySchema, toOffset, toPage } from "../lib/pagination";
import {
  loadStudentProfile,
  projectStudentProfile,
  viewForActor,
} from "../lib/profile";
import { fail, getUser, ok, paginated } from "../lib/response";
import { validate } from "../lib/validate";
import { requireCapability } from "../middleware/capability";
import type { AppEnv } from "../types/context";

const IMPORT_MAX = 500;

const listQuerySchema = paginationQuerySchema.extend({
  branch: z.enum(Branch).optional(),
  course: z.enum(Course).optional(),
  semester: z.coerce.number().int().min(1).max(8).optional(),
  admissionYear: z.coerce.number().int().optional(),
  status: z.enum(StudentStatus).optional(),
  q: z.string().trim().min(1).optional(),
  allDepartments: z
    .union([z.literal("true"), z.literal("false")])
    .transform((v) => v === "true")
    .optional(),
});

const createStudentAccountSchema = createStudentSchema.extend({
  name: z.string().trim().min(1),
  email: z.email(),
});

const importSchema = z.object({
  students: z.array(createStudentAccountSchema).min(1).max(IMPORT_MAX),
});

type CreateStudentAccount = z.infer<typeof createStudentAccountSchema>;

async function createStudentAccount(
  row: CreateStudentAccount,
  actorId: string,
) {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(usersTable)
      .values({
        name: row.name,
        email: row.email,
        emailVerified: true,
        role: Role.STUDENT,
      })
      .returning({ id: usersTable.id });

    const [student] = await tx
      .insert(studentsTable)
      .values({
        userId: user.id,
        rollNo: row.rollNo,
        course: row.course,
        branch: row.branch,
        semester: row.semester,
        admissionYear: row.admissionYear,
        status: row.status ?? StudentStatus.ACTIVE,
        skills: [],
      })
      .returning();

    await tx.insert(auditLogsTable).values({
      userId: actorId,
      action: AuditAction.CREATE,
      entity: AuditEntity.STUDENT,
      entityId: student.id,
    });

    return student;
  });
}

function describeFailure(error: unknown) {
  switch (constraintOf(error)) {
    case "users_email_unique":
      return "Email already in use";
    case "students_roll_no_unique":
      return "Roll number already in use";
    case "students_user_id_unique":
      return "That user already has a student record";
    default:
      return pgMessage(error);
  }
}

const students = new Hono<AppEnv>()
  .get(
    "/",
    requireCapability(Capability.STUDENT_READ),
    validate("query", listQuerySchema),
    async (c) => {
      const user = getUser(c);
      const query = c.req.valid("query");

      let branch = query.branch;
      if (!branch && !query.allDepartments)
        branch = (await getActorDepartment(user)) ?? undefined;

      const filters: SQL[] = [isNull(studentsTable.deletedAt)];
      filters.push(
        eq(studentsTable.status, query.status ?? StudentStatus.ACTIVE),
      );
      if (branch) filters.push(eq(studentsTable.branch, branch));
      if (query.course) filters.push(eq(studentsTable.course, query.course));
      if (query.semester)
        filters.push(eq(studentsTable.semester, query.semester));
      if (query.admissionYear)
        filters.push(eq(studentsTable.admissionYear, query.admissionYear));
      if (query.q) {
        const needle = `%${query.q}%`;
        const match = or(
          ilike(studentsTable.rollNo, needle),
          ilike(usersTable.name, needle),
          ilike(usersTable.email, needle),
        );
        if (match) filters.push(match);
      }

      const where = and(...filters);
      const { limit, offset } = toOffset(query);

      const [items, [total]] = await Promise.all([
        db
          .select({
            id: studentsTable.id,
            rollNo: studentsTable.rollNo,
            course: studentsTable.course,
            branch: studentsTable.branch,
            semester: studentsTable.semester,
            admissionYear: studentsTable.admissionYear,
            status: studentsTable.status,
            cgpa: studentsTable.cgpa,
            titleSought: studentsTable.titleSought,
            name: usersTable.name,
            email: usersTable.email,
          })
          .from(studentsTable)
          .innerJoin(usersTable, eq(studentsTable.userId, usersTable.id))
          .where(where)
          .orderBy(desc(studentsTable.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ value: count() })
          .from(studentsTable)
          .innerJoin(usersTable, eq(studentsTable.userId, usersTable.id))
          .where(where),
      ]);

      return paginated(c, toPage(items, total?.value ?? 0, query));
    },
  )

  .post(
    "/",
    requireCapability(Capability.STUDENT_MANAGE),
    validate("json", createStudentAccountSchema),
    async (c) => {
      const user = getUser(c);
      const body = c.req.valid("json");

      try {
        const student = await createStudentAccount(body, user.id);
        return ok(c, student, 201);
      } catch (error) {
        return fail(c, "CONFLICT", describeFailure(error), 409);
      }
    },
  )

  .post(
    "/import",
    requireCapability(Capability.STUDENT_MANAGE),
    validate("json", importSchema),
    async (c) => {
      const user = getUser(c);
      const { students: rows } = c.req.valid("json");

      const created: { rollNo: string; email: string; id: string }[] = [];
      const failed: {
        row: number;
        rollNo: string;
        email: string;
        reason: string;
      }[] = [];

      for (const [index, row] of rows.entries()) {
        try {
          const student = await createStudentAccount(row, user.id);
          created.push({
            id: student.id,
            rollNo: row.rollNo,
            email: row.email,
          });
        } catch (error) {
          failed.push({
            row: index + 1,
            rollNo: row.rollNo,
            email: row.email,
            reason: describeFailure(error),
          });
        }
      }

      return ok(c, { created, failed, total: rows.length });
    },
  )

  .get("/:id", requireCapability(Capability.STUDENT_READ), async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");

    const profile = await loadStudentProfile(id);
    if (!profile) return fail(c, "NOT_FOUND", "Student not found", 404);

    return ok(c, projectStudentProfile(profile, viewForActor(user, false)));
  })

  .patch(
    "/:id",
    requireCapability(Capability.ACADEMIC_RECTIFY),
    validate("json", updateStudentSchema),
    async (c) => {
      const user = getUser(c);
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const [before] = await db
        .select()
        .from(studentsTable)
        .where(and(eq(studentsTable.id, id), isNull(studentsTable.deletedAt)))
        .limit(1);
      if (!before) return fail(c, "NOT_FOUND", "Student not found", 404);

      try {
        const [updated] = await db
          .update(studentsTable)
          .set(body)
          .where(eq(studentsTable.id, id))
          .returning();

        await createAuditLog({
          userId: user.id,
          action: AuditAction.UPDATE,
          entity: AuditEntity.STUDENT,
          entityId: id,
          metadata: diff(before, updated),
        });
        return ok(c, updated);
      } catch (error) {
        return fail(c, "CONFLICT", describeFailure(error), 409);
      }
    },
  )

  .delete("/:id", requireCapability(Capability.STUDENT_MANAGE), async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");

    const [existing] = await db
      .select({ id: studentsTable.id })
      .from(studentsTable)
      .where(and(eq(studentsTable.id, id), isNull(studentsTable.deletedAt)))
      .limit(1);
    if (!existing) return fail(c, "NOT_FOUND", "Student not found", 404);

    const [deleted] = await db
      .update(studentsTable)
      .set({ deletedAt: new Date() })
      .where(eq(studentsTable.id, id))
      .returning();

    await createAuditLog({
      userId: user.id,
      action: AuditAction.DELETE,
      entity: AuditEntity.STUDENT,
      entityId: id,
    });
    return ok(c, deleted);
  });

export default students;
