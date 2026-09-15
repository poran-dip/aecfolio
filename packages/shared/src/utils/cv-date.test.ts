import { describe, expect, it } from "vitest";
import {
  composeDate,
  DATE_RANGE_SEPARATOR,
  decomposeDate,
  formatYearMonth,
  isYearMonthOrdered,
  parseYearMonth,
} from "./cv-date";
import { formatDate, isPresent, parseLooseDate } from "./date";

const range = (from: string, to: string) =>
  `${from}${DATE_RANGE_SEPARATOR}${to}`;

const jan25 = { year: 2025, month: 1 };
const dec25 = { year: 2025, month: 12 };
const mar26 = { year: 2026, month: 3 };

describe("formatYearMonth / parseYearMonth", () => {
  it("formats as a three-letter month and a year", () => {
    expect(formatYearMonth(jan25)).toBe("Jan 2025");
    expect(formatYearMonth(dec25)).toBe("Dec 2025");
  });

  it("round-trips", () => {
    for (let month = 1; month <= 12; month++) {
      const value = { year: 2025, month };
      expect(parseYearMonth(formatYearMonth(value))).toEqual(value);
    }
  });

  it("reads the longer and odder spellings a human might have typed", () => {
    expect(parseYearMonth("January 2025")).toEqual(jan25);
    expect(parseYearMonth("Sept 2025")).toEqual({ year: 2025, month: 9 });
    expect(parseYearMonth("sep 2025")).toEqual({ year: 2025, month: 9 });
    expect(parseYearMonth("2025-01")).toEqual(jan25);
  });

  it("refuses anything that is not a month and a year", () => {
    expect(parseYearMonth("Summer 2025")).toBeNull();
    expect(parseYearMonth("2025")).toBeNull();
    expect(parseYearMonth("2025-13")).toBeNull();
    expect(parseYearMonth("")).toBeNull();
  });
});

describe("the separator", () => {
  it("is a spaced en dash, U+2013", () => {
    expect(DATE_RANGE_SEPARATOR).toHaveLength(3);
    expect(DATE_RANGE_SEPARATOR.charCodeAt(0)).toBe(0x20);
    expect(DATE_RANGE_SEPARATOR.charCodeAt(1)).toBe(0x2013);
    expect(DATE_RANGE_SEPARATOR.charCodeAt(2)).toBe(0x20);
  });
});

describe("composeDate", () => {
  it("joins a start and an end with a spaced en dash", () => {
    expect(composeDate({ start: jan25, end: dec25 })).toBe(
      range("Jan 2025", "Dec 2025"),
    );
  });

  it("collapses a one-month span to a single date", () => {
    expect(composeDate({ start: jan25, end: jan25 })).toBe("Jan 2025");
  });

  it("writes Present instead of an end date", () => {
    expect(composeDate({ start: jan25, present: true })).toBe(
      range("Jan 2025", "Present"),
    );
  });

  it("ignores the end picker entirely when Present is checked", () => {
    expect(composeDate({ start: jan25, end: dec25, present: true })).toBe(
      range("Jan 2025", "Present"),
    );
  });

  it("returns the start alone when there is no end", () => {
    expect(composeDate({ start: jan25 })).toBe("Jan 2025");
    expect(composeDate({ start: jan25, end: null })).toBe("Jan 2025");
  });

  it("lets custom text win over the pickers", () => {
    expect(
      composeDate({ custom: "Summer 2025", start: jan25, end: dec25 }),
    ).toBe("Summer 2025");
  });

  it("trims custom text and ignores it when blank", () => {
    expect(composeDate({ custom: "  Summer 2025  " })).toBe("Summer 2025");
    expect(composeDate({ custom: "   ", start: jan25 })).toBe("Jan 2025");
  });

  it("returns null when there is nothing to store", () => {
    expect(composeDate({})).toBeNull();
    expect(composeDate({ custom: null, start: null })).toBeNull();
    expect(composeDate({ end: dec25 })).toBeNull();
  });

  it("returns null rather than an off-by-one month name", () => {
    expect(composeDate({ start: { year: 2025, month: 0 } })).toBeNull();
    expect(composeDate({ start: { year: 2025, month: 13 } })).toBeNull();
    expect(composeDate({ start: { year: 2025, month: 1.5 } })).toBeNull();
  });

  it("does not reject an inverted range — that check happens elsewhere", () => {
    expect(composeDate({ start: dec25, end: jan25 })).toBe(
      range("Dec 2025", "Jan 2025"),
    );
  });
});

