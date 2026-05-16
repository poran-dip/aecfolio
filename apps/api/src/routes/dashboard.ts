import { Hono } from "hono";
import { db } from "../lib/db";
import { fail, ok } from "../lib/response";
import { requireRole } from "../middleware/role";
import type { AppEnv } from "../types/context";

const dashboard = new Hono<AppEnv>();

dashboard.get("/", requireRole("FACULTY"), async (c) => {
  try {
    const [students, pendingUsers] = await Promise.all([
      db.query.studentsTable.findMany({
        where: (s, { isNull }) => isNull(s.deletedAt),
        with: {
          user: { columns: { name: true } },
          results: { columns: { verified: true } },
          achievements: { columns: { verified: true } },
        },
      }),
      db.query.usersTable.findMany({
        where: (u, { and, isNull, eq }) =>
          and(isNull(u.deletedAt), eq(u.role, "PENDING")),
        columns: { id: true },
      }),
    ]);

    const formatted = students.map((s) => ({
      id: s.id,
      name: s.user?.name ?? "Unknown",
      rollNo: s.rollNo,
      course: s.course,
      branch: s.branch,
      semester: s.semester,
      cgpa: s.cgpa,
      unverifiedResults: s.results.filter((r) => !r.verified).length,
      unverifiedAchievements: s.achievements.filter((a) => !a.verified).length,
    }));

    return ok(c, { students: formatted, pendingUsers: pendingUsers.length });
  } catch (e) {
    console.error(e);
    return fail(c, "INTERNAL", "Failed to fetch dashboard data", 500);
  }
});

export default dashboard;
