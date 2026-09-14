import { semesterCreditSchemesTable, studentsTable } from "@aecfolio/db";
import {
  ADMISSION_YEAR_MAX,
  ADMISSION_YEAR_MIN,
  Branch,
  createSemesterCreditSchemeSchema,
  SEMESTER_MAX,
  StudentStatus,
  updateSemesterCreditSchemeSchema,
} from "@aecfolio/shared";
import { and, asc, count, eq, inArray, isNull, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { AuditAction, AuditEntity, createAuditLog, diff } from "../lib/audit";
import { Capability } from "../lib/capabilities";
import { db } from "../lib/db";
import { paginationQuerySchema, toOffset, toPage } from "../lib/pagination";
import { fail, getUser, ok, paginated } from "../lib/response";
import { validate } from "../lib/validate";
import { requireCapability } from "../middleware/capability";
import type { AppEnv } from "../types/context";

const schemeListQuerySchema = paginationQuerySchema.extend({
  branch: z.enum(Branch).optional(),
  admissionYear: z.coerce.number().int().optional(),
});

const promoteSchema = z.object({
  admissionYear: z.coerce
    .number()
    .int()
    .min(ADMISSION_YEAR_MIN)
    .max(ADMISSION_YEAR_MAX),
  branch: z.enum(Branch).optional(),
  creditSchemes: z.array(createSemesterCreditSchemeSchema).optional(),
  requireSchemes: z.boolean().default(true),
});

const admin = new Hono<AppEnv>()
  .get(
    "/credit-schemes",
    requireCapability(Capability.COHORT_PROMOTE),
    validate("query", schemeListQuerySchema),
    async (c) => {
      const query = c.req.valid("query");

      const filters: SQL[] = [];
      if (query.branch)
        filters.push(eq(semesterCreditSchemesTable.branch, query.branch));
      if (query.admissionYear)
        filters.push(
          eq(semesterCreditSchemesTable.admissionYear, query.admissionYear),
        );

      const where = filters.length ? and(...filters) : undefined;
      const { limit, offset } = toOffset(query);

      const [items, [total]] = await Promise.all([
        db
          .select()
          .from(semesterCreditSchemesTable)
          .where(where)
          .orderBy(
            asc(semesterCreditSchemesTable.admissionYear),
            asc(semesterCreditSchemesTable.branch),
            asc(semesterCreditSchemesTable.semester),
          )
          .limit(limit)
          .offset(offset),
        db
          .select({ value: count() })
          .from(semesterCreditSchemesTable)
          .where(where),
      ]);

      return paginated(c, toPage(items, total?.value ?? 0, query));
    },
  )

  .post(
    "/credit-schemes",
    requireCapability(Capability.COHORT_PROMOTE),
    validate("json", createSemesterCreditSchemeSchema),
    async (c) => {
      const user = getUser(c);
      const body = c.req.valid("json");

      const [scheme] = await db
        .insert(semesterCreditSchemesTable)
        .values(body)
        .onConflictDoUpdate({
          target: [
            semesterCreditSchemesTable.branch,
            semesterCreditSchemesTable.admissionYear,
            semesterCreditSchemesTable.semester,
          ],
          set: { totalCredits: body.totalCredits },
        })
        .returning();

      await createAuditLog({
        userId: user.id,
        action: AuditAction.CREATE,
        entity: AuditEntity.SEMESTER_CREDIT_SCHEME,
        entityId: scheme.id,
        metadata: { ...body },
      });
      return ok(c, scheme, 201);
    },
  )

  .patch(
    "/credit-schemes/:id",
    requireCapability(Capability.COHORT_PROMOTE),
    validate("json", updateSemesterCreditSchemeSchema),
    async (c) => {
      const user = getUser(c);
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const [before] = await db
        .select()
        .from(semesterCreditSchemesTable)
        .where(eq(semesterCreditSchemesTable.id, id))
        .limit(1);
      if (!before) return fail(c, "NOT_FOUND", "Credit scheme not found", 404);

      const [updated] = await db
        .update(semesterCreditSchemesTable)
        .set(body)
        .where(eq(semesterCreditSchemesTable.id, id))
        .returning();

      await createAuditLog({
        userId: user.id,
        action: AuditAction.UPDATE,
        entity: AuditEntity.SEMESTER_CREDIT_SCHEME,
        entityId: id,
        metadata: diff(before, updated),
      });
      return ok(c, updated);
    },
  )

  .post(
    "/promotions",
    requireCapability(Capability.COHORT_PROMOTE),
    validate("json", promoteSchema),
    async (c) => {
      const user = getUser(c);
      const body = c.req.valid("json");

      if (body.creditSchemes?.length)
        for (const scheme of body.creditSchemes)
          await db
            .insert(semesterCreditSchemesTable)
            .values(scheme)
            .onConflictDoUpdate({
              target: [
                semesterCreditSchemesTable.branch,
                semesterCreditSchemesTable.admissionYear,
                semesterCreditSchemesTable.semester,
              ],
              set: { totalCredits: scheme.totalCredits },
            });

      const filters: SQL[] = [
        isNull(studentsTable.deletedAt),
        eq(studentsTable.admissionYear, body.admissionYear),
        eq(studentsTable.status, StudentStatus.ACTIVE),
      ];
      if (body.branch) filters.push(eq(studentsTable.branch, body.branch));

      const cohort = await db
        .select({
          id: studentsTable.id,
          branch: studentsTable.branch,
          semester: studentsTable.semester,
        })
        .from(studentsTable)
        .where(and(...filters));

      if (cohort.length === 0)
        return ok(c, {
          promoted: 0,
          graduated: 0,
          missingSchemes: [],
          message: "No active students matched that cohort",
        });

      const advancing = cohort.filter((s) => s.semester < SEMESTER_MAX);
      const graduating = cohort.filter((s) => s.semester >= SEMESTER_MAX);

      const targets = new Map<string, { branch: Branch; semester: number }>();
      for (const student of advancing) {
        const semester = student.semester + 1;
        targets.set(`${student.branch}:${semester}`, {
          branch: student.branch,
          semester,
        });
      }

      const existing = await db
        .select({
          branch: semesterCreditSchemesTable.branch,
          semester: semesterCreditSchemesTable.semester,
        })
        .from(semesterCreditSchemesTable)
        .where(
          eq(semesterCreditSchemesTable.admissionYear, body.admissionYear),
        );
      const have = new Set(
        existing.map((row) => `${row.branch}:${row.semester}`),
      );

      const missingSchemes = [...targets.entries()]
        .filter(([key]) => !have.has(key))
        .map(([, value]) => value);

      if (missingSchemes.length > 0 && body.requireSchemes)
        return fail(
          c,
          "NO_CREDIT_SCHEME",
          `Promotion refused: no credit scheme for ${missingSchemes
            .map((m) => `${m.branch} semester ${m.semester}`)
            .join(
              ", ",
            )} (admission year ${body.admissionYear}). Set them first, or resend with requireSchemes: false.`,
          409,
          { missingSchemes },
        );

      const bySemester = new Map<number, string[]>();
      for (const student of advancing) {
        const ids = bySemester.get(student.semester) ?? [];
        ids.push(student.id);
        bySemester.set(student.semester, ids);
      }

      for (const [semester, ids] of bySemester)
        await db
          .update(studentsTable)
          .set({ semester: semester + 1 })
          .where(inArray(studentsTable.id, ids));

      if (graduating.length > 0)
        await db
          .update(studentsTable)
          .set({ status: StudentStatus.ALUMNI })
          .where(
            inArray(
              studentsTable.id,
              graduating.map((s) => s.id),
            ),
          );

      await createAuditLog({
        userId: user.id,
        action: AuditAction.PROMOTE,
        entity: AuditEntity.STUDENT,
        entityId: `cohort:${body.admissionYear}:${body.branch ?? "ALL"}`,
        metadata: {
          admissionYear: body.admissionYear,
          branch: body.branch ?? null,
          promoted: advancing.length,
          graduated: graduating.length,
          missingSchemes,
        },
      });

      return ok(c, {
        promoted: advancing.length,
        graduated: graduating.length,
        missingSchemes,
      });
    },
  );

export default admin;
