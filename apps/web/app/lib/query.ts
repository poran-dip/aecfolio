export const PAGE_SIZE_DEFAULT = 25;

export type PageInfo = {
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
};

export function pageCount({ total, pageSize }: PageInfo): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function rangeOf({ total, page, pageSize }: PageInfo): {
  from: number;
  to: number;
} {
  if (total === 0) return { from: 0, to: 0 };
  const from = (page - 1) * pageSize + 1;
  return { from, to: Math.min(page * pageSize, total) };
}

export function intParam(
  params: URLSearchParams,
  key: string,
  fallback?: number,
): number | undefined {
  const raw = params.get(key);
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function stringParam(
  params: URLSearchParams,
  key: string,
): string | undefined {
  const value = params.get(key)?.trim();
  return value ? value : undefined;
}

export function enumParam<T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = params.get(key);
  return value && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

export function boolParam(params: URLSearchParams, key: string): boolean {
  return params.get(key) === "true";
}

export function withParams(
  current: URLSearchParams,
  changes: Record<string, string | number | boolean | null | undefined>,
): string {
  const next = new URLSearchParams(current);

  for (const [key, value] of Object.entries(changes)) {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      value === false
    )
      next.delete(key);
    else next.set(key, String(value));
  }

  if (!Object.hasOwn(changes, "page")) next.delete("page");

  const query = next.toString();
  return query ? `?${query}` : "?";
}

export function queryOf(
  values: Record<string, string | number | boolean | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === "") continue;
    out[key] = String(value);
  }

  return out;
}
