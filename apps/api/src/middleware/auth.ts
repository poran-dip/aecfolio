import type { MiddlewareHandler } from "hono";
import type { SessionResolver } from "../lib/session";
import type { AppEnv } from "../types/context";

export function createAuthMiddleware(
  resolver: SessionResolver,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    c.set("user", null);
    c.set("sessionId", null);

    const path = c.req.path;
    if (path.startsWith("/api/auth") || path === "/api/health") return next();

    const resolved = await resolver(c.req.raw.headers);
    if (resolved) {
      c.set("user", resolved.user);
      c.set("sessionId", resolved.sessionId);
    }

    await next();
  };
}
