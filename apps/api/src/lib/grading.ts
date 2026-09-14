import {
  resultsTable,
  semesterCreditSchemesTable,
  studentsTable,
} from "@aecfolio/db";
import { VerificationStatus } from "@aecfolio/shared";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./db";

export async function findSchemeForCohort(cohort: {
  branch: (typeof semesterCreditSchemesTable.$inferSelect)["branch"];
  admissionYear: number;
  semester: number;
}) {
  const [scheme] = await db
    .select()
    .from(semesterCreditSchemesTable)
    .where(
      and(
        eq(semesterCreditSchemesTable.branch, cohort.branch),
        eq(semesterCreditSchemesTable.admissionYear, cohort.admissionYear),
        eq(semesterCreditSchemesTable.semester, cohort.semester),
      ),
    )
    .limit(1);
  return scheme ?? null;
}

export function missingSchemeMessage(cohort: {
  branch: string;
  admissionYear: number;
  semester: number;
}) {
  return `No credit scheme for ${cohort.branch} ${cohort.admissionYear} semester ${cohort.semester} — an admin needs to set one before results for this cohort can be recorded.`;
}

export async function recomputeCgpa(studentId: string) {
  const rows = await db
    .select({
      sgpa: resultsTable.sgpa,
      totalCredits: semesterCreditSchemesTable.totalCredits,
    })
    .from(resultsTable)
    .innerJoin(
      semesterCreditSchemesTable,
      eq(resultsTable.schemeId, semesterCreditSchemesTable.id),
    )
    .where(
      and(
        eq(resultsTable.studentId, studentId),
        eq(resultsTable.status, VerificationStatus.VERIFIED),
        isNull(resultsTable.deletedAt),
      ),
    );

  let weighted = 0;
  let credits = 0;
  for (const row of rows) {
    if (row.sgpa === null) continue;
    weighted += row.sgpa * row.totalCredits;
    credits += row.totalCredits;
  }

  const cgpa = credits > 0 ? Number((weighted / credits).toFixed(2)) : null;

  await db
    .update(studentsTable)
    .set({ cgpa })
    .where(eq(studentsTable.id, studentId));

  return cgpa;
}
