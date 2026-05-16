import type { Role } from "@aecfolio/shared";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types/context";

export type SessionUser = {
  id: string;
  name: string;
  role: Role;
};

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const stubUser: SessionUser = {
    id: "stub-user-id",
    name: "Stub User",
    role: "FACULTY",
  };
  c.set("user", stubUser);
  await next();
};
