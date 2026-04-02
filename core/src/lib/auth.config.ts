import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// This config is edge-compatible (no Prisma, no Node.js APIs)
// Used only in middleware — the full auth.ts (with Prisma adapter) is used server-side
export const authConfig = {
  providers: [Google],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized() {
      // Route protection is handled manually in middleware
      return true;
    },
  },
} satisfies NextAuthConfig;
