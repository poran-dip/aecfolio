import { Role } from "@aecfolio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { Capability, hasCapability } from "../lib/capabilities";
import type { Actor } from "../lib/session";
import {
  asUser,
  createAchievement,
  createCreditScheme,
  createStaff,
  createStudent,
  resetDatabase,
} from "../test/harness";

type Method = "get" | "post" | "patch" | "delete";

type Endpoint = {
  name: string;
  capability: Capability;
  method: Method;
  path: (ctx: Fixtures) => string;
  body?: (ctx: Fixtures) => unknown;
};

type Fixtures = Awaited<ReturnType<typeof seed>>;

async function seed() {
  const admin = await createStaff(Role.ADMIN);
  const mod = await createStaff(Role.MOD);
  const faculty = await createStaff(Role.FACULTY);
  const { actor: student, student: studentRow } = await createStudent();
  const scheme = await createCreditScheme();
  const achievement = await createAchievement(studentRow.id);

  return {
    actors: {
      [Role.STUDENT]: student,
      [Role.FACULTY]: faculty.actor,
      [Role.MOD]: mod.actor,
      [Role.ADMIN]: admin.actor,
    } satisfies Record<Role, Actor>,
    studentRow,
    facultyRow: faculty.faculty,
    modRow: mod.faculty,
    adminRow: admin.faculty,
    scheme,
    achievement,
  };
}

const ENDPOINTS: Endpoint[] = [
  {
    name: "PATCH /me/student",
    capability: Capability.PROFILE_WRITE_SELF,
    method: "patch",
    path: () => "/api/me/student",
    body: () => ({ bio: "Hello" }),
  },
  {
    name: "POST /achievements",
    capability: Capability.PROFILE_WRITE_SELF,
    method: "post",
    path: () => "/api/achievements",
    body: () => ({ title: "A thing", description: "It happened" }),
  },
  {
    name: "POST /results",
    capability: Capability.RESULT_SUBMIT_SELF,
    method: "post",
    path: () => "/api/results",
    body: () => ({ semester: 3, pendingSgpa: 8.1 }),
  },
  {
    name: "GET /students",
    capability: Capability.STUDENT_READ,
    method: "get",
    path: () => "/api/students?allDepartments=true",
  },
  {
    name: "GET /students/:id",
    capability: Capability.STUDENT_READ,
    method: "get",
    path: (ctx) => `/api/students/${ctx.studentRow.id}`,
  },
  {
    name: "POST /students",
    capability: Capability.STUDENT_MANAGE,
    method: "post",
    path: () => "/api/students",
    body: () => ({
      name: "New Student",
      email: `new-${Math.random().toString(36).slice(2)}@aec.ac.in`,
      rollNo: `R-${Math.random().toString(36).slice(2)}`,
      course: "BTECH",
      branch: "CSE",
      semester: 1,
      admissionYear: 2025,
    }),
  },
  {
    name: "POST /students/import",
    capability: Capability.STUDENT_MANAGE,
    method: "post",
    path: () => "/api/students/import",
    body: () => ({
      students: [
        {
          name: "Imported",
          email: `imported-${Math.random().toString(36).slice(2)}@aec.ac.in`,
          rollNo: `I-${Math.random().toString(36).slice(2)}`,
          course: "BTECH",
          branch: "CSE",
          semester: 1,
          admissionYear: 2025,
        },
      ],
    }),
  },
  {
    name: "PATCH /students/:id",
    capability: Capability.ACADEMIC_RECTIFY,
    method: "patch",
    path: (ctx) => `/api/students/${ctx.studentRow.id}`,
    body: () => ({ semester: 4 }),
  },
  {
    name: "DELETE /students/:id",
    capability: Capability.STUDENT_MANAGE,
    method: "delete",
    path: (ctx) => `/api/students/${ctx.studentRow.id}`,
  },
  {
    name: "GET /verifications",
    capability: Capability.CLAIM_REVIEW,
    method: "get",
    path: () => "/api/verifications?allDepartments=true",
  },
  {
    name: "PATCH /verifications/achievements/:id",
    capability: Capability.CLAIM_REVIEW,
    method: "patch",
    path: (ctx) => `/api/verifications/achievements/${ctx.achievement.id}`,
    body: () => ({ status: "VERIFIED" }),
  },
  {
    name: "PATCH /verifications/achievements",
    capability: Capability.CLAIM_REVIEW,
    method: "patch",
    path: () => "/api/verifications/achievements",
    body: (ctx) => ({
      ids: [ctx.achievement.id],
      decision: { status: "VERIFIED" },
    }),
  },
  {
    name: "GET /faculty",
    capability: Capability.FACULTY_MANAGE,
    method: "get",
    path: () => "/api/faculty",
  },
  {
    name: "POST /faculty",
    capability: Capability.FACULTY_MANAGE,
    method: "post",
    path: () => "/api/faculty",
    body: () => ({
      name: "New Faculty",
      email: `fac-${Math.random().toString(36).slice(2)}@aec.ac.in`,
      employeeId: `E-${Math.random().toString(36).slice(2)}`,
      department: "CSE",
    }),
  },
  {
    name: "PATCH /faculty/:id",
    capability: Capability.FACULTY_MANAGE,
    method: "patch",
    path: (ctx) => `/api/faculty/${ctx.facultyRow.id}`,
    body: () => ({ designation: "Senior Professor" }),
  },
  {
    name: "DELETE /faculty/:id",
    capability: Capability.FACULTY_MANAGE,
    method: "delete",
    path: (ctx) => `/api/faculty/${ctx.facultyRow.id}`,
  },
  {
    name: "GET /users",
    capability: Capability.FACULTY_MANAGE,
    method: "get",
    path: () => "/api/users",
  },
  {
    name: "GET /audit-logs",
    capability: Capability.AUDIT_READ,
    method: "get",
    path: () => "/api/audit-logs",
  },
  {
    name: "GET /admin/credit-schemes",
    capability: Capability.COHORT_PROMOTE,
    method: "get",
    path: () => "/api/admin/credit-schemes",
  },
  {
    name: "POST /admin/credit-schemes",
    capability: Capability.COHORT_PROMOTE,
    method: "post",
    path: () => "/api/admin/credit-schemes",
    body: () => ({
      branch: "ETE",
      admissionYear: 2023,
      semester: 4,
      totalCredits: 22,
    }),
  },
  {
    name: "POST /admin/promotions",
    capability: Capability.COHORT_PROMOTE,
    method: "post",
    path: () => "/api/admin/promotions",
    body: () => ({ admissionYear: 2023, requireSchemes: false }),
  },
];

