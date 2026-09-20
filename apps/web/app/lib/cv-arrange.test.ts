import type { CvSectionsConfig } from "@aecfolio/shared";
import { type CvData, standardManifest } from "@aecfolio/ui";
import { describe, expect, it } from "vitest";
import {
  normalizeSections,
  reviveDates,
  sectionEntries,
  sectionKey,
  sectionLabel,
} from "./cv-arrange";

function makeData(overrides: Partial<CvData> = {}): CvData {
  return {
    experiences: [],
    projects: [],
    interests: [],
    socials: [],
    customSections: [],
    achievements: [],
    certifications: [],
    results: [],
    cgpaMark: null,
    ...overrides,
  } as unknown as CvData;
}

const custom = (id: string, name: string, entries: unknown[] = []) =>
  ({ id, name, entries }) as unknown as CvData["customSections"][number];

describe("reviveDates", () => {
  it("turns an ISO timestamp into a Date and leaves other strings alone", () => {
    const revived = reviveDates<{ at: Date; date: string; dob: string }>({
      at: "2026-03-01T10:00:00.000Z",
      date: "May 2025 – Jul 2025",
      dob: "2003-08-12",
    });

    expect(revived.at).toBeInstanceOf(Date);
    expect(revived.date).toBe("May 2025 – Jul 2025");
    expect(revived.dob).toBe("2003-08-12");
  });

  it("walks arrays and nested objects", () => {
    const revived = reviveDates<{ rows: { createdAt: Date }[] }>({
      rows: [{ createdAt: "2026-03-01T10:00:00.000Z" }],
    });

    expect(revived.rows[0].createdAt).toBeInstanceOf(Date);
  });
});

describe("normalizeSections", () => {
  it("falls back to the template's defaults when nothing is saved", () => {
    const sections = normalizeSections(standardManifest, makeData(), undefined);

    expect(sections.map(sectionKey)).toEqual([
      ...standardManifest.defaultSections,
    ]);
  });

  it("appends a custom section created after the preference was saved", () => {
    const data = makeData({ customSections: [custom("cs1", "Publications")] });
    const saved: CvSectionsConfig = [
      { type: "summary", include: true, order: 0, entryOrder: [] },
      { type: "projects", include: false, order: 1, entryOrder: [] },
    ];

    const sections = normalizeSections(standardManifest, data, saved);

    expect(sections.map(sectionKey)).toContain("custom:cs1");
    expect(sections.find((s) => s.type === "projects")?.include).toBe(false);
  });

  it("drops a custom section that no longer exists", () => {
    const saved: CvSectionsConfig = [
      { type: "summary", include: true, order: 0, entryOrder: [] },
      {
        type: "custom",
        customSectionId: "gone",
        include: true,
        order: 1,
        entryOrder: [],
      },
    ];

    const sections = normalizeSections(standardManifest, makeData(), saved);

    expect(sections.map(sectionKey)).not.toContain("custom:gone");
  });

  it("renumbers order so it is contiguous and matches the shown order", () => {
    const saved: CvSectionsConfig = [
      { type: "skills", include: true, order: 9, entryOrder: [] },
      { type: "summary", include: true, order: 4, entryOrder: [] },
    ];

    const sections = normalizeSections(standardManifest, makeData(), saved);

    expect(sections.map((s) => s.order)).toEqual(
      sections.map((_, index) => index),
    );
    expect(sectionKey(sections[0])).toBe("summary");
  });
});

describe("sectionEntries", () => {
  it("has nothing to arrange for summary", () => {
    expect(
      sectionEntries(
        { type: "summary", include: true, order: 0, entryOrder: [] },
        makeData(),
      ),
    ).toEqual([]);
  });

  it("labels an experience with its organisation", () => {
    const data = makeData({
      experiences: [
        { id: "e1", title: "Backend Intern", organization: "Zoho" },
      ] as unknown as CvData["experiences"],
    });

    expect(
      sectionEntries(
        { type: "experiences", include: true, order: 0, entryOrder: [] },
        data,
      ),
    ).toEqual([{ id: "e1", label: "Backend Intern · Zoho" }]);
  });

  it("offers no semester results to arrange, however many there are", () => {
    const data = makeData({
      results: [
        { id: "r4", semester: 4 },
        { id: "r1", semester: 1 },
      ] as unknown as CvData["results"],
    });

    expect(
      sectionEntries(
        { type: "results", include: true, order: 0, entryOrder: [] },
        data,
      ),
    ).toEqual([]);
  });

  it("reads a custom section's own entries and name", () => {
    const data = makeData({
      customSections: [
        custom("cs1", "Publications", [{ id: "p1", title: "A paper" }]),
      ],
    });
    const section = {
      type: "custom" as const,
      customSectionId: "cs1",
      include: true,
      order: 0,
      entryOrder: [],
    };

    expect(sectionLabel(section, data)).toBe("Publications");
    expect(sectionEntries(section, data)).toEqual([
      { id: "p1", label: "A paper" },
    ]);
  });
});
