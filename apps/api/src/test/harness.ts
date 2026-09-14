import {
  achievementsTable,
  certificationsTable,
  facultyTable,
  resultsTable,
  semesterCreditSchemesTable,
  studentsTable,
  usersTable,
} from "@aecfolio/db";
import {
  type Branch,
  type Course,
  Role,
  type StudentStatus,
  type VerificationStatus,
} from "@aecfolio/shared";
import { sql } from "drizzle-orm";
import { createApp } from "../app";
import { db } from "../lib/db";
import type { Actor, SessionResolver } from "../lib/session";

let counter = 0;
const unique = (prefix: string) => `${prefix}-${++counter}-${Date.now()}`;

export async function resetDatabase() {
  const rows = await db.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public' and tablename <> '__drizzle_migrations'`,
  );
  const tables = rows.rows.map((row) => `"${row.tablename}"`);
  if (tables.length === 0) return;
  await db.execute(
    sql.raw(`TRUNCATE TABLE ${tables.join(", ")} RESTART IDENTITY CASCADE`),
  );
}

export function asUser(actor: Actor | null) {
  const resolver: SessionResolver = async () =>
    actor ? { user: actor, sessionId: "test-session" } : null;
  const app = createApp({ sessionResolver: resolver });

  const call = async (
    method: string,
    path: string,
    body?: unknown,
    // biome-ignore lint/suspicious/noExplicitAny: assertions read arbitrary response shapes
  ): Promise<{ status: number; body: any }> => {
    const response = await app.request(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    return {
      status: response.status,
      body: text ? JSON.parse(text) : null,
    };
  };

  return {
    get: (path: string) => call("GET", path),
    post: (path: string, body?: unknown) => call("POST", path, body ?? {}),
    patch: (path: string, body?: unknown) => call("PATCH", path, body ?? {}),
    delete: (path: string) => call("DELETE", path),
  };
}

export async function createUser(
  role: Role,
  overrides: Partial<{ name: string; email: string }> = {},
): Promise<Actor> {
  const [user] = await db
    .insert(usersTable)
    .values({
      name: overrides.name ?? `${role} User`,
      email: overrides.email ?? `${unique(role.toLowerCase())}@aec.ac.in`,
      emailVerified: true,
      role,
    })
    .returning();

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function createStudent(
  overrides: Partial<{
    branch: Branch;
    course: Course;
    semester: number;
    admissionYear: number;
    status: StudentStatus;
    rollNo: string;
  }> = {},
) {
  const actor = await createUser(Role.STUDENT);
  const [student] = await db
    .insert(studentsTable)
    .values({
      userId: actor.id,
      rollNo: overrides.rollNo ?? unique("ROLL"),
      course: overrides.course ?? "BTECH",
      branch: overrides.branch ?? "CSE",
      semester: overrides.semester ?? 3,
      admissionYear: overrides.admissionYear ?? 2023,
      status: overrides.status ?? "ACTIVE",
      skills: [],
    })
    .returning();

  return { actor, student };
}

export async function createStaff(
  role: Exclude<Role, "STUDENT">,
  overrides: Partial<{ department: Branch | null }> = {},
) {
  const actor = await createUser(role);
  const [faculty] = await db
    .insert(facultyTable)
    .values({
      userId: actor.id,
      employeeId: unique("EMP"),
      designation: "Professor",
      department:
        overrides.department === undefined ? "CSE" : overrides.department,
    })
    .returning();

  return { actor, faculty };
}

export async function createCreditScheme(
  overrides: Partial<{
    branch: Branch;
    admissionYear: number;
    semester: number;
    totalCredits: number;
  }> = {},
) {
  const [scheme] = await db
    .insert(semesterCreditSchemesTable)
    .values({
      branch: overrides.branch ?? "CSE",
      admissionYear: overrides.admissionYear ?? 2023,
      semester: overrides.semester ?? 3,
      totalCredits: overrides.totalCredits ?? 20,
    })
    .returning();
  return scheme;
}

export async function createAchievement(
  studentId: string,
  overrides: Partial<{
    status: VerificationStatus;
    reviewedBy: string;
    rejectionReason: string;
    title: string;
    proofKey: string;
  }> = {},
) {
  const status = overrides.status ?? "PENDING";
  const reviewed = status !== "PENDING";

  const [achievement] = await db
    .insert(achievementsTable)
    .values({
      studentId,
      title: overrides.title ?? unique("Achievement"),
      description: "Something that happened",
      proofKey: overrides.proofKey ?? null,
      status,
      reviewedBy: reviewed ? (overrides.reviewedBy ?? null) : null,
      reviewedAt: reviewed ? new Date() : null,
      rejectionReason:
        status === "REJECTED"
          ? (overrides.rejectionReason ?? "Not enough proof")
          : null,
    })
    .returning();

  return achievement;
}

export async function createCertification(
  studentId: string,
  overrides: Partial<{ status: VerificationStatus; reviewedBy: string }> = {},
) {
  const status = overrides.status ?? "PENDING";
  const reviewed = status !== "PENDING";

  const [certification] = await db
    .insert(certificationsTable)
    .values({
      studentId,
      name: unique("Certification"),
      issuer: "Some Institute",
      status,
      reviewedBy: reviewed ? (overrides.reviewedBy ?? null) : null,
      reviewedAt: reviewed ? new Date() : null,
      rejectionReason: status === "REJECTED" ? "Unreadable scan" : null,
    })
    .returning();

  return certification;
}

export async function createResult(
  studentId: string,
  schemeId: string,
  overrides: Partial<{
    semester: number;
    pendingSgpa: number;
    sgpa: number;
    status: VerificationStatus;
    reviewedBy: string;
  }> = {},
) {
  const status = overrides.status ?? "PENDING";
  const reviewed = status !== "PENDING";

  const [result] = await db
    .insert(resultsTable)
    .values({
      studentId,
      schemeId,
      semester: overrides.semester ?? 3,
      pendingSgpa: overrides.pendingSgpa ?? 8.5,
      sgpa: status === "VERIFIED" ? (overrides.sgpa ?? 8.5) : null,
      status,
      reviewedBy: reviewed ? (overrides.reviewedBy ?? null) : null,
      reviewedAt: reviewed ? new Date() : null,
      rejectionReason: status === "REJECTED" ? "Marksheet mismatch" : null,
    })
    .returning();

  return result;
}
