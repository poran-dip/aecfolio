import "dotenv/config";
import { workerEnv } from "@aecfolio/config";
import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { createPool } from "./lib/browser";

const isProd = workerEnv.NODE_ENV === "production";
const port = workerEnv.WORKER_PORT;

const pool = createPool();
const app = createApp({ pool });

pool.warm().catch((err) => {
  console.error("[worker] could not start Chromium:", err);
});

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(
    `Worker running on ${isProd ? `port ${info.port}` : `http://localhost:${info.port}`} with ${workerEnv.WORKER_PAGES} pages`,
  );
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    server.close();
    await pool.close();
    process.exit(0);
  });
}

export type { AppType } from "./app";
