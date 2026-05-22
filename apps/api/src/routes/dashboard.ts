import {
  achievementsTable,
  certificationsTable,
  resultsTable,
  studentsTable,
  usersTable,
} from "@aecfolio/db";
import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../lib/db";
import { fail, ok } from "../lib/response";
import { requireRole } from "../middleware/role";
import type { AppEnv } from "../types/context";

const dashboard = new Hono<AppEnv>().get(
  "/",
  requireRole("FACULTY"),
  async (c) => {
    try {
      const [students, pendingUsers] = await Promise.all([
        db
          .select({
            id: studentsTable.id,
            rollNo: studentsTable.rollNo,
            course: studentsTable.course,
            branch: studentsTable.branch,
            semester: studentsTable.semester,
            cgpa: studentsTable.cgpa,
            name: usersTable.name,
            unverifiedResults: db.$count(
              resultsTable,
              and(
                eq(resultsTable.studentId, studentsTable.id),
                eq(resultsTable.verified, false),
              ),
            ),
            unverifiedAchievements: db.$count(
              achievementsTable,
              and(
                eq(achievementsTable.studentId, studentsTable.id),
                eq(achievementsTable.verified, false),
                isNull(achievementsTable.deletedAt),
              ),
            ),
            unverifiedCertifications: db.$count(
              certificationsTable,
              and(
                eq(certificationsTable.studentId, studentsTable.id),
                eq(certificationsTable.verified, false),
                isNull(certificationsTable.deletedAt),
              ),
            ),
          })
          .from(studentsTable)
          .innerJoin(usersTable, eq(studentsTable.userId, usersTable.id))
          .where(
            and(
              isNull(studentsTable.deletedAt),
              eq(usersTable.role, "STUDENT"),
            ),
          ),
        db.query.usersTable.findMany({
          where: (u, { and, isNull, eq }) =>
            and(isNull(u.deletedAt), eq(u.role, "PENDING")),
          columns: { id: true },
        }),
      ]);

      const formatted = students.map((s) => ({
        id: s.id,
        name: s.name ?? "Unknown",
        rollNo: s.rollNo,
        course: s.course,
        branch: s.branch,
        semester: s.semester,
        cgpa: s.cgpa,
        unverifiedResults: s.unverifiedResults,
        unverifiedAchievements: s.unverifiedAchievements,
        unverifiedCertifications: s.unverifiedCertifications,
      }));

      return ok(c, { students: formatted, pendingUsers: pendingUsers.length });
    } catch (e) {
      console.error(e);
      return fail(c, "INTERNAL", "Failed to fetch dashboard data", 500);
    }
  },
);

export default dashboard;
