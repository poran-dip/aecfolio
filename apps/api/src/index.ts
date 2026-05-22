import "dotenv/config";
import { serve } from "@hono/node-server";
import app from "./app";

const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.API_PORT) || 3002;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(
      `API service running on ${isProd ? `port ${info.port}` : `http://localhost:${info.port}`}`,
    );
  },
);

export type AppType = typeof app;
