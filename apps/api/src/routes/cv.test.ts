import {
  cvExportJobItemsTable,
  cvExportsTable,
  studentsTable,
  usersTable,
} from "@aecfolio/db";
import { CV_EXPORT_HISTORY_MAX, Role } from "@aecfolio/shared";
import { createId } from "@paralleldrive/cuid2";
import { count, eq } from "drizzle-orm";
import { unzipSync } from "fflate";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { runQueuedJobs } from "../lib/cv/jobs";
import { forgetWorkerVersion } from "../lib/cv/worker-client";
import { db } from "../lib/db";
import { headObject, putObject } from "../lib/storage";
import { FAKE_PDF, startFakeWorker } from "../test/fake-worker";
import {
  asUser,
  createAchievement,
  createCertification,
  createCreditScheme,
  createResult,
  createStaff,
  createStudent,
  resetDatabase,
} from "../test/harness";

const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82,
]);

let worker: Awaited<ReturnType<typeof startFakeWorker>>;

beforeAll(async () => {
  worker = await startFakeWorker();
});

afterAll(async () => {
  await worker.close();
});

beforeEach(async () => {
  await resetDatabase();
  worker.reset();
  forgetWorkerVersion();
});

const lastRender = () => {
  const render = worker.state.renders.at(-1);
  if (!render) throw new Error("the worker was never called");
  return render;
};

async function scenario() {
  const mod = await createStaff(Role.MOD);
  const faculty = await createStaff(Role.FACULTY);
  const { actor, student } = await createStudent({ rollNo: "23/162" });
  await db
    .update(usersTable)
    .set({ name: "Poran Boruah" })
    .where(eq(usersTable.id, actor.id));

  const proofKey = `proofs/${student.id}/${createId()}.pdf`;
  const verified = await createAchievement(student.id, {
    title: "Verified with proof",
    status: "VERIFIED",
    reviewedBy: mod.actor.id,
    proofKey,
  });
  const bare = await createAchievement(student.id, {
    title: "Verified without proof",
    status: "VERIFIED",
    reviewedBy: mod.actor.id,
  });
  const pending = await createAchievement(student.id, {
    title: "Pending claim",
  });
  const rejected = await createAchievement(student.id, {
    title: "Rejected claim",
    status: "REJECTED",
    reviewedBy: mod.actor.id,
    rejectionReason: "A very specific rejection reason",
  });
  const certification = await createCertification(student.id, {
    status: "VERIFIED",
    reviewedBy: mod.actor.id,
    proofKey,
  });
  const scheme = await createCreditScheme();
  await createResult(student.id, scheme.id, {
    status: "PENDING",
    pendingSgpa: 9.9,
  });

  return {
    mod,
    faculty,
    actor,
    student,
    verified,
    bare,
    pending,
    rejected,
    certification,
  };
}

const titles = (render: { data: { achievements: { title: string }[] } }) =>
  render.data.achievements.map((a) => a.title);

