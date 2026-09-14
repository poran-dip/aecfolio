import type { MiddlewareHandler } from "hono";
import { type Capability, hasCapability } from "../lib/capabilities";
import { fail } from "../lib/response";
import type { AppEnv } from "../types/context";

export function requireAuth(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (!c.get("user"))
      return fail(c, "UNAUTHENTICATED", "Unauthenticated", 401);
    await next();
  };
}

export function requireCapability(
  ...capabilities: Capability[]
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const user = c.get("user");
    if (!user) return fail(c, "UNAUTHENTICATED", "Unauthenticated", 401);

    const permitted = capabilities.some((capability) =>
      hasCapability(user.role, capability),
    );
    if (!permitted) return fail(c, "FORBIDDEN", "Forbidden", 403);

    await next();
  };
}
