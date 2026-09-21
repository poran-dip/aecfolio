import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { StudentStatus } from "@aecfolio/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeCvData } from "./fixtures";
import { listTemplateManifests, templateManifests } from "./manifests";
import { cvTemplates, getTemplate } from "./registry";

function render(
  input: Parameters<NonNullable<ReturnType<typeof getTemplate>>["render"]>[0],
) {
  const template = getTemplate("standard");
  if (!template) throw new Error("standard template missing from the registry");
  return renderToStaticMarkup(template.render(input));
}

describe("registry", () => {
  it("resolves a known id and refuses an unknown one", () => {
    expect(getTemplate("standard")).not.toBeNull();
    expect(getTemplate("nope")).toBeNull();
    expect(getTemplate("constructor")).toBeNull();
    expect(getTemplate("__proto__")).toBeNull();
  });

  it("has a renderer for every manifest the API can see, and no more", () => {
    expect(Object.keys(cvTemplates).sort()).toEqual(
      Object.keys(templateManifests).sort(),
    );
  });

  it("keeps the manifests entry free of React, so the API can import it", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../manifests.ts", import.meta.url)),
      "utf8",
    );
    expect(source).not.toMatch(/registry|templates\/standard["']|\.tsx/);
  });

  it("every manifest parses an empty options bag", () => {
    for (const manifest of listTemplateManifests()) {
      expect(() => manifest.optionsSchema.parse({})).not.toThrow();
    }
  });
});

describe("the verified mark", () => {
  it("is a bare checkmark, never the word Verified (decision #40)", () => {
    const html = render({ data: makeCvData() });
    expect(html).not.toMatch(/Verified\s*</i);
    expect(html).not.toContain(">Verified<");
    expect(html).toContain('title="Verified by the college');
  });

  it("links to the proof when there is one", () => {
    const html = render({ data: makeCvData() });
    expect(html).toContain(
      'href="https://aecfolio.example/api/achievements/a1/proof"',
    );
  });

  it("renders a bare mark rather than a dead link when proofUrl is null", () => {
    const data = makeCvData();
    const html = render({ data });
    expect(html).not.toContain('href="#"');
    expect(html).not.toContain('href="null"');
    expect(html).not.toContain('href=""');
    expect(html).toContain("Departmental topper");
  });

  it("prints nothing at all for a pending entry (decision #42)", () => {
    const html = render({ data: makeCvData() });
    expect(html).toContain("Inter-college quiz");
    expect(html).not.toMatch(/pending/i);
  });

  it("marks the same entry when the caller says to", () => {
    const base = makeCvData();
    const marked = makeCvData({
      achievements: base.achievements.map((a) =>
        a.id === "a3" ? { ...a, mark: { proofUrl: null } } : a,
      ),
    });
    const before = render({ data: base });
    const after = render({ data: marked });
    expect(after.split("Verified by the college").length).toBe(
      before.split("Verified by the college").length + 1,
    );
  });
});

describe("what never reaches the document", () => {
  it("prints no reviewer name or review timestamp (decision #41)", () => {
    const html = render({ data: makeCvData() });
    expect(html).not.toContain("mod-1");
    expect(html).not.toContain("mod-2");
    expect(html).not.toMatch(/reviewed\s*by/i);
  });

  it("prints no rejection reason", () => {
    const data = makeCvData();
    data.achievements[2].rejectionReason = "Proof was illegible";
    const html = render({ data });
    expect(html).not.toContain("illegible");
  });
});

describe("nothing hardcoded that belongs to the record", () => {
  it("uses the student's own location, not the college's city", () => {
    const html = render({ data: makeCvData() });
    expect(html).toContain("Jorhat, Assam, India");
    expect(html).not.toContain("Guwahati");
  });

  it("falls back to the institution's location only when there is none", () => {
    const data = makeCvData();
    data.student.location = null;
    expect(render({ data })).toContain("Guwahati, Assam, India");
  });

  it("derives the degree from the course, so an MCA is not a B.Tech", () => {
    const data = makeCvData();
    data.student.course = "MCA";
    data.student.branch = "CA";
    const html = render({ data });
    expect(html).toContain("MCA in Computer Applications");
    expect(html).not.toContain("B.Tech");
  });
});

