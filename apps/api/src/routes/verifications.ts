import {
  achievementsTable,
  certificationsTable,
  resultsTable,
  studentsTable,
  usersTable,
} from "@aecfolio/db";
import {
  Branch,
  bulkReviewSchema,
  Capability,
  reviewDecisionSchema,
  VerificationStatus,
} from "@aecfolio/shared";
import { and, count, desc, eq, isNull, type SQL, sql } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import { Hono } from "hono";
import { z } from "zod";
import { getActorDepartment } from "../lib/actor";
import { db } from "../lib/db";
import { paginationQuerySchema, toOffset, toPage } from "../lib/pagination";
import { fail, getUser, ok } from "../lib/response";
import { ReviewableKind, reviewClaims } from "../lib/review";
import { validate } from "../lib/validate";
import { requireCapability } from "../middleware/capability";
import type { AppEnv } from "../types/context";

const KIND_BY_SEGMENT: Record<string, ReviewableKind> = {
  results: ReviewableKind.RESULT,
  achievements: ReviewableKind.ACHIEVEMENT,
  certifications: ReviewableKind.CERTIFICATION,
};

const queueQuerySchema = paginationQuerySchema.extend({
  kind: z.enum(["results", "achievements", "certifications"]).optional(),
  department: z.enum(Branch).optional(),
  allDepartments: z
    .union([z.literal("true"), z.literal("false")])
    .transform((v) => v === "true")
    .optional(),
});

function studentScope(branch: Branch | undefined): SQL[] {
  const filters: SQL[] = [isNull(studentsTable.deletedAt)];
  if (branch) filters.push(eq(studentsTable.branch, branch));
  return filters;
}

