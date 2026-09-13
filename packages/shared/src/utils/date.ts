const PRESENT_TOKENS = ["present", "current", "ongoing", "now", "to date"];

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

export function isPresent(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return PRESENT_TOKENS.some((token) => v === token || v === `to ${token}`);
}

export function parseLooseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw || isPresent(raw)) return null;

  const isoish = /^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/.exec(raw);
  if (isoish) {
    const [, y, m, d] = isoish;
    return build(Number(y), m ? Number(m) - 1 : 0, d ? Number(d) : 1);
  }

  const monthYear = /^([a-z]+)\.?\s+(\d{4})$/i.exec(raw);
  if (monthYear) {
    const month = MONTHS[monthYear[1].toLowerCase()];
    if (month === undefined) return null;
    return build(Number(monthYear[2]), month, 1);
  }

  const yearMonth = /^(\d{4})\s+([a-z]+)$/i.exec(raw);
  if (yearMonth) {
    const month = MONTHS[yearMonth[2].toLowerCase()];
    if (month === undefined) return null;
    return build(Number(yearMonth[1]), month, 1);
  }

  const monthSlashYear = /^(\d{1,2})\/(\d{4})$/.exec(raw);
  if (monthSlashYear) {
    return build(Number(monthSlashYear[2]), Number(monthSlashYear[1]) - 1, 1);
  }

  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (dmy) {
    return build(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  }

  return null;
}

function build(year: number, month: number, day: number): Date | null {
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month, day));
  if (Number.isNaN(d.getTime())) return null;
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return d;
}

export function isParseableDate(value: string | null | undefined): boolean {
  return parseLooseDate(value) !== null;
}

export function isDateRangeOrdered(
  start: string | null | undefined,
  end: string | null | undefined,
): boolean {
  const from = parseLooseDate(start);
  const to = parseLooseDate(end);
  if (!from || !to) return true;
  return to.getTime() >= from.getTime();
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const raw = value.trim();
  if (!raw) return "";
  if (!/^\d{4}(-\d{1,2}){0,2}$/.test(raw)) return raw;

  const parsed = parseLooseDate(raw);
  if (!parsed) return raw;
  if (/^\d{4}$/.test(raw)) return raw;

  return parsed.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatTimestamp(
  value: Date | string | null | undefined,
): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
