import {
  auditLogsTable,
  resultsTable,
  studentsTable,
  usersTable,
} from "@aecfolio/db";
import { Role } from "@aecfolio/shared";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../lib/db";
import { pgMessage } from "../lib/db-error";
import {
  asUser,
  createAchievement,
  createCreditScheme,
  createResult,
  createStaff,
  createStudent,
  resetDatabase,
} from "../test/harness";

describe("verification", () => {
  beforeEach(resetDatabase);

  it("promotes pendingSgpa to sgpa and recomputes CGPA when a result is verified", async () => {
    const mod = await createStaff(Role.MOD);
    const { student } = await createStudent({ branch: "CSE" });

    const s3 = await createCreditScheme({ semester: 3, totalCredits: 20 });
    const s4 = await createCreditScheme({ semester: 4, totalCredits: 30 });
    const r3 = await createResult(student.id, s3.id, {
      semester: 3,
      pendingSgpa: 8,
    });
    const r4 = await createResult(student.id, s4.id, {
      semester: 4,
      pendingSgpa: 9,
    });

    await asUser(mod.actor).patch(`/api/verifications/results/${r3.id}`, {
      status: "VERIFIED",
    });
    await asUser(mod.actor).patch(`/api/verifications/results/${r4.id}`, {
      status: "VERIFIED",
    });

    const [row] = await db
      .select({ cgpa: studentsTable.cgpa })
      .from(studentsTable)
      .where(eq(studentsTable.id, student.id));

    // (8 * 20 + 9 * 30) / 50 = 8.6
    expect(row.cgpa).toBeCloseTo(8.6, 2);

    const view = await asUser(mod.actor).get(`/api/results/${r3.id}`);
    expect(view.body.data.sgpa).toBe(8);
    expect(view.body.data.status).toBe("VERIFIED");
  });

  it("refuses to verify a result with no submitted SGPA", async () => {
    const mod = await createStaff(Role.MOD);
    const { student } = await createStudent();
    const scheme = await createCreditScheme();
    const result = await createResult(student.id, scheme.id);

    await db
      .update(resultsTable)
      .set({ pendingSgpa: null })
      .where(eq(resultsTable.id, result.id));

    const res = await asUser(mod.actor).patch(
      `/api/verifications/results/${result.id}`,
      { status: "VERIFIED" },
    );
    expect(res.status).toBe(409);
  });

  it("reports missing and already-reviewed ids instead of counting them as done", async () => {
    const mod = await createStaff(Role.MOD);
    const { student } = await createStudent();

    const pending = await createAchievement(student.id);
    const alreadyVerified = await createAchievement(student.id, {
      status: "VERIFIED",
      reviewedBy: mod.actor.id,
    });

    const res = await asUser(mod.actor).patch(
      "/api/verifications/achievements",
      {
        ids: [pending.id, alreadyVerified.id, "does-not-exist"],
        decision: { status: "VERIFIED" },
      },
    );

    expect(res.status).toBe(200);
    expect(res.body.data.reviewed).toEqual([pending.id]);
    expect(res.body.data.skipped).toHaveLength(2);
    expect(
      res.body.data.skipped.map((s: { reason: string }) => s.reason).sort(),
    ).toEqual(["Already verified", "Not found"]);
  });

  it("requires a reason to reject", async () => {
    const mod = await createStaff(Role.MOD);
    const { student } = await createStudent();
    const achievement = await createAchievement(student.id);

    const missing = await asUser(mod.actor).patch(
      `/api/verifications/achievements/${achievement.id}`,
      { status: "REJECTED" },
    );
    expect(missing.status).toBe(400);
    expect(missing.body.error.code).toBe("VALIDATION");

    const withReason = await asUser(mod.actor).patch(
      `/api/verifications/achievements/${achievement.id}`,
      { status: "REJECTED", rejectionReason: "No supporting document" },
    );
    expect(withReason.status).toBe(200);
  });

  it("puts the submitted SGPA in the queue payload", async () => {
    const mod = await createStaff(Role.MOD);
    const { student } = await createStudent({ branch: "CSE" });
    const scheme = await createCreditScheme();
    await createResult(student.id, scheme.id, { pendingSgpa: 7.25 });

    const res = await asUser(mod.actor).get("/api/verifications?kind=results");
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].detail).toBe("7.25");
  });

  it("scopes the queue to the mod's own department by default", async () => {
    const mod = await createStaff(Role.MOD, { department: "CSE" });
    const cse = await createStudent({ branch: "CSE" });
    const ete = await createStudent({ branch: "ETE" });
    await createAchievement(cse.student.id);
    await createAchievement(ete.student.id);

    const scoped = await asUser(mod.actor).get("/api/verifications");
    expect(scoped.body.data.items).toHaveLength(1);

    const all = await asUser(mod.actor).get(
      "/api/verifications?allDepartments=true",
    );
    expect(all.body.data.items).toHaveLength(2);
  });
});