describe("a student's own export (decision #42)", () => {
  it("renders from the database, never from the request body", async () => {
    const s = await scenario();

    const res = await asUser(s.actor).post("/api/cv/exports/self", {
      templateId: "standard",
      data: { user: { name: "Someone Else" } },
    });

    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(lastRender().data.user.name).toBe("Poran Boruah");
    expect(worker.state.unauthorized).toBe(0);
  });

  it("prints pending entries unmarked and leaves rejected ones out", async () => {
    const s = await scenario();
    await asUser(s.actor).post("/api/cv/exports/self", {
      templateId: "standard",
    });

    const render = lastRender();
    expect(titles(render)).toEqual(
      expect.arrayContaining([
        "Verified with proof",
        "Verified without proof",
        "Pending claim",
      ]),
    );
    expect(titles(render)).not.toContain("Rejected claim");

    const byTitle = Object.fromEntries(
      render.data.achievements.map((a: { title: string; mark: unknown }) => [
        a.title,
        a.mark,
      ]),
    );
    expect(byTitle["Pending claim"]).toBeNull();
    expect(byTitle["Verified without proof"]).toEqual({ proofUrl: null });
    expect(byTitle["Verified with proof"]).toEqual({
      proofUrl: `http://localhost:3002/api/achievements/${s.verified.id}/proof`,
    });
  });

  it("links proof through the durable route, never a signed URL or an object key", async () => {
    const s = await scenario();
    await asUser(s.actor).post("/api/cv/exports/self", {
      templateId: "standard",
    });

    const payload = JSON.stringify(lastRender());
    expect(payload).toContain(
      `/api/certifications/${s.certification.id}/proof`,
    );
    expect(payload).not.toMatch(/X-Amz-/i);
    expect(lastRender().data.certifications[0].mark.proofUrl).not.toContain(
      "proofs/",
    );
  });

  it("carries no reviewer, review time, rejection reason or pending SGPA", async () => {
    const s = await scenario();
    await asUser(s.actor).post("/api/cv/exports/self", {
      templateId: "standard",
    });

    const payload = JSON.stringify(lastRender());
    expect(payload).not.toContain(s.mod.actor.id);
    expect(payload).not.toContain("A very specific rejection reason");
    expect(payload).not.toContain("9.9");
  });

  it("refuses an unknown template", async () => {
    const s = await scenario();
    const res = await asUser(s.actor).post("/api/cv/exports/self", {
      templateId: "nope",
    });
    expect(res.status).toBe(400);
    expect(worker.state.renders).toHaveLength(0);
  });
});

describe("a faculty export (decisions #13, #39)", () => {
  it("prints verified claims only, each with its mark", async () => {
    const s = await scenario();

    const res = await asUser(s.faculty.actor).post("/api/cv/exports/standard", {
      studentId: s.student.id,
    });

    expect(res.status).toBe(201);
    const render = lastRender();
    expect(render.templateId).toBe("standard");
    expect(titles(render).sort()).toEqual([
      "Verified with proof",
      "Verified without proof",
    ]);
    expect(
      render.data.achievements.every((a: { mark: unknown }) => a.mark !== null),
    ).toBe(true);
    expect(render.data.results).toEqual([]);
  });

  it("uses the student's saved standard preferences, not anything the caller sends", async () => {
    const s = await scenario();
    await asUser(s.actor).put("/api/cv/preferences", {
      templateId: "standard",
      sections: [
        { type: "projects", include: true, order: 0 },
        { type: "achievements", include: true, order: 1 },
      ],
      options: { accent: "ink" },
    });

    await asUser(s.faculty.actor).post("/api/cv/exports/standard", {
      studentId: s.student.id,
      templateId: "something-else",
      options: { accent: "red" },
    });

    const render = lastRender();
    expect(render.sections.map((section) => section.type)).toEqual([
      "projects",
      "achievements",
    ]);
    expect(render.options.accent).toBe("ink");
  });

  it("404s a student who does not exist", async () => {
    const faculty = await createStaff(Role.FACULTY);
    const res = await asUser(faculty.actor).post("/api/cv/exports/standard", {
      studentId: "missing",
    });
    expect(res.status).toBe(404);
  });
});

