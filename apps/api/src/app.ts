import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authMiddleware } from "./middleware/auth";
import api from "./routes";
import type { AppEnv } from "./types/context";

const app = new Hono<AppEnv>();

app.use("*", logger());
app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      const allowed = [
        process.env.CORS_ORIGIN ?? "http://localhost:5173",
        "http://localhost:5174",
      ];
      if (!origin) return null;
      return allowed.includes(origin) ? origin : null;
    },
    credentials: true,
  }),
);
app.use("/api/*", authMiddleware);

app.route("/api", api);
app.get("/health", (c) => c.json({ ok: true }));

export default app;
