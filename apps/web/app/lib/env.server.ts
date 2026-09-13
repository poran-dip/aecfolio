import { webEnv } from "@aecfolio/config";
import type { PublicEnv } from "./config";

void webEnv.PUBLIC_API_URL;

export const serverEnv = webEnv;

export function getPublicEnv(): PublicEnv {
  return {
    API_URL: webEnv.PUBLIC_API_URL,
  };
}