describe("the unchanged-export short-circuit", () => {
  it("serves the stored PDF when nothing changed", async () => {
    const s = await scenario();
    const client = asUser(s.actor);

    const first = await client.post("/api/cv/exports/self", {
      templateId: "standard",
    });
    const second = await client.post("/api/cv/exports/self", {
      templateId: "standard",
    });

    expect(first.body.data.cached).toBe(false);
    expect(second.status).toBe(200);
    expect(second.body.data.cached).toBe(true);
    expect(second.body.data.export.id).toBe(first.body.data.export.id);
    expect(worker.state.renders).toHaveLength(1);
  });

  it("renders again when an option changes", async () => {
    const s = await scenario();
    const client = asUser(s.actor);

    await client.post("/api/cv/exports/self", { templateId: "standard" });
    await client.post("/api/cv/exports/self", {
      templateId: "standard",
      sections: lastRender().sections,
      options: { density: "compact" },
    });

    expect(worker.state.renders).toHaveLength(2);
  });

  it("renders again when the data changes", async () => {
    const s = await scenario();
    const client = asUser(s.actor);

    await client.post("/api/cv/exports/self", { templateId: "standard" });
    await client.patch("/api/me/student", { bio: "Something new" });
    await client.post("/api/cv/exports/self", { templateId: "standard" });

    expect(worker.state.renders).toHaveLength(2);
  });

  it("never serves a student's own export to a faculty request", async () => {
    const s = await scenario();
    await db
      .update(studentsTable)
      .set({ bio: null })
      .where(eq(studentsTable.id, s.student.id));

    await asUser(s.actor).post("/api/cv/exports/self", {
      templateId: "standard",
    });
    const faculty = await asUser(s.faculty.actor).post(
      "/api/cv/exports/standard",
      { studentId: s.student.id },
    );

    expect(faculty.body.data.cached).toBe(false);
    expect(faculty.body.data.export.kind).toBe("STANDARD");
    expect(worker.state.renders).toHaveLength(2);
  });

  it("renders again when the template code changes", async () => {
    const s = await scenario();
    const client = asUser(s.actor);

    await client.post("/api/cv/exports/self", { templateId: "standard" });
    worker.state.version = "v2";
    forgetWorkerVersion();
    await client.post("/api/cv/exports/self", { templateId: "standard" });

    expect(worker.state.renders).toHaveLength(2);
  });
});

describe("the photo", () => {
  async function withAvatar() {
    const s = await scenario();
    const key = `avatars/${s.actor.id}/${createId()}.png`;
    await putObject(key, PNG, "image/png");
    await db
      .update(usersTable)
      .set({ image: key })
      .where(eq(usersTable.id, s.actor.id));
    return { ...s, key };
  }

  it("is inlined from the bucket, so the worker never fetches anything", async () => {
    const s = await withAvatar();
    await asUser(s.actor).post("/api/cv/exports/self", {
      templateId: "standard",
    });

    const image = lastRender().data.user.image as string;
    expect(image.startsWith("data:image/png;base64,")).toBe(true);
    expect(JSON.stringify(lastRender())).not.toContain(s.key);
  });

  it("is left out when the template will not print it", async () => {
    const s = await withAvatar();
    await asUser(s.actor).post("/api/cv/exports/self", {
      templateId: "standard",
      options: { showPhoto: false },
    });

    expect(lastRender().data.user.image).toBeNull();
  });
});

describe("preferences", () => {
  it("drops sections the template cannot draw and fills in default options", async () => {
    const s = await scenario();

    const res = await asUser(s.actor).put("/api/cv/preferences", {
      templateId: "standard",
      sections: [
        { type: "projects", include: true, order: 0 },
        {
          type: "custom",
          customSectionId: "not-mine",
          include: true,
          order: 1,
        },
      ],
      options: { accent: "red", nonsense: true },
    });

    expect(res.status).toBe(200);
    expect(res.body.data.sections).toHaveLength(1);
    expect(res.body.data.options).toMatchObject({
      accent: "red",
      density: "comfortable",
    });
    expect(res.body.data.options).not.toHaveProperty("nonsense");

    const again = await asUser(s.actor).put("/api/cv/preferences", {
      templateId: "standard",
      sections: [],
    });
    expect(again.body.data.id).toBe(res.body.data.id);
  });

  it("refuses a template that does not exist", async () => {
    const s = await scenario();
    const res = await asUser(s.actor).put("/api/cv/preferences", {
      templateId: "nope",
      sections: [],
    });
    expect(res.status).toBe(400);
  });
});

