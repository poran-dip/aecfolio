import { Role } from "@aecfolio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import {
  asUser,
  createAchievement,
  createCreditScheme,
  createResult,
  createStaff,
  createStudent,
  resetDatabase,
} from "../test/harness";

describe("student profile projections", () => {
  beforeEach(resetDatabase);

  async function scenario() {
    const mod = await createStaff(Role.MOD);
    const faculty = await createStaff(Role.FACULTY);
    const { actor: studentActor, student } = await createStudent();

    const pending = await createAchievement(student.id, {
      title: "Pending claim",
    });
    const verified = await createAchievement(student.id, {
      title: "Verified claim",
      status: "VERIFIED",
      reviewedBy: mod.actor.id,
    });
    const rejected = await createAchievement(student.id, {
      title: "Rejected claim",
      status: "REJECTED",
      reviewedBy: mod.actor.id,
      rejectionReason: "The certificate was illegible",
    });

    return {
      mod,
      faculty,
      studentActor,
      student,
      pending,
      verified,
      rejected,
    };
  }

  it("gives faculty only verified claims, still carrying reviewedBy and reviewedAt", async () => {
    const s = await scenario();

    const res = await asUser(s.faculty.actor).get(
      `/api/students/${s.student.id}`,
    );
    expect(res.status).toBe(200);

    const achievements = res.body.data.achievements;
    expect(achievements).toHaveLength(1);
    expect(achievements[0].title).toBe("Verified claim");

    expect(achievements[0].reviewedBy).toBe(s.mod.actor.id);
    expect(achievements[0].reviewedAt).not.toBeNull();

    expect(achievements[0]).not.toHaveProperty("rejectionReason");
  });

  it("gives mods every status, with rejection reasons", async () => {
    const s = await scenario();

    const res = await asUser(s.mod.actor).get(`/api/students/${s.student.id}`);
    expect(res.status).toBe(200);

    const achievements = res.body.data.achievements;
    expect(achievements).toHaveLength(3);

    const rejected = achievements.find(
      (a: { title: string }) => a.title === "Rejected claim",
    );
    expect(rejected.rejectionReason).toBe("The certificate was illegible");
  });

  it("gives the student their own owner view", async () => {
    const s = await scenario();

    const res = await asUser(s.studentActor).get("/api/me/profile");
    expect(res.status).toBe(200);
    expect(res.body.data.achievements).toHaveLength(3);
  });

  it("filters the same way on the per-entity list endpoints", async () => {
    const s = await scenario();

    const facultyView = await asUser(s.faculty.actor).get(
      `/api/achievements?studentId=${s.student.id}`,
    );
    expect(facultyView.body.data).toHaveLength(1);
    expect(facultyView.body.data[0]).not.toHaveProperty("rejectionReason");

    const modView = await asUser(s.mod.actor).get(
      `/api/achievements?studentId=${s.student.id}`,
    );
    expect(modView.body.data).toHaveLength(3);
  });

  it("passes student-authored sections through unfiltered — they have no status", async () => {
    const s = await scenario();

    await asUser(s.studentActor).post("/api/projects", {
      title: "A project",
      description: "Built a thing",
    });

    const res = await asUser(s.faculty.actor).get(
      `/api/students/${s.student.id}`,
    );
    expect(res.body.data.projects).toHaveLength(1);
  });

  it("hides an unverified result from faculty but shows it to a mod", async () => {
    const s = await scenario();
    const scheme = await createCreditScheme();
    await createResult(s.student.id, scheme.id, { semester: 3 });

    const facultyView = await asUser(s.faculty.actor).get(
      `/api/students/${s.student.id}`,
    );
    expect(facultyView.body.data.results).toHaveLength(0);

    const modView = await asUser(s.mod.actor).get(
      `/api/students/${s.student.id}`,
    );
    expect(modView.body.data.results).toHaveLength(1);
  });

  it("refuses to let a student read another student's rows", async () => {
    const s = await scenario();
    const other = await createStudent();

    const res = await asUser(other.actor).get(
      `/api/achievements?studentId=${s.student.id}`,
    );
    expect(res.status).toBe(403);
  });

  it("will not serve every row in the table to staff who name no student", async () => {
    const s = await scenario();

    const res = await asUser(s.faculty.actor).get("/api/achievements");
    expect(res.status).toBe(400);
  });
});
