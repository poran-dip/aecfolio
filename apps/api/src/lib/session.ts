import { usersTable } from "@aecfolio/db";
import type { Role } from "@aecfolio/shared";

import { and, eq, isNull } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";

export type Actor = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type ResolvedSession = {
  user: Actor;
  sessionId: string;
} | null;

export type SessionResolver = (headers: Headers) => Promise<ResolvedSession>;

export const resolveSession: SessionResolver = async (headers) => {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;

  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      banned: usersTable.banned,
    })
    .from(usersTable)
    .where(
      and(eq(usersTable.id, session.user.id), isNull(usersTable.deletedAt)),
    )
    .limit(1);

  if (!user || user.banned) return null;

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    sessionId: session.session.id,
  };
};
