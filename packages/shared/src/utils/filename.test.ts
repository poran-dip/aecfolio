import { describe, expect, it } from "vitest";
import {
  attachmentHeader,
  cvFileBaseName,
  cvFileName,
  rollNoDigits,
  uniqueFileName,
} from "./filename";

describe("rollNoDigits", () => {
  it("strips the slash our roll numbers are written with", () => {
    expect(rollNoDigits("23/162")).toBe("23162");
  });

  it("handles the other shapes a roll number gets typed in", () => {
    expect(rollNoDigits("23-162")).toBe("23162");
    expect(rollNoDigits(" 23 / 162 ")).toBe("23162");
    expect(rollNoDigits("23162")).toBe("23162");
  });

  it("is empty when there are no digits to find", () => {
    expect(rollNoDigits("")).toBe("");
    expect(rollNoDigits(null)).toBe("");
    expect(rollNoDigits(undefined)).toBe("");
  });
});

describe("cvFileBaseName", () => {
  it("puts the roll number first, then the name", () => {
    expect(cvFileBaseName({ rollNo: "23/162", name: "Poran Boruah" })).toBe(
      "23162-Poran-Boruah",
    );
  });

  it("keeps the name's capitalisation", () => {
    expect(cvFileBaseName({ rollNo: "22/101", name: "Ananya Borah" })).toBe(
      "22101-Ananya-Borah",
    );
  });

  it("collapses whatever separators a name arrives with", () => {
    expect(
      cvFileBaseName({ rollNo: "23/1", name: "  Rita   Devi-Kalita  " }),
    ).toBe("231-Rita-Devi-Kalita");
  });

  it("folds accents rather than dropping the letter", () => {
    expect(cvFileBaseName({ rollNo: "23/5", name: "Bezbaruáh" })).toBe(
      "235-Bezbaruah",
    );
  });

  it("stands one part alone rather than leaving a dangling separator", () => {
    expect(cvFileBaseName({ rollNo: "23/162", name: "" })).toBe("23162");
    expect(cvFileBaseName({ rollNo: "", name: "Poran Boruah" })).toBe(
      "Poran-Boruah",
    );
    expect(cvFileBaseName({ rollNo: "no-digits-here", name: "" })).toBe(
      "resume",
    );
  });

  it("falls back to something downloadable when there is nothing to use", () => {
    expect(cvFileBaseName({ rollNo: null, name: null })).toBe("resume");
  });

  it("caps a very long name", () => {
    const long = "A".repeat(500);
    expect(cvFileBaseName({ rollNo: "23/1", name: long }).length).toBeLessThan(
      120,
    );
  });
});

describe("non-Latin names — deliberately unsupported", () => {
  it("falls back to the roll number alone, and does not preserve the script", () => {
    expect(cvFileBaseName({ rollNo: "23/162", name: "পূরণ বৰুৱা" })).toBe("23162");
  });

  it("emits one filename parameter and no filename*", () => {
    const header = attachmentHeader(
      cvFileName({ rollNo: "23/162", name: "Poran Boruah" }),
    );
    expect(header).not.toContain("filename*");
    expect(header).not.toContain("UTF-8''");
  });
});

describe("cvFileName", () => {
  it("adds the extension", () => {
    expect(cvFileName({ rollNo: "23/162", name: "Poran Boruah" })).toBe(
      "23162-Poran-Boruah.pdf",
    );
  });

  it("takes another extension", () => {
    expect(cvFileName({ rollNo: "23/162", name: "P B" }, "zip")).toBe(
      "23162-P-B.zip",
    );
  });
});

describe("attachmentHeader", () => {
  it("builds the header from the sanitised name", () => {
    expect(
      attachmentHeader(cvFileName({ rollNo: "23/162", name: "Poran Boruah" })),
    ).toBe('attachment; filename="23162-Poran-Boruah.pdf"');
  });

  it("cannot be escaped by a name containing a quote", () => {
    const header = attachmentHeader(
      cvFileName({ rollNo: "23/162", name: 'Evil" ; x=y' }),
    );
    expect(header.match(/"/g)).toHaveLength(2);
    expect(header).toBe('attachment; filename="23162-Evil-x-y.pdf"');
  });

  it("cannot be escaped by CR/LF — the response-splitting case", () => {
    const header = attachmentHeader(
      cvFileName({ rollNo: "23/162", name: "A\r\nSet-Cookie: admin=1" }),
    );
    expect(header).not.toContain("\r");
    expect(header).not.toContain("\n");
    expect(header).not.toContain("Set-Cookie: admin=1");
  });
});

describe("uniqueFileName — zip collision", () => {
  it("passes a name through the first time", () => {
    const taken = new Set<string>();
    expect(uniqueFileName(taken, "23162-Poran.pdf")).toBe("23162-Poran.pdf");
  });

  it("suffixes a repeat rather than silently overwriting it", () => {
    const taken = new Set<string>();
    uniqueFileName(taken, "resume.pdf");
    expect(uniqueFileName(taken, "resume.pdf")).toBe("resume-2.pdf");
    expect(uniqueFileName(taken, "resume.pdf")).toBe("resume-3.pdf");
  });

  it("keeps the extension on the end where it belongs", () => {
    const taken = new Set(["a.b.pdf"]);
    expect(uniqueFileName(taken, "a.b.pdf")).toBe("a.b-2.pdf");
  });

  it("handles a name with no extension", () => {
    const taken = new Set(["x"]);
    expect(uniqueFileName(taken, "x")).toBe("x-2");
  });
});
