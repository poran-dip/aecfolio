import { Capability, Role, type User } from "@aecfolio/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionData } from "./session";

const getSession = vi.hoisted(() => vi.fn());
vi.mock("./session", () => ({ getSession }));

const { can, requireCapability, requireSession, requireStaff, requireStudent } =
  await import("./guard");

function sessionFor(role: Role): SessionData {
  return {
    user: { id: "u1", name: "Test", email: "t@aec.ac.in", role } as User,
    session: { id: "s1", expiresAt: "", token: "" },
  };
}

function signedIn(role: Role) {
  getSession.mockResolvedValue(sessionFor(role));
}

async function redirectOf(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise;
    return null;
  } catch (thrown) {
    if (thrown instanceof Response) return thrown.headers.get("Location");
    throw thrown;
  }
}

const request = new Request("http://localhost/anything");

beforeEach(() => {
  getSession.mockReset();
});

describe("a signed-out visitor goes to the marketing home", () => {
  it("from any guard", async () => {
    getSession.mockResolvedValue(null);
    expect(await redirectOf(requireSession(request))).toBe("/");
    expect(
      await redirectOf(requireCapability(request, Capability.STUDENT_READ)),
    ).toBe("/");
    expect(await redirectOf(requireStaff(request))).toBe("/");
  });
});

describe("a wrong-role visit lands on that user's own home, not a 403", () => {
  it("sends a student away from a staff screen", async () => {
    signedIn(Role.STUDENT);
    expect(
      await redirectOf(requireCapability(request, Capability.STUDENT_READ)),
    ).toBe("/app");
    expect(await redirectOf(requireStaff(request))).toBe("/app");
  });

  it("sends faculty away from cohort promotion and the review queue", async () => {
    signedIn(Role.FACULTY);
    expect(
      await redirectOf(requireCapability(request, Capability.COHORT_PROMOTE)),
    ).toBe("/students");
    expect(
      await redirectOf(requireCapability(request, Capability.CLAIM_REVIEW)),
    ).toBe("/students");
  });

  it("sends a mod away from cohort promotion only", async () => {
    signedIn(Role.MOD);
    expect(
      await redirectOf(requireCapability(request, Capability.COHORT_PROMOTE)),
    ).toBe("/verifications");
    expect(
      await redirectOf(requireCapability(request, Capability.CLAIM_REVIEW)),
    ).toBeNull();
  });

  it("sends staff away from a student-only screen", async () => {
    signedIn(Role.ADMIN);
    expect(await redirectOf(requireStudent(request))).toBe("/verifications");
    expect(
      await redirectOf(requireCapability(request, Capability.CV_EXPORT_SELF)),
    ).toBe("/verifications");
  });
});

describe("a permitted visit passes through with the session", () => {
  it("returns the session rather than redirecting", async () => {
    signedIn(Role.ADMIN);
    const result = await requireCapability(request, Capability.COHORT_PROMOTE);
    expect(result.user.role).toBe(Role.ADMIN);
    expect(await redirectOf(requireStaff(request))).toBeNull();
  });

  it("lets a student reach their own screens", async () => {
    signedIn(Role.STUDENT);
    expect(await redirectOf(requireStudent(request))).toBeNull();
    expect(
      await redirectOf(
        requireCapability(request, Capability.PROFILE_WRITE_SELF),
      ),
    ).toBeNull();
  });
});

describe("can() reads the same matrix the API enforces", () => {
  it("agrees with the capability table", () => {
    const student = sessionFor(Role.STUDENT).user;
    const admin = sessionFor(Role.ADMIN).user;
    expect(can(student, Capability.CV_EXPORT_SELF)).toBe(true);
    expect(can(student, Capability.CV_EXPORT_STANDARD)).toBe(false);
    expect(can(admin, Capability.CV_EXPORT_STANDARD)).toBe(true);
    expect(can(admin, Capability.PROFILE_WRITE_SELF)).toBe(false);
  });
});
