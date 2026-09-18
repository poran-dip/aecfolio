const SEPARATOR = "-";

const MAX_NAME_LENGTH = 80;

const FALLBACK = "resume";

export type CvFileNameInput = {
  rollNo?: string | null;
  name?: string | null;
};

function slug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^A-Za-z0-9]+/g, SEPARATOR)
    .slice(0, MAX_NAME_LENGTH)
    .replace(/-{2,}/g, SEPARATOR)
    .replace(/^-+|-+$/g, "");
}

export function rollNoDigits(rollNo: string | null | undefined): string {
  return (rollNo ?? "").replace(/\D+/g, "");
}

export function cvFileBaseName(input: CvFileNameInput): string {
  const parts = [rollNoDigits(input.rollNo), slug(input.name ?? "")];
  return parts.filter(Boolean).join(SEPARATOR) || FALLBACK;
}

export function cvFileName(input: CvFileNameInput, extension = "pdf"): string {
  return `${cvFileBaseName(input)}.${extension}`;
}

export function attachmentHeader(filename: string): string {
  return `attachment; filename="${filename}"`;
}

export function zipExportFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
  const time = `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
  return `aec-cvs-${date}-${time}.zip`;
}

export function uniqueFileName(taken: Set<string>, candidate: string): string {
  if (!taken.has(candidate)) {
    taken.add(candidate);
    return candidate;
  }

  const dot = candidate.lastIndexOf(".");
  const stem = dot === -1 ? candidate : candidate.slice(0, dot);
  const extension = dot === -1 ? "" : candidate.slice(dot);

  let n = 2;
  let next = `${stem}${SEPARATOR}${n}${extension}`;
  while (taken.has(next)) {
    n += 1;
    next = `${stem}${SEPARATOR}${n}${extension}`;
  }

  taken.add(next);
  return next;
}
