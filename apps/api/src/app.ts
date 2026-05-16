import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authMiddleware } from "./middleware/auth";
import api from "./routes/index";
import type { AppEnv } from "./types/context";

const app = new Hono<AppEnv>();

app.use("*", logger());
app.use(
  "*",
  cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }),
);
app.use("*", authMiddleware);

app.route("/api", api);

app.get("/health", (c) => c.json({ ok: true }));

export default app;