describe("decomposeDate", () => {
  it("round-trips everything composeDate writes", () => {
    const cases = [
      { start: jan25, end: dec25 },
      { start: jan25 },
      { start: jan25, present: true },
      { start: mar26, end: mar26 },
      { custom: "Summer 2025" },
    ];
    for (const input of cases) {
      const stored = composeDate(input);
      expect(composeDate(decomposeDate(stored))).toBe(stored);
    }
  });

  it("opens a range in the pickers", () => {
    expect(decomposeDate(range("Jan 2025", "Dec 2025"))).toEqual({
      custom: null,
      start: jan25,
      end: dec25,
      present: false,
    });
  });

  it("checks the Present box", () => {
    expect(decomposeDate(range("Jan 2025", "Present"))).toEqual({
      custom: null,
      start: jan25,
      end: null,
      present: true,
    });
  });

  it("opens a single date as a start with no end", () => {
    expect(decomposeDate("Jan 2025")).toEqual({
      custom: null,
      start: jan25,
      end: null,
      present: false,
    });
  });

  it("falls back to the custom box, keeping the text intact", () => {
    expect(decomposeDate("Summer 2025")).toEqual({
      custom: "Summer 2025",
      start: null,
      end: null,
      present: false,
    });
    expect(decomposeDate("whenever I get round to it").custom).toBe(
      "whenever I get round to it",
    );
  });

  it("reads separators it would never write", () => {
    const emDash = String.fromCharCode(0x2014);
    for (const stored of [
      "Jan 2025 - Dec 2025",
      `Jan 2025${emDash}Dec 2025`,
      "Jan 2025 to Dec 2025",
      "Jan 2025-Dec 2025",
    ]) {
      expect(decomposeDate(stored)).toMatchObject({ start: jan25, end: dec25 });
    }
  });

  it("reads the other ways Present gets written", () => {
    for (const stored of [
      range("Jan 2025", "Present"),
      "Jan 2025 - present",
      "Jan 2025 to Current",
      range("Jan 2025", "Ongoing"),
    ]) {
      expect(decomposeDate(stored).present).toBe(true);
    }
  });

  it("is empty for an empty value", () => {
    for (const value of [null, undefined, "", "   "]) {
      expect(decomposeDate(value)).toEqual({
        custom: null,
        start: null,
        end: null,
        present: false,
      });
    }
  });

  it("does not mistake a half-readable range for a range", () => {
    const stored = range("Jan 2025", "sometime");
    expect(decomposeDate(stored).custom).toBe(stored);
  });
});

describe("isYearMonthOrdered", () => {
  it("accepts an ordered range", () => {
    expect(isYearMonthOrdered(jan25, dec25)).toBe(true);
    expect(isYearMonthOrdered(dec25, mar26)).toBe(true);
  });

  it("accepts the same month", () => {
    expect(isYearMonthOrdered(jan25, jan25)).toBe(true);
  });

  it("rejects an end before its start", () => {
    expect(isYearMonthOrdered(dec25, jan25)).toBe(false);
    expect(isYearMonthOrdered(mar26, dec25)).toBe(false);
  });

  it("has no objection when there is no range", () => {
    expect(isYearMonthOrdered(jan25, null)).toBe(true);
    expect(isYearMonthOrdered(null, dec25)).toBe(true);
    expect(isYearMonthOrdered(null, null)).toBe(true);
  });
});

describe("what composeDate writes stays readable by the rest of the stack", () => {
  it("survives formatDate unchanged — it is already the display form", () => {
    for (const input of [
      { start: jan25, end: dec25 },
      { start: jan25 },
      { start: jan25, present: true },
    ]) {
      const stored = composeDate(input) as string;
      expect(formatDate(stored)).toBe(stored);
    }
  });

  it("leaves a single date parseable by parseLooseDate", () => {
    expect(parseLooseDate(composeDate({ start: jan25 }))).toEqual(
      new Date(Date.UTC(2025, 0, 1)),
    );
  });

  it("writes a Present token isPresent recognises", () => {
    const stored = composeDate({ start: jan25, present: true }) as string;
    expect(isPresent(stored.split(DATE_RANGE_SEPARATOR)[1])).toBe(true);
  });
});
