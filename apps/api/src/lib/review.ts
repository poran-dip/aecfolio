import {
  achievementsTable,
  certificationsTable,
  resultsTable,
} from "@aecfolio/db";
import { type ReviewDecisionInput, VerificationStatus } from "@aecfolio/shared";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { AuditAction, AuditEntity, createAuditLogs } from "./audit";
import { db } from "./db";
import { recomputeCgpa } from "./grading";

export const ReviewableKind = {
  RESULT: "result",
  ACHIEVEMENT: "achievement",
  CERTIFICATION: "certification",
} as const;

export type ReviewableKind =
  (typeof ReviewableKind)[keyof typeof ReviewableKind];

const TABLES = {
  [ReviewableKind.RESULT]: resultsTable,
  [ReviewableKind.ACHIEVEMENT]: achievementsTable,
  [ReviewableKind.CERTIFICATION]: certificationsTable,
} as const;

const ENTITIES: Record<ReviewableKind, AuditEntity> = {
  [ReviewableKind.RESULT]: AuditEntity.RESULT,
  [ReviewableKind.ACHIEVEMENT]: AuditEntity.ACHIEVEMENT,
  [ReviewableKind.CERTIFICATION]: AuditEntity.CERTIFICATION,
};

export type ReviewOutcome = {
  reviewed: string[];
  skipped: { id: string; reason: string }[];
};

type Candidate = {
  id: string;
  studentId: string;
  status: string;
  pendingSgpa: number | null;
};

async function loadCandidates(
  kind: ReviewableKind,
  ids: string[],
): Promise<Candidate[]> {
  if (kind === ReviewableKind.RESULT) {
    const rows = await db
      .select({
        id: resultsTable.id,
        studentId: resultsTable.studentId,
        status: resultsTable.status,
        pendingSgpa: resultsTable.pendingSgpa,
      })
      .from(resultsTable)
      .where(
        and(inArray(resultsTable.id, ids), isNull(resultsTable.deletedAt)),
      );
    return rows;
  }

  const table = TABLES[kind];
  const rows = await db
    .select({
      id: table.id,
      studentId: table.studentId,
      status: table.status,
    })
    .from(table)
    .where(and(inArray(table.id, ids), isNull(table.deletedAt)));

  return rows.map((row) => ({ ...row, pendingSgpa: null }));
}

export async function reviewClaims(
  kind: ReviewableKind,
  ids: string[],
  decision: ReviewDecisionInput,
  reviewerId: string,
): Promise<ReviewOutcome> {
  const candidates = await loadCandidates(kind, ids);
  const byId = new Map(candidates.map((row) => [row.id, row]));

  const outcome: ReviewOutcome = { reviewed: [], skipped: [] };
  const eligible: Candidate[] = [];

  for (const id of ids) {
    const row = byId.get(id);
    if (!row) {
      outcome.skipped.push({ id, reason: "Not found" });
      continue;
    }
    if (row.status === decision.status) {
      outcome.skipped.push({
        id,
        reason: `Already ${decision.status.toLowerCase()}`,
      });
      continue;
    }
    if (
      kind === ReviewableKind.RESULT &&
      decision.status === VerificationStatus.VERIFIED &&
      row.pendingSgpa === null
    ) {
      outcome.skipped.push({
        id,
        reason: "No submitted SGPA to verify",
      });
      continue;
    }
    eligible.push(row);
  }

  if (eligible.length === 0) return outcome;

  const reviewedAt = new Date();
  const base = {
    status: decision.status,
    reviewedBy: reviewerId,
    reviewedAt,
    rejectionReason:
      decision.status === VerificationStatus.REJECTED
        ? decision.rejectionReason
        : null,
  };

  if (kind === ReviewableKind.RESULT) {
    for (const row of eligible) {
      await db
        .update(resultsTable)
        .set(
          decision.status === VerificationStatus.VERIFIED
            ? { ...base, sgpa: row.pendingSgpa }
            : base,
        )
        .where(eq(resultsTable.id, row.id));
    }
  } else {
    const table = TABLES[kind];
    await db
      .update(table)
      .set(base)
      .where(
        inArray(
          table.id,
          eligible.map((row) => row.id),
        ),
      );
  }

  outcome.reviewed = eligible.map((row) => row.id);

  await createAuditLogs(
    eligible.map((row) => ({
      userId: reviewerId,
      action:
        decision.status === VerificationStatus.VERIFIED
          ? AuditAction.VERIFY
          : AuditAction.REJECT,
      entity: ENTITIES[kind],
      entityId: row.id,
      metadata:
        decision.status === VerificationStatus.REJECTED
          ? { rejectionReason: decision.rejectionReason }
          : undefined,
    })),
  );

  if (kind === ReviewableKind.RESULT) {
    const students = new Set(eligible.map((row) => row.studentId));
    for (const studentId of students) await recomputeCgpa(studentId);
  }

  return outcome;
}

export const RESET_TO_PENDING = {
  status: VerificationStatus.PENDING,
  reviewedBy: null,
  reviewedAt: null,
} as const;
