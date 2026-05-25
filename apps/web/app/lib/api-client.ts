import type { AppType } from "@aecfolio/api";
import { hc } from "hono/client";
import { apiBase } from "./config";

export const apiClient = hc<AppType>(apiBase);
