import { createAuthClient } from "better-auth/react";
import { apiBase } from "~/lib/config";

export const authClient = createAuthClient({
  baseURL: `${apiBase}/api/auth`,
}) as ReturnType<typeof createAuthClient>;
