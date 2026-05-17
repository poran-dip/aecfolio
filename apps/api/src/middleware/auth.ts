import type { MiddlewareHandler } from "hono";
import { auth } from "../lib/auth";
import type { AppEnv } from "../types/context";

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.set("user", null);
  c.set("session", null);

  if (c.req.path.startsWith("/api/auth")) return next();

  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (session) {
    c.set("user", session.user);
    c.set("session", session.session);
  }

  await next();
};
