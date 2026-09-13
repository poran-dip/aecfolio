import { describe, expect, it } from "vitest";
import { EXPERIENCE_TYPE_SUGGESTIONS } from "../constants/suggestions";
import { createAchievementSchema } from "./achievement";
import { createCertificationSchema } from "./certification";
import { reviewDecisionSchema } from "./common";
import { cvSectionsConfigSchema, upsertCvPreferenceSchema } from "./cv";
import { createExperienceSchema } from "./experience";
import { createProjectSchema } from "./project";
import { createResultSchema } from "./result";
import { createSemesterCreditSchemeSchema } from "./semester-credit-scheme";
import { createSocialSchema } from "./social";
import { createStudentSchema, updateStudentProfileSchema } from "./student";

describe("review decision", () => {
  it("accepts a plain verify", () => {
    expect(reviewDecisionSchema.parse({ status: "VERIFIED" })).toEqual({
      status: "VERIFIED",
    });
  });

  it("requires a reason on reject", () => {
    expect(reviewDecisionSchema.safeParse({ status: "REJECTED" }).success).toBe(
      false,
    );
    expect(
      reviewDecisionSchema.safeParse({
        status: "REJECTED",
        rejectionReason: "  ",
      }).success,
    ).toBe(false);
    expect(
      reviewDecisionSchema.parse({
        status: "REJECTED",
        rejectionReason: "Scanned copy is unreadable",
      }),
    ).toEqual({
      status: "REJECTED",
      rejectionReason: "Scanned copy is unreadable",
    });
  });

  it("will not let a reviewer set PENDING", () => {
    expect(reviewDecisionSchema.safeParse({ status: "PENDING" }).success).toBe(
      false,
    );
  });
});

describe("proof is an object key, not a URL", () => {
  it("accepts a bucket key on an achievement", () => {
    expect(
      createAchievementSchema.parse({
        title: "Hackathon winner",
        description: "First place",
        proofKey: "proofs/stu_1/abc.pdf",
      }).proofKey,
    ).toBe("proofs/stu_1/abc.pdf");
  });

  it("no longer has a proofImage field to paste a link into", () => {
    const parsed = createAchievementSchema.parse({
      title: "Hackathon winner",
      description: "First place",
      proofImage: "https://example.com/evil.png",
    });
    expect(parsed).not.toHaveProperty("proofImage");
  });
});

describe("free-text entry dates", () => {
  it("accepts an informal certification issue date", () => {
    expect(
      createCertificationSchema.parse({
        name: "AWS Cloud Practitioner",
        issuer: "Amazon",
        issueDate: "Summer 2024",
      }).issueDate,
    ).toBe("Summer 2024");
  });

  it("accepts a single free-text span on an experience", () => {
    expect(
      createExperienceSchema.parse({
        type: "Internship",
        title: "SDE Intern",
        organization: "Acme",
        description: "Worked on the thing",
        date: "Jun 2024 - Present",
      }).date,
    ).toBe("Jun 2024 - Present");
  });

  it("has no startDate/endDate pair any more", () => {
    const parsed = createExperienceSchema.parse({
      type: "Internship",
      title: "SDE Intern",
      organization: "Acme",
      description: "Worked on the thing",
      startDate: "2024-06-01",
      endDate: "2024-08-01",
    });
    expect(parsed).not.toHaveProperty("startDate");
    expect(parsed).not.toHaveProperty("endDate");
  });

  it("rejects prose in a date field", () => {
    expect(
      createExperienceSchema.safeParse({
        type: "Internship",
        title: "SDE Intern",
        organization: "Acme",
        description: "Worked on the thing",
        date: "x".repeat(200),
      }).success,
    ).toBe(false);
  });
});

describe("free text with suggestions, not enums", () => {
  it("accepts an experience type outside the suggestion list", () => {
    expect(
      createExperienceSchema.safeParse({
        type: "Research Assistantship",
        title: "RA",
        organization: "AEC",
        description: "Lab work",
      }).success,
    ).toBe(true);
  });

  it("still accepts every suggested value", () => {
    for (const type of EXPERIENCE_TYPE_SUGGESTIONS) {
      expect(
        createExperienceSchema.safeParse({
          type,
          title: "T",
          organization: "O",
          description: "D",
        }).success,
      ).toBe(true);
    }
  });

  it("takes a free-text social title with an https url", () => {
    expect(
      createSocialSchema.parse({
        title: "Codechef",
        url: "https://codechef.com/users/x",
      }).title,
    ).toBe("Codechef");
  });

  it("rejects a social url the DB CHECK would reject", () => {
    // social_url_format is `url ~ '^https?://'`.
    expect(
      createSocialSchema.safeParse({
        title: "Portfolio",
        url: "ftp://example.com",
      }).success,
    ).toBe(false);
  });
});

