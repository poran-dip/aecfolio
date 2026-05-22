import { Hono } from "hono";
import { db } from "../lib/db";
import { ok } from "../lib/response";
import { requireRole } from "../middleware/role";
import type { AppEnv } from "../types/context";

const users = new Hono<AppEnv>().get("/", requireRole("FACULTY"), async (c) => {
  const result = await db.query.usersTable.findMany({
    where: (u, { isNull }) => isNull(u.deletedAt),
    with: { student: true, faculty: true },
  });
  return ok(c, result);
});

export default users;
