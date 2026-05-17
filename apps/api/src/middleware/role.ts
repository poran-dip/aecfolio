import type { MiddlewareHandler } from "hono";
import { fail } from "../lib/response";
import type { AppEnv } from "../types/context";

type Role = "STUDENT" | "FACULTY" | "PENDING" | "ADMIN";

export function requireRole(...roles: Role[]): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const user = c.get("user");
    if (!user) return fail(c, "UNAUTHENTICATED", "Unauthenticated", 401);
    if (!roles.includes(user.role as Role))
      return fail(c, "FORBIDDEN", "Forbidden", 403);
    await next();
  };
}
