import { createAuthClient } from "better-auth/react";
import { apiBase } from "~/lib/config";

export const authClient = createAuthClient({
  baseURL: `${apiBase}/api/auth`,
}) as ReturnType<typeof createAuthClient>;

export function signInWithGoogle() {
  const origin = window.location.origin;
  return authClient.signIn.social({
    provider: "google",
    callbackURL: `${origin}/dashboard`,
    errorCallbackURL: `${origin}/`,
  });
}

export function signOut() {
  return authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = "/";
      },
    },
  });
}
