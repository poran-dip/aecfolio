type PostgresError = {
  code?: string;
  constraint?: string;
  detail?: string;
  message?: string;
  severity?: string;
};

export function pgError(error: unknown): PostgresError | null {
  let current: unknown = error;

  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (
      typeof current === "object" &&
      current !== null &&
      "severity" in current &&
      "code" in current
    )
      return current as PostgresError;

    current = (current as { cause?: unknown }).cause;
  }

  return null;
}

export function constraintOf(error: unknown) {
  return pgError(error)?.constraint ?? null;
}

export function pgMessage(error: unknown) {
  const postgres = pgError(error);
  if (postgres?.message) return postgres.message;
  return error instanceof Error ? error.message : String(error);
}
