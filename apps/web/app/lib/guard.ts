import {
  type Capability,
  hasCapability,
  isStaffRole,
  Role,
  type User,
} from "@aecfolio/shared";
import { redirect } from "react-router";
import { homeFor } from "./nav";
import { getSession, type SessionData } from "./session";

export async function requireSession(request: Request): Promise<SessionData> {
  const session = await getSession(request);
  if (!session) throw redirect("/");
  return session;
}

export function can(user: User, capability: Capability): boolean {
  return hasCapability(user.role, capability);
}

export async function requireCapability(
  request: Request,
  capability: Capability,
): Promise<SessionData> {
  const session = await requireSession(request);
  if (!can(session.user, capability))
    throw redirect(homeFor(session.user.role));
  return session;
}

export async function requireStaff(request: Request): Promise<SessionData> {
  const session = await requireSession(request);
  if (!isStaffRole(session.user.role))
    throw redirect(homeFor(session.user.role));
  return session;
}

export async function requireStudent(request: Request): Promise<SessionData> {
  const session = await requireSession(request);
  if (session.user.role !== Role.STUDENT) {
    throw redirect(homeFor(session.user.role));
  }
  return session;
}
