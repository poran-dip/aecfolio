import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatTimestamp,
  isDateRangeOrdered,
  isParseableDate,
  isPresent,
  parseLooseDate,
} from "./date";

describe("isPresent", () => {
  it.each(["Present", "present", " CURRENT ", "ongoing", "Now", "to date"])(
    "%s reads as ongoing",
    (value) => {
      expect(isPresent(value)).toBe(true);
    },
  );

  it.each(["2024", "Summer 2024", "", null, undefined])(
    "%s does not",
    (value) => {
      expect(isPresent(value)).toBe(false);
    },
  );
});

describe("parseLooseDate", () => {
  it.each([
    ["2024-06-15", Date.UTC(2024, 5, 15)],
    ["2024-06", Date.UTC(2024, 5, 1)],
    ["2024", Date.UTC(2024, 0, 1)],
    ["June 2024", Date.UTC(2024, 5, 1)],
    ["Jun 2024", Date.UTC(2024, 5, 1)],
    ["Sept 2024", Date.UTC(2024, 8, 1)],
    ["06/2024", Date.UTC(2024, 5, 1)],
    ["15/06/2024", Date.UTC(2024, 5, 15)],
  ])("parses %s", (input, expected) => {
    expect(parseLooseDate(input)?.getTime()).toBe(expected);
  });

  it.each(["Present", "Summer 2024", "final year", "", "  ", null, undefined])(
    "returns null for %s rather than throwing",
    (input) => {
      expect(parseLooseDate(input)).toBeNull();
    },
  );

  it("rejects a day that does not exist in its month", () => {
    expect(parseLooseDate("2024-02-31")).toBeNull();
    expect(parseLooseDate("31/02/2024")).toBeNull();
  });

  it("reports parseability without the caller reaching for the Date", () => {
    expect(isParseableDate("2024-06")).toBe(true);
    expect(isParseableDate("Present")).toBe(false);
  });
});

describe("isDateRangeOrdered", () => {
  it("rejects only two resolvable dates in the wrong order", () => {
    expect(isDateRangeOrdered("2024-06", "2023-01")).toBe(false);
  });

  it("accepts a correctly ordered pair", () => {
    expect(isDateRangeOrdered("2023-01", "2024-06")).toBe(true);
  });

  it("accepts an equal pair", () => {
    expect(isDateRangeOrdered("2024-06", "2024-06")).toBe(true);
  });

  it.each([
    ["2024-06", "Present"],
    ["Summer 2024", "2023-01"],
    ["2024-06", null],
    [null, null],
  ])("raises no objection for (%s, %s)", (start, end) => {
    expect(isDateRangeOrdered(start, end)).toBe(true);
  });
});

describe("formatDate", () => {
  it("returns the student's own wording untouched", () => {
    expect(formatDate("Summer 2024")).toBe("Summer 2024");
    expect(formatDate("Jun 2023 – Aug 2023")).toBe("Jun 2023 – Aug 2023");
    expect(formatDate("Present")).toBe("Present");
  });

  it("tidies whitespace", () => {
    expect(formatDate("  Present  ")).toBe("Present");
  });

  it("makes a machine-shaped value readable", () => {
    expect(formatDate("2024-06")).toBe("Jun 2024");
    expect(formatDate("2024-06-15")).toBe("Jun 2024");
  });

  it("leaves a bare year alone", () => {
    expect(formatDate("2024")).toBe("2024");
  });

  it("returns an empty string for nothing", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
    expect(formatDate("   ")).toBe("");
  });
});

describe("formatTimestamp", () => {
  it("renders a real timestamp column", () => {
    expect(formatTimestamp(new Date(Date.UTC(2024, 5, 15)))).toMatch(/2024/);
  });

  it("is empty for null and for garbage", () => {
    expect(formatTimestamp(null)).toBe("");
    expect(formatTimestamp("not a date")).toBe("");
  });
});