const ROLES = [Role.STUDENT, Role.FACULTY, Role.MOD, Role.ADMIN] as const;

describe("authorization matrix", () => {
  beforeEach(resetDatabase);

  for (const endpoint of ENDPOINTS) {
    describe(endpoint.name, () => {
      for (const role of ROLES) {
        const allowed = hasCapability(role, endpoint.capability);

        it(`${allowed ? "allows" : "denies"} ${role}`, async () => {
          const ctx = await seed();
          const client = asUser(ctx.actors[role]);
          const path = endpoint.path(ctx);
          const body = endpoint.body?.(ctx);

          const res =
            endpoint.method === "get"
              ? await client.get(path)
              : endpoint.method === "delete"
                ? await client.delete(path)
                : endpoint.method === "post"
                  ? await client.post(path, body)
                  : await client.patch(path, body);

          if (allowed) {
            expect(
              res.status,
              `${role} should not be refused: ${JSON.stringify(res.body)}`,
            ).not.toBe(403);
          } else {
            expect(
              res.status,
              `${role} should be refused, got ${JSON.stringify(res.body)}`,
            ).toBe(403);
            expect(res.body.error.code).toBe("FORBIDDEN");
          }
        });
      }

      it("denies an unauthenticated caller", async () => {
        const ctx = await seed();
        const client = asUser(null);
        const path = endpoint.path(ctx);
        const body = endpoint.body?.(ctx);

        const res =
          endpoint.method === "get"
            ? await client.get(path)
            : endpoint.method === "delete"
              ? await client.delete(path)
              : endpoint.method === "post"
                ? await client.post(path, body)
                : await client.patch(path, body);

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe("UNAUTHENTICATED");
      });
    });
  }
});
