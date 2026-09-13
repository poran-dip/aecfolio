import { apiEnv } from "@aecfolio/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authMiddleware } from "./middleware/auth";
import api from "./routes";
import type { AppEnv } from "./types/context";

const app = new Hono<AppEnv>()
  .use("*", logger())

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

  .use("/api/*", authMiddleware)

  .route("/api", api)

  .get("/api/health", (c) => c.json({ ok: true }));

export default app;
