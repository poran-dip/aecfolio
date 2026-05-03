import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { closeBrowser } from "@/lib/puppeteer";
import cv from "@/routes/cv";

const isProd = process.env.NODE_ENV === "production";

const app = new Hono();

app.get("/", (c) => c.text("CV service running"));
app.route("/cv", cv);

const server = serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    console.log(
      `CV service is running on ${isProd ? `port ${info.port}` : `http://localhost:${info.port}`}`,
    );
  },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await closeBrowser();
    server.close();
    process.exit(0);
  });
}
