import { describe, expect, it } from "vitest";
import { SEMESTER_MAX } from "../constants/limits";
import { StudentStatus } from "../enums";
import { COURSE_DURATION_YEARS, expectedGraduationYear } from "./graduation";

describe("expectedGraduationYear", () => {
  it("is the admission year plus four for an active student", () => {
    expect(
      expectedGraduationYear({
        status: StudentStatus.ACTIVE,
        admissionYear: 2022,
      }),
    ).toBe(2026);
    expect(
      expectedGraduationYear({
        status: StudentStatus.ACTIVE,
        admissionYear: 2025,
      }),
    ).toBe(2029);
  });

  it("is null for anyone who is not active, since it is no longer expected", () => {
    for (const status of [
      StudentStatus.ALUMNI,
      StudentStatus.SUSPENDED,
      StudentStatus.LEFT,
    ]) {
      expect(
        expectedGraduationYear({ status, admissionYear: 2022 }),
      ).toBeNull();
    }
  });

  it("follows the semester cap, so cohort promotion and this cannot disagree", () => {
    expect(COURSE_DURATION_YEARS).toBe(4);
    expect(COURSE_DURATION_YEARS * 2).toBe(SEMESTER_MAX);
  });
});
