import { Role } from "@aecfolio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { asUser, createStudent, resetDatabase } from "./harness";

describe("test harness", () => {
  beforeEach(resetDatabase);

  it("serves the health check without a session", async () => {
    const res = await asUser(null).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("rejects an unauthenticated call with the error envelope", async () => {
    const res = await asUser(null).get("/api/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("resolves the seeded actor through the real middleware stack", async () => {
    const { actor } = await createStudent();
    const res = await asUser(actor).get("/api/me");

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(actor.email);
    expect(res.body.data.role).toBe(Role.STUDENT);
    expect(res.body.data.student).not.toBeNull();
  });
});
