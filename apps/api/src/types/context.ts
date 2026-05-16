import type { SessionUser } from "../middleware/auth";

export type AppEnv = {
  Variables: {
    user: SessionUser;
  };
};
