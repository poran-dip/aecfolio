import type { ApiError, ApiSuccess, PaginatedData } from "@aecfolio/shared";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "../types/context";

export function getUser(c: Context<AppEnv>) {
  const user = c.get("user");
  if (!user) throw new Error("User not set — requireRole middleware missing");
  return user;
}

export function ok<T>(c: Context, data: T, status: ContentfulStatusCode = 200) {
  return c.json({ success: true, data } satisfies ApiSuccess<T>, status);
}

export function paginated<T>(c: Context, data: PaginatedData<T>) {
  return c.json({ success: true, data } satisfies ApiSuccess<PaginatedData<T>>);
}

export function fail(
  c: Context,
  code: string,
  message: string,
  status: ContentfulStatusCode = 400,
  details?: unknown,
) {
  return c.json(
    { success: false, error: { code, message, details } } satisfies ApiError,
    status,
  );
}
