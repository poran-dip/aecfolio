import { apiEnv } from "@aecfolio/config";
import type { Context, MiddlewareHandler } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import type { AppEnv } from "../types/context";

function clientIp(c: Context<AppEnv>): string {
  return (
    c.req.header("x-real-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export function buildIpRateLimit({
  limit,
  windowMs,
  skip,
}: {
  limit: number;
  windowMs: number;
  skip?: (c: Context<AppEnv>) => boolean;
}): MiddlewareHandler<AppEnv> {
  return rateLimiter<AppEnv>({
    windowMs,
    limit,
    keyGenerator: (c) => clientIp(c),
    skip: skip ?? (() => false),
    message: {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Try again shortly.",
        details: null,
      },
    },
  });
}

export function ipRateLimit(options: {
  limit: number;
  windowMs: number;
  skip?: (c: Context<AppEnv>) => boolean;
}): MiddlewareHandler<AppEnv> {
  return buildIpRateLimit({
    ...options,
    skip: (c) => apiEnv.NODE_ENV === "test" || (options.skip?.(c) ?? false),
  });
}