describe("expected graduation", () => {
  it("prints admission year plus four in Education for an active student", () => {
    const data = makeCvData();
    data.student.status = StudentStatus.ACTIVE;
    data.student.admissionYear = 2023;
    const html = render({ data });
    expect(html).toContain("Expected graduation: 2027");
    expect(html.indexOf("Assam Engineering College")).toBeLessThan(
      html.indexOf("Expected graduation: 2027"),
    );
  });

  it("prints nothing for a student who is not active", () => {
    for (const status of [
      StudentStatus.ALUMNI,
      StudentStatus.SUSPENDED,
      StudentStatus.LEFT,
    ]) {
      const data = makeCvData();
      data.student.status = status;
      expect(render({ data })).not.toMatch(/expected graduation/i);
    }
  });
});

describe("right-aligned dates", () => {
  it("are padded in from the page edge so the italic overhang is not clipped", () => {
    const html = render({
      data: makeCvData(),
      sections: [
        { type: "experiences", include: true, order: 0, entryOrder: [] },
        { type: "results", include: true, order: 1, entryOrder: [] },
        { type: "certifications", include: true, order: 2, entryOrder: [] },
      ],
    });
    for (const date of ["Jun 2025 – Present", "2022 – Present", "Mar 2025"]) {
      const at = html.indexOf(date);
      expect(at, date).toBeGreaterThan(-1);
      const italics = [
        ...html.slice(0, at).matchAll(/<span class="([^"]*\bitalic\b[^"]*)"/g),
      ];
      expect(italics.at(-1)?.[1], date).toMatch(/\bpr-3\b/);
    }
  });
});

describe("markdown", () => {
  it("renders block markdown in bodies", () => {
    const html = render({ data: makeCvData() });
    expect(html).toContain("<strong>distributed systems</strong>");
    expect(html).toContain("<li>");
    expect(html).toContain("<code>idempotency-key</code>");
  });

  it("renders inline markdown in titles without a block wrapper", () => {
    const html = render({ data: makeCvData() });
    const heading = /<h1[^>]*>(.*?)<\/h1>/s.exec(html)?.[1] ?? "";
    expect(heading).toContain("<strong>Borah</strong>");
    expect(heading).not.toMatch(/<(p|div|ul|ol|li|h[1-6])[\s>]/);
  });

  it("renders raw HTML as inert text, never as live markup", () => {
    const data = makeCvData();
    data.student.bio =
      'Hello <script>alert("x")</script> <img src=x onerror=y>';
    const html = render({ data });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });

  it("empties a javascript: href", () => {
    const data = makeCvData();
    data.projects[0].description = "[click](javascript:alert(1))";
    const html = render({ data });
    expect(html).not.toContain("javascript:");
  });

  it("drops markdown images, which would otherwise feed the worker's fetch", () => {
    const data = makeCvData();
    data.student.bio = "![x](http://169.254.169.254/latest/meta-data/)";
    const html = render({ data });
    expect(html).not.toContain("169.254.169.254");
    expect(html).not.toContain("<img");
    expect(html).not.toContain('rel="preload"');
  });

  it("cannot let a stray # in a title become a heading", () => {
    const data = makeCvData();
    data.projects[0].title = "# not a heading";
    const html = render({ data });
    expect(html).toContain("not a heading");
    expect(html).not.toMatch(/<h[1-6][^>]*>\s*not a heading/);
  });
});

describe("fields that used to be collected and printed nowhere", () => {
  it("prints the role sought beside the name", () => {
    const html = render({ data: makeCvData() });
    const heading = /<div class="flex items-baseline gap-8">(.*?)<\/div>/s.exec(
      html,
    )?.[1];
    expect(heading).toContain("Backend Engineer");
    expect(heading).toContain("Ananya");
  });

  it("omits the role line when the field is empty", () => {
    const data = makeCvData();
    data.student.titleSought = null;
    expect(render({ data })).not.toContain("Backend Engineer");
  });

  it("prints spoken languages inside the Skills section", () => {
    const html = render({ data: makeCvData() });
    expect(html).toContain("Assamese, English, Hindi");
    expect(html).not.toContain(">Languages</h2>");
  });

  it("hides languages when the option is off", () => {
    const html = render({
      data: makeCvData(),
      options: { showLanguages: false },
    });
    expect(html).not.toContain("Assamese");
    expect(html).toContain("PostgreSQL");
  });

  it("still prints nothing for the biodata-only fields", () => {
    const data = makeCvData();
    data.student.caste = "General";
    data.student.religion = "Hindu";
    data.student.motherName = "Rupa Borah";
    data.student.fatherName = "Dhiren Borah";
    data.student.motherContact = "+91 90000 00001";
    data.student.fatherContact = "+91 90000 00002";
    data.student.dob = "1 January 2004";
    data.student.gender = "Female";
    const html = render({ data });
    for (const value of [
      "General",
      "Hindu",
      "Rupa Borah",
      "Dhiren Borah",
      "90000 00001",
      "90000 00002",
      "1 January 2004",
      "Female",
    ]) {
      expect(html).not.toContain(value);
    }
  });
});

