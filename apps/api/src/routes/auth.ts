import { Hono } from "hono";
import { auth } from "../lib/auth";
import type { AppEnv } from "../types/context";

const authRouter = new Hono<AppEnv>();

authRouter.on(["GET", "POST"], "/*", (c) => auth.handler(c.req.raw));

export default authRouter;
