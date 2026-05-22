import type { AppType } from "@aecfolio/worker";
import { hc } from "hono/client";

const WORKER_URL = process.env.WORKER_URL ?? "http://localhost:3001";

export const workerClient = hc<AppType>(WORKER_URL);
