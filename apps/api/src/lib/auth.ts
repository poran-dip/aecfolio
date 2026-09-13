import { apiEnv, authEnv } from "@aecfolio/config";
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

export const auth = betterAuth({
  baseURL: authEnv.BETTER_AUTH_URL,
  secret: authEnv.BETTER_AUTH_SECRET,
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
      clientId: authEnv.GOOGLE_CLIENT_ID,
      clientSecret: authEnv.GOOGLE_CLIENT_SECRET,
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
  trustedOrigins: [apiEnv.CORS_ORIGIN],
});
