import { isPresent } from "./date";

export const DATE_RANGE_SEPARATOR = " – ";

export const PRESENT_LABEL = "Present";

export type YearMonth = {
  year: number;
  month: number;
};

export type CvDateInput = {
  custom?: string | null;
  start?: YearMonth | null;
  end?: YearMonth | null;
  present?: boolean;
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const SEPARATOR_PATTERN = /\s*(?:[–—-]|\bto\b)\s*/i;

function isValidYearMonth(
  value: YearMonth | null | undefined,
): value is YearMonth {
  return (
    !!value &&
    Number.isInteger(value.year) &&
    Number.isInteger(value.month) &&
    value.month >= 1 &&
    value.month <= 12
  );
}

export function formatYearMonth(value: YearMonth): string {
  return `${MONTH_NAMES[value.month - 1]} ${value.year}`;
}

export function parseYearMonth(value: string): YearMonth | null {
  const raw = value.trim();
  if (!raw) return null;

  const monthYear = /^([A-Za-z]+)\.?\s+(\d{4})$/.exec(raw);
  if (monthYear) {
    const needle = monthYear[1].slice(0, 3).toLowerCase();
    const index = MONTH_NAMES.findIndex((m) => m.toLowerCase() === needle);
    if (index === -1) return null;
    return { year: Number(monthYear[2]), month: index + 1 };
  }

  const isoish = /^(\d{4})-(\d{1,2})$/.exec(raw);
  if (isoish) {
    const month = Number(isoish[2]);
    if (month < 1 || month > 12) return null;
    return { year: Number(isoish[1]), month };
  }

  return null;
}

export function composeDate(input: CvDateInput): string | null {
  const custom = input.custom?.trim();
  if (custom) return custom;

  if (!isValidYearMonth(input.start)) return null;
  const start = formatYearMonth(input.start);

  if (input.present) return `${start}${DATE_RANGE_SEPARATOR}${PRESENT_LABEL}`;

  if (!isValidYearMonth(input.end)) return start;

  if (
    input.end.year === input.start.year &&
    input.end.month === input.start.month
  ) {
    return start;
  }

  return `${start}${DATE_RANGE_SEPARATOR}${formatYearMonth(input.end)}`;
}

export function decomposeDate(value: string | null | undefined): CvDateInput {
  const raw = value?.trim();
  if (!raw) return { custom: null, start: null, end: null, present: false };

  const parts = raw.split(SEPARATOR_PATTERN).filter(Boolean);

  if (parts.length === 1) {
    const only = parseYearMonth(parts[0]);
    return only
      ? { custom: null, start: only, end: null, present: false }
      : { custom: raw, start: null, end: null, present: false };
  }

  if (parts.length === 2) {
    const start = parseYearMonth(parts[0]);
    if (start) {
      if (isPresent(parts[1])) {
        return { custom: null, start, end: null, present: true };
      }
      const end = parseYearMonth(parts[1]);
      if (end) return { custom: null, start, end, present: false };
    }
  }

  return { custom: raw, start: null, end: null, present: false };
}

export function isYearMonthOrdered(
  start: YearMonth | null | undefined,
  end: YearMonth | null | undefined,
): boolean {
  if (!isValidYearMonth(start) || !isValidYearMonth(end)) return true;
  if (end.year !== start.year) return end.year > start.year;
  return end.month >= start.month;
}
