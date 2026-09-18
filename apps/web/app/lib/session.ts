import type { User } from "@aecfolio/shared";
import { apiBase } from "./config";

export type SessionData = {
  user: User;
  session: {
    id: string;
    expiresAt: string;
    token: string;
  };
};

const inFlight = new WeakMap<Request, Promise<SessionData | null>>();

export function getSession(request: Request): Promise<SessionData | null> {
  const cached = inFlight.get(request);
  if (cached) return cached;

  const pending = resolveSession(request);
  inFlight.set(request, pending);
  return pending;
}

async function resolveSession(request: Request): Promise<SessionData | null> {
  const cookie = request.headers.get("cookie") ?? "";

  try {
    const res = await fetch(`${apiBase}/api/auth/get-session`, {
      headers: { cookie },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.user) return null;
    return data as SessionData;
  } catch {
    return null;
  }
}
