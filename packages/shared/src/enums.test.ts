import { describe, expect, it } from "vitest";
import {
  Branch,
  Course,
  Role,
  StudentStatus,
  VerificationStatus,
} from "./enums";

process.env.DATABASE_URL ??= "postgres://schema-parity-test";

async function pgEnums() {
  return await import("@aecfolio/db");
}

describe("enum parity with packages/db", () => {
  it("role matches roleEnum", async () => {
    const { roleEnum } = await pgEnums();
    expect([...roleEnum.enumValues].sort()).toEqual(Object.values(Role).sort());
  });

  it("course matches courseEnum", async () => {
    const { courseEnum } = await pgEnums();
    expect([...courseEnum.enumValues].sort()).toEqual(
      Object.values(Course).sort(),
    );
  });

  it("branch matches branchEnum", async () => {
    const { branchEnum } = await pgEnums();
    expect([...branchEnum.enumValues].sort()).toEqual(
      Object.values(Branch).sort(),
    );
  });

  it("student status matches studentStatusEnum", async () => {
    const { studentStatusEnum } = await pgEnums();
    expect([...studentStatusEnum.enumValues].sort()).toEqual(
      Object.values(StudentStatus).sort(),
    );
  });

  it("verification status matches verificationStatusEnum", async () => {
    const { verificationStatusEnum } = await pgEnums();
    expect([...verificationStatusEnum.enumValues].sort()).toEqual(
      Object.values(VerificationStatus).sort(),
    );
  });
});

describe("removed enums", () => {
  it("has no PENDING role", () => {
    expect(Object.values(Role)).not.toContain("PENDING");
  });

  it("does not export SocialType or ExperienceType", async () => {
    const shared = await import("./index");
    expect(shared).not.toHaveProperty("SocialType");
    expect(shared).not.toHaveProperty("ExperienceType");
  });
});