const verifications = new Hono<AppEnv>()
  .get(
    "/",
    requireCapability(Capability.CLAIM_REVIEW),
    validate("query", queueQuerySchema),
    async (c) => {
      const user = getUser(c);
      const query = c.req.valid("query");

      let branch = query.department;
      if (!branch && !query.allDepartments)
        branch = (await getActorDepartment(user)) ?? undefined;

      const scope = studentScope(branch);
      const pending = VerificationStatus.PENDING;

      const resultRows = db
        .select({
          kind: sql<string>`'results'`.as("kind"),
          id: resultsTable.id,
          studentId: studentsTable.id,
          rollNo: studentsTable.rollNo,
          branch: studentsTable.branch,
          studentName: usersTable.name,
          title: sql<string>`'Semester ' || ${resultsTable.semester}`.as(
            "title",
          ),
          detail: sql<string | null>`${resultsTable.pendingSgpa}::text`.as(
            "detail",
          ),
          proofKey: sql<string | null>`null::text`.as("proof_key"),
          createdAt: resultsTable.createdAt,
        })
        .from(resultsTable)
        .innerJoin(studentsTable, eq(resultsTable.studentId, studentsTable.id))
        .innerJoin(usersTable, eq(studentsTable.userId, usersTable.id))
        .where(
          and(
            eq(resultsTable.status, pending),
            isNull(resultsTable.deletedAt),
            ...scope,
          ),
        );

      const achievementRows = db
        .select({
          kind: sql<string>`'achievements'`.as("kind"),
          id: achievementsTable.id,
          studentId: studentsTable.id,
          rollNo: studentsTable.rollNo,
          branch: studentsTable.branch,
          studentName: usersTable.name,
          title: achievementsTable.title,
          detail: achievementsTable.description,
          proofKey: achievementsTable.proofKey,
          createdAt: achievementsTable.createdAt,
        })
        .from(achievementsTable)
        .innerJoin(
          studentsTable,
          eq(achievementsTable.studentId, studentsTable.id),
        )
        .innerJoin(usersTable, eq(studentsTable.userId, usersTable.id))
        .where(
          and(
            eq(achievementsTable.status, pending),
            isNull(achievementsTable.deletedAt),
            ...scope,
          ),
        );

      const certificationRows = db
        .select({
          kind: sql<string>`'certifications'`.as("kind"),
          id: certificationsTable.id,
          studentId: studentsTable.id,
          rollNo: studentsTable.rollNo,
          branch: studentsTable.branch,
          studentName: usersTable.name,
          title: certificationsTable.name,
          detail: certificationsTable.issuer,
          proofKey: certificationsTable.proofKey,
          createdAt: certificationsTable.createdAt,
        })
        .from(certificationsTable)
        .innerJoin(
          studentsTable,
          eq(certificationsTable.studentId, studentsTable.id),
        )
        .innerJoin(usersTable, eq(studentsTable.userId, usersTable.id))
        .where(
          and(
            eq(certificationsTable.status, pending),
            isNull(certificationsTable.deletedAt),
            ...scope,
          ),
        );

      const single =
        query.kind === "results"
          ? resultRows
          : query.kind === "achievements"
            ? achievementRows
            : query.kind === "certifications"
              ? certificationRows
              : null;

      const { limit, offset } = toOffset(query);
      const newestFirst = desc(sql`created_at`);

      const [items, counts] = await Promise.all([
        single
          ? single.orderBy(newestFirst).limit(limit).offset(offset)
          : unionAll(resultRows, achievementRows, certificationRows)
              .orderBy(newestFirst)
              .limit(limit)
              .offset(offset),
        Promise.all([
          db
            .select({ value: count() })
            .from(resultsTable)
            .innerJoin(
              studentsTable,
              eq(resultsTable.studentId, studentsTable.id),
            )
            .where(
              and(
                eq(resultsTable.status, pending),
                isNull(resultsTable.deletedAt),
                ...scope,
              ),
            ),
          db
            .select({ value: count() })
            .from(achievementsTable)
            .innerJoin(
              studentsTable,
              eq(achievementsTable.studentId, studentsTable.id),
            )
            .where(
              and(
                eq(achievementsTable.status, pending),
                isNull(achievementsTable.deletedAt),
                ...scope,
              ),
            ),
          db
            .select({ value: count() })
            .from(certificationsTable)
            .innerJoin(
              studentsTable,
              eq(certificationsTable.studentId, studentsTable.id),
            )
            .where(
              and(
                eq(certificationsTable.status, pending),
                isNull(certificationsTable.deletedAt),
                ...scope,
              ),
            ),
        ]),
      ]);

      const [resultCount, achievementCount, certificationCount] = counts.map(
        ([row]) => row?.value ?? 0,
      );

      const total =
        query.kind === "results"
          ? resultCount
          : query.kind === "achievements"
            ? achievementCount
            : query.kind === "certifications"
              ? certificationCount
              : resultCount + achievementCount + certificationCount;

      return ok(c, {
        ...toPage(items, total, query),
        byKind: {
          results: resultCount,
          achievements: achievementCount,
          certifications: certificationCount,
        },
      });
    },
  )

  .patch(
    "/:kind/:id",
    requireCapability(Capability.CLAIM_REVIEW),
    validate("json", reviewDecisionSchema),
    async (c) => {
      const user = getUser(c);
      const kind = KIND_BY_SEGMENT[c.req.param("kind")];
      if (!kind) return fail(c, "NOT_FOUND", "Unknown claim type", 404);

      const outcome = await reviewClaims(
        kind,
        [c.req.param("id")],
        c.req.valid("json"),
        user.id,
      );

      if (outcome.reviewed.length === 0) {
        const [skipped] = outcome.skipped;
        const status = skipped?.reason === "Not found" ? 404 : 409;
        return fail(
          c,
          status === 404 ? "NOT_FOUND" : "CONFLICT",
          skipped?.reason ?? "Nothing to review",
          status,
        );
      }

      return ok(c, outcome);
    },
  )

  .patch(
    "/:kind",
    requireCapability(Capability.CLAIM_REVIEW),
    validate("json", bulkReviewSchema),
    async (c) => {
      const user = getUser(c);
      const kind = KIND_BY_SEGMENT[c.req.param("kind")];
      if (!kind) return fail(c, "NOT_FOUND", "Unknown claim type", 404);

      const { ids, decision } = c.req.valid("json");
      const outcome = await reviewClaims(kind, ids, decision, user.id);

      return ok(c, outcome);
    },
  );

export default verifications;
