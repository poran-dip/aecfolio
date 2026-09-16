import { createHash, timingSafeEqual } from "node:crypto";
import type { MiddlewareHandler } from "hono";

const digest = (value: string) => createHash("sha256").update(value).digest();

export function requireSecret(secret: string): MiddlewareHandler {
  const expected = digest(`Bearer ${secret}`);
  return async (c, next) => {
    const given = digest(c.req.header("authorization") ?? "");
    if (!timingSafeEqual(given, expected))
      return c.json({ error: "Unauthorized" }, 401);
    await next();
  };
}
