import type { AppType } from "@aecfolio/api";
import { hc } from "hono/client";

const API_URL = process.env.API_URL ?? "http://localhost:3002/api";

export const apiClient = hc<AppType>(API_URL);
