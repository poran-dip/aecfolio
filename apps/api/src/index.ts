import "dotenv/config";
import { serve } from "@hono/node-server";
import app from "./app";

serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT ?? 3002),
  },
  (info) => {
    console.log(`API running on http://localhost:${info.port}`);
  },
);