describe("dropped fields", () => {
  it("projects no longer carry a tech stack", () => {
    const parsed = createProjectSchema.parse({
      title: "AECFolio",
      description: "This",
      techStack: ["ts"],
    });
    expect(parsed).not.toHaveProperty("techStack");
  });
});

describe("results", () => {
  it("takes a pending SGPA and nothing else", () => {
    expect(createResultSchema.parse({ semester: 3, pendingSgpa: 8.4 })).toEqual(
      {
        semester: 3,
        pendingSgpa: 8.4,
      },
    );
  });

  it("will not accept a client-chosen schemeId", () => {
    const parsed = createResultSchema.parse({
      semester: 3,
      pendingSgpa: 8.4,
      schemeId: "someone_elses_cohort",
    });
    expect(parsed).not.toHaveProperty("schemeId");
  });

  it("will not accept a client-supplied verified SGPA", () => {
    const parsed = createResultSchema.parse({
      semester: 3,
      pendingSgpa: 8.4,
      sgpa: 10,
    });
    expect(parsed).not.toHaveProperty("sgpa");
  });

  it("bounds semester and SGPA the way the DB CHECKs do", () => {
    expect(
      createResultSchema.safeParse({ semester: 9, pendingSgpa: 8 }).success,
    ).toBe(false);
    expect(
      createResultSchema.safeParse({ semester: 1, pendingSgpa: 10.5 }).success,
    ).toBe(false);
  });
});

describe("students", () => {
  it("requires an admission year", () => {
    expect(
      createStudentSchema.safeParse({
        rollNo: "22CSE001",
        course: "BTECH",
        branch: "CSE",
        semester: 5,
      }).success,
    ).toBe(false);
  });

  it("accepts the full academic identity", () => {
    expect(
      createStudentSchema.parse({
        rollNo: "22CSE001",
        course: "BTECH",
        branch: "CSE",
        semester: 5,
        admissionYear: 2022,
      }).admissionYear,
    ).toBe(2022);
  });

  it("keeps derived and faculty-owned fields out of a student's own edit", () => {
    const parsed = updateStudentProfileSchema.parse({
      bio: "hi",
      cgpa: 10,
      semester: 8,
      status: "ALUMNI",
      rollNo: "22CSE999",
    });
    expect(parsed).toEqual({ bio: "hi" });
  });
});

describe("semester credit schemes", () => {
  it("requires a positive credit total", () => {
    expect(
      createSemesterCreditSchemeSchema.safeParse({
        branch: "CSE",
        admissionYear: 2022,
        semester: 5,
        totalCredits: 0,
      }).success,
    ).toBe(false);
  });

  it("accepts a cohort row", () => {
    expect(
      createSemesterCreditSchemeSchema.parse({
        branch: "CSE",
        admissionYear: 2022,
        semester: 5,
        totalCredits: 24,
      }),
    ).toEqual({
      branch: "CSE",
      admissionYear: 2022,
      semester: 5,
      totalCredits: 24,
    });
  });
});

describe("cv preferences", () => {
  const section = {
    type: "projects" as const,
    include: true,
    order: 0,
    entryOrder: ["p2", "p1"],
  };

  it("keeps the student's entry order", () => {
    expect(cvSectionsConfigSchema.parse([section])[0].entryOrder).toEqual([
      "p2",
      "p1",
    ]);
  });

  it("defaults entryOrder to empty", () => {
    expect(
      cvSectionsConfigSchema.parse([
        { type: "socials", include: true, order: 1 },
      ])[0].entryOrder,
    ).toEqual([]);
  });

  it("requires a custom section to name which one", () => {
    expect(
      cvSectionsConfigSchema.safeParse([
        { type: "custom", include: true, order: 0 },
      ]).success,
    ).toBe(false);
  });

  it("rejects the same section listed twice", () => {
    expect(cvSectionsConfigSchema.safeParse([section, section]).success).toBe(
      false,
    );
  });

  it("allows two different custom sections", () => {
    expect(
      cvSectionsConfigSchema.safeParse([
        { type: "custom", customSectionId: "cs_1", include: true, order: 0 },
        { type: "custom", customSectionId: "cs_2", include: true, order: 1 },
      ]).success,
    ).toBe(true);
  });

  it("upserts against a template id", () => {
    expect(
      upsertCvPreferenceSchema.parse({
        templateId: "standard",
        sections: [section],
      }).templateId,
    ).toBe("standard");
  });
});
