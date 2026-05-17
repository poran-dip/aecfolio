import {
  accountsTable,
  sessionsTable,
  usersTable,
  verificationsTable,
} from "@aecfolio/db";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { db } from "./db";

const baseURL = process.env.BETTER_AUTH_URL;
if (!baseURL) throw new Error("BETTER_AUTH_URL missing");

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!googleClientId || !googleClientSecret)
  throw new Error("Google OAuth credentials missing");

const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
if (!betterAuthSecret) throw new Error("Better Auth secret missing");

export const auth = betterAuth({
  baseURL,
  secret: betterAuthSecret,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: usersTable,
      session: sessionsTable,
      account: accountsTable,
      verification: verificationsTable,
    },
  }),
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  },
  plugins: [
    admin({
      defaultRole: "PENDING",
    }),
  ],
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
        defaultValue: null,
        input: false,
      },
      deletedAt: {
        type: "date",
        required: false,
        defaultValue: null,
        input: false,
      },
    },
  },
  trustedOrigins: [
    process.env.CORS_ORIGIN ?? "http://localhost:5173",
    "http://localhost:5174",
  ],
});
