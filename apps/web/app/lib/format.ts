const DATE = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? DATE.format(date) : "—";
}

export function formatDateTime(
  value: string | Date | null | undefined,
): string {
  const date = toDate(value);
  return date ? DATE_TIME.format(date) : "—";
}

const UNITS: [
  limit: number,
  seconds: number,
  name: Intl.RelativeTimeFormatUnit,
][] = [
  [60, 1, "second"],
  [3600, 60, "minute"],
  [86400, 3600, "hour"],
  [604800, 86400, "day"],
  [2629800, 604800, "week"],
  [31557600, 2629800, "month"],
];

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelative(
  value: string | Date | null | undefined,
): string {
  const date = toDate(value);
  if (!date) return "—";

  const seconds = (date.getTime() - Date.now()) / 1000;
  const magnitude = Math.abs(seconds);

  for (const [limit, divisor, unit] of UNITS) {
    if (magnitude < limit) {
      return RELATIVE.format(Math.round(seconds / divisor), unit);
    }
  }

  return RELATIVE.format(Math.round(seconds / 31557600), "year");
}

export function formatGpa(value: number | null | undefined): string {
  return typeof value === "number" ? value.toFixed(2) : "—";
}

export const ORDINAL_SEMESTER = [
  "",
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
] as const;

export function semesterLabel(semester: number): string {
  return ORDINAL_SEMESTER[semester] ?? `${semester}th`;
}
