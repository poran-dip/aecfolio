import { resultsTable } from "@aecfolio/db";
import {
  Capability,
  createResultSchema,
  updateResultSchema,
  VerificationStatus,
} from "@aecfolio/shared";
import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { getStudentForUser } from "../lib/actor";
import { AuditAction, AuditEntity, createAuditLog, diff } from "../lib/audit";
import { db } from "../lib/db";
import {
  findSchemeForCohort,
  missingSchemeMessage,
  recomputeCgpa,
} from "../lib/grading";
import { resolveOwnStudent, resolveReadScope } from "../lib/ownership";
import { projectReviewable, viewForActor } from "../lib/profile";
import { fail, getUser, ok } from "../lib/response";
import { RESET_TO_PENDING } from "../lib/review";
import { validate } from "../lib/validate";
import { requireAuth, requireCapability } from "../middleware/capability";
import type { AppEnv } from "../types/context";

async function findOwned(id: string, studentId: string) {
  const [row] = await db
    .select()
    .from(resultsTable)
    .where(and(eq(resultsTable.id, id), isNull(resultsTable.deletedAt)))
    .limit(1);
  if (!row) return { row: null, owned: false };
  return { row, owned: row.studentId === studentId };
}

const results = new Hono<AppEnv>()
  .get("/", requireAuth(), async (c) => {
    const user = getUser(c);
    const scope = await resolveReadScope(c, user, c.req.query("studentId"));
    if (!scope.ok) return scope.response;

    const rows = await db
      .select()
      .from(resultsTable)
      .where(
        and(
          eq(resultsTable.studentId, scope.studentId),
          isNull(resultsTable.deletedAt),
        ),
      );

    return ok(c, projectReviewable(rows, viewForActor(user, scope.isOwn)));
  })

  .post(
    "/",
    requireCapability(Capability.RESULT_SUBMIT_SELF),
    validate("json", createResultSchema),
    async (c) => {
      const user = getUser(c);
      const body = c.req.valid("json");

      const student = await getStudentForUser(user.id);
      if (!student)
        return fail(c, "NOT_FOUND", "Student profile not found", 404);

      const cohort = {
        branch: student.branch,
        admissionYear: student.admissionYear,
        semester: body.semester,
      };

      const scheme = await findSchemeForCohort(cohort);
      if (!scheme)
        return fail(c, "NO_CREDIT_SCHEME", missingSchemeMessage(cohort), 409);

      const [existing] = await db
        .select({ id: resultsTable.id })
        .from(resultsTable)
        .where(
          and(
            eq(resultsTable.studentId, student.id),
            eq(resultsTable.semester, body.semester),
          ),
        )
        .limit(1);
      if (existing)
        return fail(
          c,
          "CONFLICT",
          `A result for semester ${body.semester} already exists`,
          409,
        );

      const [result] = await db
        .insert(resultsTable)
        .values({
          studentId: student.id,
          semester: body.semester,
          pendingSgpa: body.pendingSgpa,
          schemeId: scheme.id,
        })
        .returning();

      return ok(c, result, 201);
    },
  )

  .get("/:id", requireAuth(), async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");

    const [row] = await db
      .select()
      .from(resultsTable)
      .where(and(eq(resultsTable.id, id), isNull(resultsTable.deletedAt)))
      .limit(1);
    if (!row) return fail(c, "NOT_FOUND", "Result not found", 404);

    const scope = await resolveReadScope(c, user, row.studentId);
    if (!scope.ok) return scope.response;

    const [projected] = projectReviewable(
      [row],
      viewForActor(user, scope.isOwn),
    );
    if (!projected) return fail(c, "NOT_FOUND", "Result not found", 404);
    return ok(c, projected);
  })

  .patch(
    "/:id",
    requireCapability(Capability.RESULT_SUBMIT_SELF),
    validate("json", updateResultSchema),
    async (c) => {
      const user = getUser(c);
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const scope = await resolveOwnStudent(c, user);
      if (!scope.ok) return scope.response;

      const { row, owned } = await findOwned(id, scope.studentId);
      if (!row) return fail(c, "NOT_FOUND", "Result not found", 404);
      if (!owned) return fail(c, "FORBIDDEN", "Forbidden", 403);

      const [updated] = await db
        .update(resultsTable)
        .set({ ...body, ...RESET_TO_PENDING, sgpa: null })
        .where(eq(resultsTable.id, id))
        .returning();

      if (row.status === VerificationStatus.VERIFIED) {
        await recomputeCgpa(scope.studentId);
        await createAuditLog({
          userId: user.id,
          action: AuditAction.UPDATE,
          entity: AuditEntity.RESULT,
          entityId: id,
          metadata: diff(row, updated),
        });
      }
      return ok(c, updated);
    },
  )

  .delete(
    "/:id",
    requireCapability(Capability.RESULT_SUBMIT_SELF),
    async (c) => {
      const user = getUser(c);
      const id = c.req.param("id");

      const scope = await resolveOwnStudent(c, user);
      if (!scope.ok) return scope.response;

      const { row, owned } = await findOwned(id, scope.studentId);
      if (!row) return fail(c, "NOT_FOUND", "Result not found", 404);
      if (!owned) return fail(c, "FORBIDDEN", "Forbidden", 403);

      const [deleted] = await db
        .update(resultsTable)
        .set({ deletedAt: new Date() })
        .where(eq(resultsTable.id, id))
        .returning();

      if (row.status === VerificationStatus.VERIFIED) {
        await recomputeCgpa(scope.studentId);

        await createAuditLog({
          userId: user.id,
          action: AuditAction.DELETE,
          entity: AuditEntity.RESULT,
          entityId: id,
        });
      }

      return ok(c, deleted);
    },
  );

export default results;