describe("sections and options", () => {
  it("honours include and order from the saved config", () => {
    const html = render({
      data: makeCvData(),
      sections: [
        { type: "certifications", include: true, order: 0, entryOrder: [] },
        { type: "projects", include: true, order: 1, entryOrder: [] },
        { type: "achievements", include: false, order: 2, entryOrder: [] },
      ],
    });
    expect(html.indexOf("Certifications")).toBeLessThan(
      html.indexOf("Projects"),
    );
    expect(html).not.toContain("Smart India Hackathon");
  });

  it("orders entries within a section, keeping unlisted ones at the end", () => {
    const html = render({
      data: makeCvData(),
      sections: [
        { type: "projects", include: true, order: 0, entryOrder: ["p2"] },
      ],
    });
    expect(html.indexOf("No link here")).toBeLessThan(
      html.indexOf("gradebook"),
    );
  });

  it("prints semester results first to last whatever entryOrder was saved", () => {
    const html = render({
      data: makeCvData(),
      sections: [
        {
          type: "results",
          include: true,
          order: 0,
          entryOrder: ["r6", "r5"],
        },
      ],
      options: { showSemesterResults: true },
    });
    expect(html).toContain("Semester 5");
    expect(html.indexOf("Semester 5")).toBeLessThan(html.indexOf("Semester 6"));
  });

  it("falls back to defaults for an unparseable options bag", () => {
    const html = render({
      data: makeCvData(),
      options: { density: "enormous", accent: 42 },
    });
    expect(html).toContain("Summary");
  });

  it("applies accent and density as custom properties on the root", () => {
    const html = render({ data: makeCvData(), options: { accent: "ink" } });
    expect(html).toContain("--color-cv-accent:var(--color-neutral-900)");
    expect(html).toContain("--cv-page-padding-block:10mm");
  });

  it("emits an @page rule so the margin lands on every page, not just the first", () => {
    const html = render({ data: makeCvData() });
    expect(html).toContain("@page{size:210mm 297mm;margin:10mm 12mm;}");
    expect(html).not.toContain("&#x7b;");
  });

  it("keeps the @page margin and the screen sheet on the same numbers", () => {
    const html = render({
      data: makeCvData(),
      options: { density: "compact" },
    });
    expect(html).toContain("margin:8mm 10mm;");
    expect(html).toContain("--cv-page-padding-block:8mm");
    expect(html).toContain("--cv-page-padding-inline:10mm");
  });

  it("treats summary and skills as sections, so they can be excluded", () => {
    const html = render({
      data: makeCvData(),
      sections: [{ type: "projects", include: true, order: 0, entryOrder: [] }],
    });
    expect(html).not.toContain("Summary");
    expect(html).not.toContain("PostgreSQL");
  });

  it("lets the summary be reordered below another section", () => {
    const html = render({
      data: makeCvData(),
      sections: [
        { type: "projects", include: true, order: 0, entryOrder: [] },
        { type: "summary", include: true, order: 1, entryOrder: [] },
      ],
    });
    expect(html.indexOf("Projects")).toBeLessThan(html.indexOf("Summary"));
  });

  it("drops an included section that has nothing to say", () => {
    const data = makeCvData();
    data.student.bio = "   ";
    const html = render({
      data,
      sections: [{ type: "summary", include: true, order: 0, entryOrder: [] }],
    });
    expect(html).not.toContain("Summary");
  });

  it("puts socials in the header and skips unrecognised platforms gracefully", () => {
    const html = render({ data: makeCvData() });
    expect(html).toContain("chat.example.org/@ananya");
    expect(html.indexOf("chat.example.org")).toBeLessThan(
      html.indexOf("Projects"),
    );
  });

  it("skips a section the template does not support without failing", () => {
    expect(() =>
      render({
        data: makeCvData(),
        sections: [
          // @ts-expect-error — deliberately not a section this template knows.
          { type: "publications", include: true, order: 0, entryOrder: [] },
        ],
      }),
    ).not.toThrow();
  });
});
