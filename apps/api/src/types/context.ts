import type { Actor } from "../lib/session";

export type AppEnv = {
  Variables: {
    user: Actor | null;
    sessionId: string | null;
  };
};