describe("export history", () => {
  it("is one shared list, visible to the student and to staff, and downloads by redirect", async () => {
    const s = await scenario();
    await asUser(s.actor).post("/api/cv/exports/self", {
      templateId: "standard",
    });
    await asUser(s.faculty.actor).post("/api/cv/exports/standard", {
      studentId: s.student.id,
    });

    const own = await asUser(s.actor).get("/api/cv/exports");
    const staff = await asUser(s.faculty.actor).get(
      `/api/cv/exports?studentId=${s.student.id}`,
    );
    expect(own.body.data).toHaveLength(2);
    expect(staff.body.data).toHaveLength(2);
    expect(own.body.data[0]).not.toHaveProperty("objectKey");

    const download = await asUser(s.actor).get(
      `/api/cv/exports/${own.body.data[0].id}/download`,
    );
    expect(download.status).toBe(302);
    const location = download.headers.get("location") as string;
    expect(decodeURIComponent(location)).toContain(
      'attachment; filename="23162-Poran-Boruah.pdf"',
    );
    const file = await fetch(location);
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(FAKE_PDF);
  });

  it("is not visible to another student", async () => {
    const s = await scenario();
    const { actor: other } = await createStudent();
    await asUser(s.actor).post("/api/cv/exports/self", {
      templateId: "standard",
    });
    const [row] = await db.select().from(cvExportsTable);

    const res = await asUser(other).get(`/api/cv/exports/${row.id}/download`);
    expect(res.status).toBe(403);
  });

  it(`keeps the last ${CV_EXPORT_HISTORY_MAX} and deletes older PDFs from the bucket`, async () => {
    const s = await scenario();
    const oldKey = `exports/${s.student.id}/${createId()}.pdf`;
    await putObject(oldKey, FAKE_PDF, "application/pdf");

    await db.insert(cvExportsTable).values(
      Array.from({ length: CV_EXPORT_HISTORY_MAX }, (_, i) => ({
        studentId: s.student.id,
        templateId: "standard",
        kind: "SELF" as const,
        config: [],
        options: {},
        checksum: `old-${i}`,
        objectKey: i === 0 ? oldKey : `exports/${s.student.id}/gone-${i}.pdf`,
        sizeBytes: 10,
        createdAt: new Date(Date.UTC(2020, 0, 1, 0, i)),
      })),
    );

    await asUser(s.actor).post("/api/cv/exports/self", {
      templateId: "standard",
    });

    const [{ value }] = await db
      .select({ value: count() })
      .from(cvExportsTable)
      .where(eq(cvExportsTable.studentId, s.student.id));
    expect(value).toBe(CV_EXPORT_HISTORY_MAX);
    expect(await headObject(oldKey)).toBeNull();
  });
});

describe("when the worker is down", () => {
  it("answers 502 rather than hanging or pretending", async () => {
    const s = await scenario();
    await worker.close();
    try {
      forgetWorkerVersion();
      const res = await asUser(s.actor).post("/api/cv/exports/self", {
        templateId: "standard",
      });
      expect(res.status).toBe(502);
      expect(res.body.error.code).toBe("WORKER_UNAVAILABLE");
    } finally {
      worker = await startFakeWorker();
    }
  });
});