describe("editing a reviewed claim", () => {
  beforeEach(resetDatabase);

  it("sends a verified achievement back to pending", async () => {
    const mod = await createStaff(Role.MOD);
    const { actor, student } = await createStudent();
    const achievement = await createAchievement(student.id, {
      status: "VERIFIED",
      reviewedBy: mod.actor.id,
    });

    const res = await asUser(actor).patch(
      `/api/achievements/${achievement.id}`,
      { description: "A fuller description" },
    );

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("PENDING");
    expect(res.body.data.reviewedBy).toBeNull();
    expect(res.body.data.reviewedAt).toBeNull();

    const faculty = await createStaff(Role.FACULTY);
    const view = await asUser(faculty.actor).get(
      `/api/achievements?studentId=${student.id}`,
    );
    expect(view.body.data).toHaveLength(0);
  });

  it("clears a verified SGPA and the cached CGPA when the student resubmits", async () => {
    const mod = await createStaff(Role.MOD);
    const { actor, student } = await createStudent();
    const scheme = await createCreditScheme();
    const result = await createResult(student.id, scheme.id, {
      pendingSgpa: 8,
    });

    await asUser(mod.actor).patch(`/api/verifications/results/${result.id}`, {
      status: "VERIFIED",
    });

    const res = await asUser(actor).patch(`/api/results/${result.id}`, {
      pendingSgpa: 9.1,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("PENDING");
    expect(res.body.data.sgpa).toBeNull();

    const [row] = await db
      .select({ cgpa: studentsTable.cgpa })
      .from(studentsTable)
      .where(eq(studentsTable.id, student.id));
    expect(row.cgpa).toBeNull();
  });
});

describe("student self-service boundaries", () => {
  beforeEach(resetDatabase);

  it("strips the academic record from a student's own edit", async () => {
    const { actor, student } = await createStudent({ semester: 3 });

    const res = await asUser(actor).patch("/api/me/student", {
      bio: "Final year student",
      semester: 8,
      cgpa: 10,
      rollNo: "HACKED",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.bio).toBe("Final year student");
    expect(res.body.data.semester).toBe(3);
    expect(res.body.data.cgpa).toBeNull();
    expect(res.body.data.rollNo).toBe(student.rollNo);
  });

  it("names the admin-shaped blocker when a cohort has no credit scheme", async () => {
    const { actor } = await createStudent({
      branch: "ETE",
      admissionYear: 2024,
      semester: 5,
    });

    const res = await asUser(actor).post("/api/results", {
      semester: 5,
      pendingSgpa: 8.2,
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("NO_CREDIT_SCHEME");
    expect(res.body.error.message).toContain("ETE 2024 semester 5");
  });

  it("resolves schemeId from the student's own cohort, never the body", async () => {
    const mine = await createCreditScheme({
      branch: "CSE",
      admissionYear: 2023,
      semester: 3,
    });
    const someoneElses = await createCreditScheme({
      branch: "ME",
      admissionYear: 2023,
      semester: 3,
      totalCredits: 99,
    });
    const { actor } = await createStudent({
      branch: "CSE",
      admissionYear: 2023,
    });

    const res = await asUser(actor).post("/api/results", {
      semester: 3,
      pendingSgpa: 8.2,
      schemeId: someoneElses.id,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.schemeId).toBe(mine.id);
  });

  it("refuses a second result for the same semester", async () => {
    await createCreditScheme({ semester: 3 });
    const { actor } = await createStudent({
      branch: "CSE",
      admissionYear: 2023,
    });

    await asUser(actor).post("/api/results", { semester: 3, pendingSgpa: 8 });
    const second = await asUser(actor).post("/api/results", {
      semester: 3,
      pendingSgpa: 9,
    });

    expect(second.status).toBe(409);
  });

  it("stops a student editing another student's entry", async () => {
    const a = await createStudent();
    const b = await createStudent();
    const achievement = await createAchievement(a.student.id);

    const res = await asUser(b.actor).patch(
      `/api/achievements/${achievement.id}`,
      { title: "Mine now" },
    );
    expect(res.status).toBe(403);
  });
});

describe("account creation", () => {
  beforeEach(resetDatabase);

  it("creates the student's own account, not the caller's", async () => {
    const mod = await createStaff(Role.MOD);

    const res = await asUser(mod.actor).post("/api/students", {
      name: "Riya Das",
      email: "riya.das@aec.ac.in",
      rollNo: "CSE-2025-001",
      course: "BTECH",
      branch: "CSE",
      semester: 1,
      admissionYear: 2025,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.userId).not.toBe(mod.actor.id);

    const [created] = await db
      .select({ email: usersTable.email, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, res.body.data.userId));
    expect(created.email).toBe("riya.das@aec.ac.in");
    expect(created.role).toBe(Role.STUDENT);
  });

  it("marks pre-created rows emailVerified so Google sign-in can link to them", async () => {
    const mod = await createStaff(Role.MOD);

    const res = await asUser(mod.actor).post("/api/students", {
      name: "Arnab Roy",
      email: "arnab.roy@aec.ac.in",
      rollNo: "CSE-2025-002",
      course: "BTECH",
      branch: "CSE",
      semester: 1,
      admissionYear: 2025,
    });

    const [created] = await db
      .select({ emailVerified: usersTable.emailVerified })
      .from(usersTable)
      .where(eq(usersTable.id, res.body.data.userId));
    expect(created.emailVerified).toBe(true);
  });

  it("creates a colleague's faculty record rather than the caller's", async () => {
    const mod = await createStaff(Role.MOD);

    const res = await asUser(mod.actor).post("/api/faculty", {
      name: "Dr Sen",
      email: "sen@aec.ac.in",
      employeeId: "FAC-CS09",
      department: "CSE",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.userId).not.toBe(mod.actor.id);
  });

  it("returns failed import rows identified, alongside the successes", async () => {
    const mod = await createStaff(Role.MOD);
    await createStudent({ rollNo: "TAKEN-001" });

    const res = await asUser(mod.actor).post("/api/students/import", {
      students: [
        {
          name: "Good Row",
          email: "good.row@aec.ac.in",
          rollNo: "NEW-001",
          course: "BTECH",
          branch: "CSE",
          semester: 1,
          admissionYear: 2025,
        },
        {
          name: "Duplicate Roll",
          email: "dupe.roll@aec.ac.in",
          rollNo: "TAKEN-001",
          course: "BTECH",
          branch: "CSE",
          semester: 1,
          admissionYear: 2025,
        },
      ],
    });

    expect(res.status).toBe(200);
    expect(res.body.data.created).toHaveLength(1);
    expect(res.body.data.created[0].rollNo).toBe("NEW-001");
    expect(res.body.data.failed).toHaveLength(1);
    expect(res.body.data.failed[0].rollNo).toBe("TAKEN-001");
    expect(res.body.data.failed[0].row).toBe(2);
    expect(res.body.data.failed[0].reason).toContain("Roll number");

    const orphan = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, "dupe.roll@aec.ac.in"));
    expect(orphan).toHaveLength(0);
  });

  it("refuses to create a MOD when the caller is only a MOD", async () => {
    const mod = await createStaff(Role.MOD);

    const res = await asUser(mod.actor).post("/api/faculty", {
      name: "Would-be Mod",
      email: "wouldbe@aec.ac.in",
      employeeId: "FAC-CS10",
      role: Role.MOD,
    });
    expect(res.status).toBe(403);
  });
});

describe("role changes", () => {
  beforeEach(resetDatabase);

  it("lets a mod promote a faculty to mod", async () => {
    const mod = await createStaff(Role.MOD);
    const faculty = await createStaff(Role.FACULTY);

    const res = await asUser(mod.actor).patch(
      `/api/users/${faculty.actor.id}/role`,
      { role: Role.MOD },
    );
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe(Role.MOD);
  });

  it("does not let a mod demote another mod", async () => {
    const mod = await createStaff(Role.MOD);
    const other = await createStaff(Role.MOD);

    const res = await asUser(mod.actor).patch(
      `/api/users/${other.actor.id}/role`,
      { role: Role.FACULTY },
    );
    expect(res.status).toBe(403);
  });

  it("does not let a mod make anyone an admin", async () => {
    const mod = await createStaff(Role.MOD);
    const faculty = await createStaff(Role.FACULTY);

    const res = await asUser(mod.actor).patch(
      `/api/users/${faculty.actor.id}/role`,
      { role: Role.ADMIN },
    );
    expect(res.status).toBe(403);
  });

  it("lets an admin move an account in both directions", async () => {
    const admin = await createStaff(Role.ADMIN);
    const target = await createStaff(Role.MOD);

    const demote = await asUser(admin.actor).patch(
      `/api/users/${target.actor.id}/role`,
      { role: Role.FACULTY },
    );
    expect(demote.status).toBe(200);

    const promote = await asUser(admin.actor).patch(
      `/api/users/${target.actor.id}/role`,
      { role: Role.ADMIN },
    );
    expect(promote.status).toBe(200);
  });

  it("will not let anyone change their own role", async () => {
    const admin = await createStaff(Role.ADMIN);

    const res = await asUser(admin.actor).patch(
      `/api/users/${admin.actor.id}/role`,
      { role: Role.FACULTY },
    );
    expect(res.status).toBe(403);
  });

  it("will not move an account into or out of STUDENT", async () => {
    const admin = await createStaff(Role.ADMIN);
    const { actor } = await createStudent();

    const res = await asUser(admin.actor).patch(`/api/users/${actor.id}/role`, {
      role: Role.FACULTY,
    });
    expect(res.status).toBe(403);
  });
});

describe("cohort promotion", () => {
  beforeEach(resetDatabase);

  it("refuses to run when the cohort it promotes into has no credit scheme", async () => {
    const admin = await createStaff(Role.ADMIN);
    await createStudent({ branch: "CSE", admissionYear: 2023, semester: 3 });

    const res = await asUser(admin.actor).post("/api/admin/promotions", {
      admissionYear: 2023,
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("NO_CREDIT_SCHEME");
    expect(res.body.error.message).toContain("CSE semester 4");
  });

  it("advances the cohort and graduates the final semester", async () => {
    const admin = await createStaff(Role.ADMIN);
    const advancing = await createStudent({
      branch: "CSE",
      admissionYear: 2023,
      semester: 3,
    });
    const finishing = await createStudent({
      branch: "CSE",
      admissionYear: 2023,
      semester: 8,
    });

    const res = await asUser(admin.actor).post("/api/admin/promotions", {
      admissionYear: 2023,
      creditSchemes: [
        {
          branch: "CSE",
          admissionYear: 2023,
          semester: 4,
          totalCredits: 24,
        },
      ],
    });

    expect(res.status).toBe(200);
    expect(res.body.data.promoted).toBe(1);
    expect(res.body.data.graduated).toBe(1);
    expect(res.body.data.missingSchemes).toHaveLength(0);

    const [moved] = await db
      .select({ semester: studentsTable.semester })
      .from(studentsTable)
      .where(eq(studentsTable.id, advancing.student.id));
    expect(moved.semester).toBe(4);

    const [alumni] = await db
      .select({ status: studentsTable.status })
      .from(studentsTable)
      .where(eq(studentsTable.id, finishing.student.id));
    expect(alumni.status).toBe("ALUMNI");
  });
});

describe("audit trail", () => {
  beforeEach(resetDatabase);

  it("labels certification entries as certifications, not achievements", async () => {
    const { actor } = await createStudent();

    const res = await asUser(actor).post("/api/certifications", {
      name: "AWS Cloud Practitioner",
      issuer: "Amazon",
    });
    expect(res.status).toBe(201);

    const [log] = await db
      .select({ entity: auditLogsTable.entity })
      .from(auditLogsTable)
      .where(eq(auditLogsTable.entityId, res.body.data.id));
    expect(log.entity).toBe("Certification");
  });

  it("404s a missing certification as a certification, not an achievement", async () => {
    const { actor } = await createStudent();
    const res = await asUser(actor).get("/api/certifications/nope");
    expect(res.body.error.message).toBe("Certification not found");
  });

  it("populates metadata with a before/after diff", async () => {
    const { actor } = await createStudent();

    await asUser(actor).patch("/api/me/student", { bio: "First" });
    await asUser(actor).patch("/api/me/student", { bio: "Second" });

    const logs = await db
      .select({ metadata: auditLogsTable.metadata })
      .from(auditLogsTable)
      .where(eq(auditLogsTable.userId, actor.id));

    const last = logs.at(-1)?.metadata as {
      changed: { bio: { from: string; to: string } };
    };
    expect(last.changed.bio).toEqual({ from: "First", to: "Second" });
  });

  it("records who changed a role, and from what", async () => {
    const admin = await createStaff(Role.ADMIN);
    const faculty = await createStaff(Role.FACULTY);

    await asUser(admin.actor).patch(`/api/users/${faculty.actor.id}/role`, {
      role: Role.MOD,
    });

    const [log] = await db
      .select({
        action: auditLogsTable.action,
        metadata: auditLogsTable.metadata,
      })
      .from(auditLogsTable)
      .where(eq(auditLogsTable.entityId, faculty.actor.id));

    expect(log.action).toBe("SET_ROLE");
    expect(log.metadata).toEqual({ from: Role.FACULTY, to: Role.MOD });
  });

  it("keeps audit rows immutable", async () => {
    const { actor } = await createStudent();
    await asUser(actor).patch("/api/me/student", { bio: "Anything" });

    const [log] = await db
      .select({ id: auditLogsTable.id })
      .from(auditLogsTable)
      .where(eq(auditLogsTable.userId, actor.id));

    const update = await db
      .update(auditLogsTable)
      .set({ action: "TAMPERED" })
      .where(eq(auditLogsTable.id, log.id))
      .catch((error: unknown) => error);
    expect(pgMessage(update)).toMatch(/immutable/i);

    const remove = await db
      .delete(auditLogsTable)
      .where(eq(auditLogsTable.id, log.id))
      .catch((error: unknown) => error);
    expect(pgMessage(remove)).toMatch(/immutable/i);
  });
});

describe("pagination", () => {
  beforeEach(resetDatabase);

  it("pages the student list and reports whether there is more", async () => {
    const mod = await createStaff(Role.MOD, { department: "CSE" });
    for (let i = 0; i < 5; i++)
      await createStudent({ branch: "CSE", rollNo: `PAGE-${i}` });

    const first = await asUser(mod.actor).get(
      "/api/students?page=1&pageSize=2",
    );
    expect(first.body.data.items).toHaveLength(2);
    expect(first.body.data.total).toBe(5);
    expect(first.body.data.hasNext).toBe(true);

    const last = await asUser(mod.actor).get("/api/students?page=3&pageSize=2");
    expect(last.body.data.items).toHaveLength(1);
    expect(last.body.data.hasNext).toBe(false);
  });

  it("defaults the student list to the caller's department and active students", async () => {
    const faculty = await createStaff(Role.FACULTY, { department: "CSE" });
    await createStudent({ branch: "CSE" });
    await createStudent({ branch: "ETE" });
    await createStudent({ branch: "CSE", status: "ALUMNI" });

    const scoped = await asUser(faculty.actor).get("/api/students");
    expect(scoped.body.data.items).toHaveLength(1);

    const alumni = await asUser(faculty.actor).get(
      "/api/students?status=ALUMNI",
    );
    expect(alumni.body.data.items).toHaveLength(1);

    const everywhere = await asUser(faculty.actor).get(
      "/api/students?allDepartments=true",
    );
    expect(everywhere.body.data.items).toHaveLength(2);
  });

  it("caps the page size", async () => {
    const mod = await createStaff(Role.MOD);
    const res = await asUser(mod.actor).get("/api/students?pageSize=5000");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
  });
});
