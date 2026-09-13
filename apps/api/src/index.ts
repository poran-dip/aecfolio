import "dotenv/config";
import { apiEnv } from "@aecfolio/config";
import { serve } from "@hono/node-server";
import app from "./app";

const isProd = apiEnv.NODE_ENV === "production";
const port = apiEnv.API_PORT;

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
