import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { closeBrowser, getBrowser } from "./lib/puppeteer";
import cv from "./routes/cv";

const __dirname = dirname(fileURLToPath(import.meta.url));

const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.WORKER_PORT) || 3001;

const app = new Hono()
  .use("/fonts/*", serveStatic({ root: join(__dirname, "../public") }))

  .get("/", (c) => c.text("CV worker running"))

  .get("/health", async (c) => {
    await getBrowser();
    return c.json({ status: "ok" });
  })

  .route("/cv", cv);

export type AppType = typeof app;

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(
    `Worker running on ${isProd ? `port ${info.port}` : `http://localhost:${info.port}`}`,
  );
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await closeBrowser();
    server.close();
    process.exit(0);
  });
}
