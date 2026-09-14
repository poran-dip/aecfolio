import { apiEnv, authEnv } from "@aecfolio/config";
import {
  accountsTable,
  sessionsTable,
  usersTable,
  verificationsTable,
} from "@aecfolio/db";
import { Role } from "@aecfolio/shared";
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
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      allowDifferentEmails: false,
    },
  },
  user: {
    validateUserInfo: ({ source }) => {
      if (source.action === "create-user")
        return {
          error: "account_not_provisioned",
          errorDescription:
            "This account has not been added to AECFolio. Ask an administrator to add you first.",
        };
    },
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
  plugins: [
    admin({
      defaultRole: Role.STUDENT,
      adminRoles: [Role.ADMIN],
    }),
  ],
  trustedOrigins: [apiEnv.CORS_ORIGIN],
});