describe("bulk export jobs", () => {
  async function cohort(n: number) {
    const faculty = await createStaff(Role.FACULTY);
    const students = [];
    for (let i = 0; i < n; i++) {
      const { student } = await createStudent({ rollNo: `22CSE${100 + i}` });
      students.push(student);
    }
    return { faculty, students };
  }

  it("queues, runs every student through the standard export, and zips them by roll number", async () => {
    const { faculty, students } = await cohort(6);
    const client = asUser(faculty.actor);

    const created = await client.post("/api/cv/jobs", {
      studentIds: students.map((s) => s.id),
    });
    expect(created.status).toBe(202);
    expect(created.body.data.status).toBe("QUEUED");

    await runQueuedJobs();

    const job = await client.get(`/api/cv/jobs/${created.body.data.id}`);
    expect(job.body.data).toMatchObject({
      status: "SUCCEEDED",
      total: 6,
      completed: 6,
      failed: 0,
    });
    expect(worker.state.renders).toHaveLength(6);
  });

  it("streams a zip with one PDF per student, named by roll number", async () => {
    const { faculty, students } = await cohort(3);
    const created = await asUser(faculty.actor).post("/api/cv/jobs", {
      studentIds: students.map((s) => s.id),
    });
    await runQueuedJobs();

    const { createApp } = await import("../app");
    const app = createApp({
      sessionResolver: async () => ({
        user: faculty.actor,
        sessionId: "test",
      }),
    });
    const res = await app.request(
      `/api/cv/jobs/${created.body.data.id}/download`,
    );
    expect(res.headers.get("content-type")).toBe("application/zip");

    const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
    expect(Object.keys(files).sort()).toEqual([
      "22100-STUDENT-User.pdf",
      "22101-STUDENT-User.pdf",
      "22102-STUDENT-User.pdf",
    ]);
    expect(files["22100-STUDENT-User.pdf"]).toEqual(FAKE_PDF);
  });

  it("keeps twice as many renders in flight as the worker has tabs", async () => {
    const { faculty, students } = await cohort(12);
    worker.state.pages = 3;
    worker.state.delayMs = 40;

    await asUser(faculty.actor).post("/api/cv/jobs", {
      studentIds: students.map((s) => s.id),
    });
    await runQueuedJobs();

    expect(worker.state.renders).toHaveLength(12);
    expect(worker.state.maxInFlight).toBe(6);
  });

  it("finishes with the failures listed rather than failing the whole export", async () => {
    const { faculty, students } = await cohort(3);
    worker.state.failFor.add(students[1].id);

    const created = await asUser(faculty.actor).post("/api/cv/jobs", {
      studentIds: students.map((s) => s.id),
    });
    await runQueuedJobs();

    const job = await asUser(faculty.actor).get(
      `/api/cv/jobs/${created.body.data.id}`,
    );
    expect(job.body.data).toMatchObject({
      status: "SUCCEEDED",
      completed: 2,
      failed: 1,
    });

    const items = await db
      .select()
      .from(cvExportJobItemsTable)
      .where(eq(cvExportJobItemsTable.studentId, students[1].id));
    expect(items[0].error).toContain("500");
  });

  it("reuses unchanged PDFs on a second export of the same cohort", async () => {
    const { faculty, students } = await cohort(4);
    const client = asUser(faculty.actor);
    const ids = students.map((s) => s.id);

    await client.post("/api/cv/jobs", { studentIds: ids });
    await runQueuedJobs();
    await client.post("/api/cv/jobs", { studentIds: ids });
    await runQueuedJobs();

    expect(worker.state.renders).toHaveLength(4);
  });

  it("refuses unknown students before queueing anything", async () => {
    const { faculty, students } = await cohort(1);
    const res = await asUser(faculty.actor).post("/api/cv/jobs", {
      studentIds: [students[0].id, "missing"],
    });
    expect(res.status).toBe(400);
    expect(res.body.error.details.missing).toEqual(["missing"]);
  });

  it("shows a job only to whoever started it", async () => {
    const { faculty, students } = await cohort(1);
    const other = await createStaff(Role.MOD);
    const created = await asUser(faculty.actor).post("/api/cv/jobs", {
      studentIds: [students[0].id],
    });

    const res = await asUser(other.actor).get(
      `/api/cv/jobs/${created.body.data.id}`,
    );
    expect(res.status).toBe(404);
  });

  it("will not hand out a zip before the job has finished", async () => {
    const { faculty, students } = await cohort(1);
    const created = await asUser(faculty.actor).post("/api/cv/jobs", {
      studentIds: [students[0].id],
    });

    const res = await asUser(faculty.actor).get(
      `/api/cv/jobs/${created.body.data.id}/download`,
    );
    expect(res.status).toBe(409);
  });
});
