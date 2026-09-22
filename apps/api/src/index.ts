import "dotenv/config";
import { apiEnv } from "@aecfolio/config";
import { serve } from "@hono/node-server";
import app from "./app";
import { startJobRunner } from "./lib/cv/jobs";
import { startSessionCleanup } from "./lib/session-cleanup";
import { ensureBucketCors } from "./lib/storage";

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

ensureBucketCors([apiEnv.CORS_ORIGIN]).catch((err) => {
  console.error("Could not apply the storage bucket's CORS rules:", err);
});

startJobRunner();
startSessionCleanup();

export type AppType = typeof app;
