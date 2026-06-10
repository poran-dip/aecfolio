import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("env config", () => {
  it("returns env vars when they are set", async () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://user:password@localhost:5432/dbname",
    );
    vi.stubEnv(
      "DIRECT_URL",
      "postgresql://user:password@localhost:5432/dbname",
    );
    vi.stubEnv("S3_ENDPOINT", "https://s3.amazonaws.com");
    vi.stubEnv("S3_REGION", "us-east-1");
    vi.stubEnv("S3_ACCESS_KEY", "test-access-key");
    vi.stubEnv("S3_SECRET_KEY", "test-secret-key");
    vi.stubEnv("S3_BUCKET", "resumes");
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3002");
    vi.stubEnv("BETTER_AUTH_SECRET", "test-secret");
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-client-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-client-secret");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("PUPPETEER_EXECUTABLE_PATH", "/usr/bin/chromium-browser");
    vi.stubEnv("WORKER_URL", "http://localhost:3001");
    vi.stubEnv("API_PORT", "3002");
    vi.stubEnv("WORKER_PORT", "3001");
    vi.stubEnv("VITE_API_URL", "http://localhost/api");

    const { env } = await import("./index");

    expect(env.DATABASE_URL).toBe(
      "postgresql://user:password@localhost:5432/dbname",
    );
  });

  it("throws when a required env var is missing", async () => {
    await expect(() => import("./index")).rejects.toThrow(
      "Missing env variable: DATABASE_URL",
    );
  });
});
