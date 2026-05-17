import "dotenv/config";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { closeBrowser, getBrowser } from "./lib/puppeteer";
import cv from "./routes/cv";

const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT) || 3001;

const app = new Hono();

app.use("/fonts/*", serveStatic({ root: "./public" }));

app.get("/", (c) => c.text("CV worker running"));

app.get("/health", async (c) => {
  await getBrowser();
  return c.json({ status: "ok" });
});

app.route("/cv", cv);

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
