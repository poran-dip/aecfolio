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

export async function getSession(
  request: Request,
): Promise<SessionData | null> {
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
