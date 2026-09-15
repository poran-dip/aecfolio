import { describe, expect, it } from "vitest";
import { auth } from "./auth";

describe("auth configuration", () => {
  const options = auth.options;

  it("has no email/password sign-up at all", () => {
    expect(options).not.toHaveProperty("emailAndPassword");
  });

  it("offers Google as the only sign-in method", () => {
    expect(Object.keys(options.socialProviders ?? {})).toEqual(["google"]);
  });

  it("rejects a sign-in that would have to create a user", () => {
    const validate = options.user?.validateUserInfo;
    expect(validate).toBeTypeOf("function");

    const result = validate?.({
      user: { email: "stranger@example.com", name: "Stranger" },
      source: {
        action: "create-user",
        method: "oauth",
        oauth: { providerId: "google" },
      },
    });

    expect(result).toMatchObject({ error: "account_not_provisioned" });
  });

  it("allows a sign-in that resolves to an existing row", () => {
    const validate = options.user?.validateUserInfo;

    for (const action of ["sign-in", "link-account"] as const) {
      const result = validate?.({
        user: { email: "student@aec.ac.in", name: "Student" },
        source: { action, method: "oauth", oauth: { providerId: "google" } },
      });
      expect(result).toBeUndefined();
    }
  });

  it("trusts Google to link into a pre-created row, and only at the same address", () => {
    expect(options.account?.accountLinking?.enabled).toBe(true);
    expect(options.account?.accountLinking?.trustedProviders).toContain(
      "google",
    );
    expect(options.account?.accountLinking?.allowDifferentEmails).toBe(false);
  });

  it("never copies the Google profile over a user row, so users.image stays an uploaded object key", () => {
    expect(options.socialProviders?.google).not.toHaveProperty(
      "overrideUserInfoOnSignIn",
      true,
    );
    expect(options.account?.accountLinking).not.toHaveProperty(
      "updateUserInfoOnLink",
      true,
    );
  });
});
