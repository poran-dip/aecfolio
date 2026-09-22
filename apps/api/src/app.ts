import { apiEnv } from "@aecfolio/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { fail } from "./lib/response";
import { resolveSession, type SessionResolver } from "./lib/session";
import { createAuthMiddleware } from "./middleware/auth";
import api from "./routes";
import type { AppEnv } from "./types/context";

export type CreateAppOptions = {
  sessionResolver?: SessionResolver;
};

const SKIP_LOG = new Set(["/api/health", "/api/auth/get-session"]);

export function createApp(options: CreateAppOptions = {}) {
  const resolver = options.sessionResolver ?? resolveSession;

  return new Hono<AppEnv>()
    .use("*", async (c, next) => {
      if (apiEnv.NODE_ENV === "test" || SKIP_LOG.has(c.req.path)) return next();
      return logger()(c, next);
    })

    .use(
      "/api/*",
      cors({
        origin: (origin) => {
          const allowed = [apiEnv.CORS_ORIGIN];
          if (!origin) return null;
          return allowed.includes(origin) ? origin : null;
        },
        credentials: true,
      }),
    )

    .use("/api/*", createAuthMiddleware(resolver))

    .route("/api", api)

    .get("/api/health", (c) => c.json({ ok: true }))

    .onError((err, c) => {
      if (err instanceof HTTPException && err.status === 400)
        return fail(c, "BAD_REQUEST", "Invalid request", 400);

      console.error(err);
      return fail(c, "INTERNAL", "Internal server error", 500);
    });
}

const app = createApp();

export default app;
