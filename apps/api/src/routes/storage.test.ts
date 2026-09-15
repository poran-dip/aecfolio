import { PROOF_MAX_BYTES, Role } from "@aecfolio/shared";
import { createId } from "@paralleldrive/cuid2";
import { beforeEach, describe, expect, it } from "vitest";
import { putObject } from "../lib/storage";
import {
  asUser,
  createAchievement,
  createCertification,
  createStaff,
  createStudent,
  resetDatabase,
} from "../test/harness";

const PDF = new TextEncoder().encode("%PDF-1.7\n1 0 obj << >> endobj\n%%EOF");
const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13,
]);

async function uploaded(prefix: string, body = PDF, type = "application/pdf") {
  const key = `${prefix}${createId()}.${type === "application/pdf" ? "pdf" : "png"}`;
  await putObject(key, body, type);
  return key;
}

async function follow(location: string | null) {
  expect(location).toBeTruthy();
  const res = await fetch(location as string);
  return { status: res.status, bytes: new Uint8Array(await res.arrayBuffer()) };
}

describe("upload tickets", () => {
  beforeEach(resetDatabase);

  it("signs a URL that accepts exactly the declared file, under the student's prefix", async () => {
    const { actor, student } = await createStudent();

    const res = await asUser(actor).post("/api/uploads", {
      purpose: "proof",
      contentType: "application/pdf",
      size: PDF.byteLength,
    });

    expect(res.status).toBe(201);
    const ticket = res.body.data;
    expect(ticket.method).toBe("PUT");
    expect(ticket.key).toMatch(new RegExp(`^proofs/${student.id}/\\w+\\.pdf$`));

    const wrongType = await fetch(ticket.url, {
      method: "PUT",
      body: PDF,
      headers: { "Content-Type": "image/png" },
    });
    expect(wrongType.status).toBe(403);

    const wrongSize = await fetch(ticket.url, {
      method: "PUT",
      body: new Uint8Array([...PDF, 0x20]),
      headers: ticket.headers,
    });
    expect(wrongSize.status).toBe(403);

    const put = await fetch(ticket.url, {
      method: "PUT",
      body: PDF,
      headers: ticket.headers,
    });
    expect(put.status).toBe(200);
  });

  it("refuses a type or size the purpose does not allow", async () => {
    const { actor } = await createStudent();
    const client = asUser(actor);

    const gif = await client.post("/api/uploads", {
      purpose: "proof",
      contentType: "image/gif",
      size: 100,
    });
    expect(gif.status).toBe(400);

    const huge = await client.post("/api/uploads", {
      purpose: "proof",
      contentType: "application/pdf",
      size: PROOF_MAX_BYTES + 1,
    });
    expect(huge.status).toBe(400);

    const pdfAvatar = await client.post("/api/uploads", {
      purpose: "avatar",
      contentType: "application/pdf",
      size: 100,
    });
    expect(pdfAvatar.status).toBe(400);
  });

  it("gives staff an avatar ticket under their own user id", async () => {
    const { actor } = await createStaff(Role.FACULTY);

    const res = await asUser(actor).post("/api/uploads", {
      purpose: "avatar",
      contentType: "image/png",
      size: 1000,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.key).toMatch(new RegExp(`^avatars/${actor.id}/`));
  });
});

describe("attaching proof", () => {
  beforeEach(resetDatabase);

  it("attaches an uploaded file and serves it back through a redirect", async () => {
    const { actor, student } = await createStudent();
    const client = asUser(actor);
    const key = await uploaded(`proofs/${student.id}/`);

    const created = await client.post("/api/certifications", {
      name: "Cloud Practitioner",
      issuer: "Amazon",
      proofKey: key,
    });
    expect(created.status).toBe(201);

    const res = await client.get(
      `/api/certifications/${created.body.data.id}/proof`,
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("cache-control")).toContain("no-store");

    const file = await follow(res.headers.get("location"));
    expect(file.status).toBe(200);
    expect(file.bytes).toEqual(PDF);
  });

  it("refuses a key from another student's prefix", async () => {
    const { actor } = await createStudent();
    const { student: other } = await createStudent();
    const key = await uploaded(`proofs/${other.id}/`);

    const res = await asUser(actor).post("/api/achievements", {
      title: "Borrowed",
      description: "Not mine",
      proofKey: key,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
  });

  it("refuses a key that was never uploaded", async () => {
    const { actor, student } = await createStudent();

    const res = await asUser(actor).post("/api/achievements", {
      title: "Imaginary",
      description: "Nothing there",
      proofKey: `proofs/${student.id}/${createId()}.pdf`,
    });

    expect(res.status).toBe(400);
  });

  it("refuses a file whose bytes are not what it claims to be", async () => {
    const { actor, student } = await createStudent();
    const key = await uploaded(`proofs/${student.id}/`, PDF, "image/png");

    const res = await asUser(actor).post("/api/achievements", {
      title: "Mislabelled",
      description: "A PDF posing as a PNG",
      proofKey: key,
    });

    expect(res.status).toBe(400);
  });

  it("checks a replacement proof on edit", async () => {
    const { actor, student } = await createStudent();
    const achievement = await createAchievement(student.id);
    const { student: other } = await createStudent();

    const res = await asUser(actor).patch(
      `/api/achievements/${achievement.id}`,
      { proofKey: await uploaded(`proofs/${other.id}/`) },
    );

    expect(res.status).toBe(400);
  });
});

describe("reading proof", () => {
  beforeEach(resetDatabase);

  async function scenario() {
    const mod = await createStaff(Role.MOD);
    const faculty = await createStaff(Role.FACULTY);
    const { actor, student } = await createStudent();
    const { actor: otherStudent } = await createStudent();
    const proofKey = await uploaded(`proofs/${student.id}/`);

    const pending = await createAchievement(student.id, { proofKey });
    const verified = await createAchievement(student.id, {
      proofKey,
      status: "VERIFIED",
      reviewedBy: mod.actor.id,
    });
    const bare = await createCertification(student.id, {
      status: "VERIFIED",
      reviewedBy: mod.actor.id,
    });

    return { mod, faculty, actor, otherStudent, pending, verified, bare };
  }

  it("shows faculty the proof behind a verified claim only", async () => {
    const s = await scenario();
    const client = asUser(s.faculty.actor);

    expect(
      (await client.get(`/api/achievements/${s.verified.id}/proof`)).status,
    ).toBe(302);
    expect(
      (await client.get(`/api/achievements/${s.pending.id}/proof`)).status,
    ).toBe(404);
  });

  it("shows the owner and mods proof at every status", async () => {
    const s = await scenario();

    for (const actor of [s.actor, s.mod.actor]) {
      const res = await asUser(actor).get(
        `/api/achievements/${s.pending.id}/proof`,
      );
      expect(res.status).toBe(302);
    }
  });

  it("does not let another student open it", async () => {
    const s = await scenario();

    const res = await asUser(s.otherStudent).get(
      `/api/achievements/${s.verified.id}/proof`,
    );
    expect(res.status).toBe(403);
  });

  it("404s a verified claim with no proof attached rather than redirecting nowhere", async () => {
    const s = await scenario();

    const res = await asUser(s.faculty.actor).get(
      `/api/certifications/${s.bare.id}/proof`,
    );
    expect(res.status).toBe(404);
  });
});

describe("avatars", () => {
  beforeEach(resetDatabase);

  it("sets an uploaded avatar and serves it to its owner and to staff", async () => {
    const { actor } = await createStudent();
    const faculty = await createStaff(Role.FACULTY);
    const key = await uploaded(`avatars/${actor.id}/`, PNG, "image/png");

    const patched = await asUser(actor).patch("/api/me", { image: key });
    expect(patched.status).toBe(200);
    expect(patched.body.data.image).toBe(key);

    const own = await asUser(actor).get(`/api/users/${actor.id}/avatar`);
    expect(own.status).toBe(302);
    expect((await follow(own.headers.get("location"))).bytes).toEqual(PNG);

    const staff = await asUser(faculty.actor).get(
      `/api/users/${actor.id}/avatar`,
    );
    expect(staff.status).toBe(302);
  });

  it("does not let a student browse other users' avatars", async () => {
    const { actor } = await createStudent();
    const { actor: other } = await createStudent();

    const res = await asUser(actor).get(`/api/users/${other.id}/avatar`);
    expect(res.status).toBe(403);
  });

  it("refuses a proof file, or a URL, as an avatar", async () => {
    const { actor, student } = await createStudent();
    const client = asUser(actor);

    const proof = await client.patch("/api/me", {
      image: await uploaded(`proofs/${student.id}/`),
    });
    expect(proof.status).toBe(400);

    const url = await client.patch("/api/me", {
      image: "https://example.com/me.png",
    });
    expect(url.status).toBe(400);
  });
});
