import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

const DB_URL = "postgresql://postgres:password@localhost:15432/aecfolio";
const SECRET = "a".repeat(32);

describe("dbEnv", () => {
  it("reads DATABASE_URL", async () => {
    vi.stubEnv("DATABASE_URL", DB_URL);
    const { dbEnv } = await import("./index");
    expect(dbEnv.DATABASE_URL).toBe(DB_URL);
  });

  it("does not require variables from other scopes", async () => {
    vi.stubEnv("DATABASE_URL", DB_URL);
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.stubEnv("CORS_ORIGIN", "");
    const { dbEnv } = await import("./index");
    expect(() => dbEnv.DATABASE_URL).not.toThrow();
  });

  it("throws naming the missing variable", async () => {
    const { dbEnv } = await import("./index");
    expect(() => dbEnv.DATABASE_URL).toThrow(/DATABASE_URL/);
  });

  it("explains an absent variable rather than reporting a type error", async () => {
    const { dbEnv } = await import("./index");
    expect(() => dbEnv.DATABASE_URL).toThrow(/required/);
    expect(() => dbEnv.DATABASE_URL).not.toThrow(/received undefined/);
  });
});

describe("laziness", () => {
  it("importing the module never throws, even with an empty environment", async () => {
    await expect(import("./index")).resolves.toBeDefined();
  });
});

describe("apiEnv", () => {
  beforeEach(() => {
    vi.stubEnv("WORKER_SECRET", SECRET);
  });

  it("requires the worker's shared secret", async () => {
    vi.stubEnv("CORS_ORIGIN", "http://localhost:3000");
    vi.stubEnv("WORKER_SECRET", undefined);
    const { apiEnv } = await import("./index");
    expect(() => apiEnv.API_PORT).toThrow(/WORKER_SECRET/);
  });

  it("applies defaults for ports and NODE_ENV", async () => {
    vi.stubEnv("CORS_ORIGIN", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", undefined);
    const { apiEnv } = await import("./index");
    expect(apiEnv.API_PORT).toBe(3002);
    expect(apiEnv.NODE_ENV).toBe("development");
    expect(apiEnv.WORKER_URL).toBe("http://localhost:3001");
  });

  it("strips a trailing slash from an origin", async () => {
    vi.stubEnv("CORS_ORIGIN", "http://localhost:3000/");
    const { apiEnv } = await import("./index");
    expect(apiEnv.CORS_ORIGIN).toBe("http://localhost:3000");
  });

  it("coerces a port from a string", async () => {
    vi.stubEnv("CORS_ORIGIN", "http://localhost:3000");
    vi.stubEnv("API_PORT", "4000");
    const { apiEnv } = await import("./index");
    expect(apiEnv.API_PORT).toBe(4000);
  });

  it("requires CORS_ORIGIN rather than silently defaulting", async () => {
    const { apiEnv } = await import("./index");
    expect(() => apiEnv.CORS_ORIGIN).toThrow(/CORS_ORIGIN/);
  });

  it("rejects a CORS_ORIGIN that is not an absolute URL", async () => {
    vi.stubEnv("CORS_ORIGIN", "localhost:3000");
    const { apiEnv } = await import("./index");
    expect(() => apiEnv.CORS_ORIGIN).toThrow(/CORS_ORIGIN/);
  });
});

describe("authEnv", () => {
  it("reports every problem in the scope at once", async () => {
    vi.stubEnv("BETTER_AUTH_URL", "not-a-url");
    vi.stubEnv("BETTER_AUTH_SECRET", "too-short");
    const { authEnv } = await import("./index");
    let message = "";
    try {
      void authEnv.BETTER_AUTH_URL;
    } catch (err) {
      message = err instanceof Error ? err.message : "";
    }
    expect(message).toContain("BETTER_AUTH_URL");
    expect(message).toContain("BETTER_AUTH_SECRET");
    expect(message).toContain("GOOGLE_CLIENT_ID");
    expect(message).toContain("GOOGLE_CLIENT_SECRET");
  });

  it("accepts a valid auth scope", async () => {
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3002");
    vi.stubEnv("BETTER_AUTH_SECRET", SECRET);
    vi.stubEnv("GOOGLE_CLIENT_ID", "client-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "client-secret");
    const { authEnv } = await import("./index");
    expect(authEnv.BETTER_AUTH_URL).toBe("http://localhost:3002");
    expect(authEnv.GOOGLE_CLIENT_ID).toBe("client-id");
  });
});

describe("s3Env", () => {
  const valid = {
    S3_ENDPOINT: "http://localhost:3900",
    S3_PUBLIC_ENDPOINT: "http://localhost:3900/",
    S3_BUCKET: "storage",
    S3_ACCESS_KEY_ID: `GK${"a1".repeat(12)}`,
    S3_SECRET_ACCESS_KEY: "f".repeat(64),
  };

  const stub = (env: Record<string, string>) => {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  };

  it("accepts a valid scope and defaults the region", async () => {
    stub(valid);
    const { s3Env } = await import("./index");
    expect(s3Env.S3_PUBLIC_ENDPOINT).toBe("http://localhost:3900");
    expect(s3Env.S3_REGION).toBe("garage");
  });

  it("is not required by the api scope", async () => {
    vi.stubEnv("CORS_ORIGIN", "http://localhost:3000");
    vi.stubEnv("WORKER_SECRET", SECRET);
    const { apiEnv } = await import("./index");
    expect(() => apiEnv.CORS_ORIGIN).not.toThrow();
  });

  it("rejects an access key Garage would refuse", async () => {
    stub({ ...valid, S3_ACCESS_KEY_ID: "minioadmin" });
    const { s3Env } = await import("./index");
    expect(() => s3Env.S3_ACCESS_KEY_ID).toThrow(/S3_ACCESS_KEY_ID/);
  });

  it("rejects a secret that is not 64 hex chars", async () => {
    stub({ ...valid, S3_SECRET_ACCESS_KEY: "password" });
    const { s3Env } = await import("./index");
    expect(() => s3Env.S3_BUCKET).toThrow(/S3_SECRET_ACCESS_KEY/);
  });

  it("rejects a public endpoint with a path", async () => {
    stub({ ...valid, S3_PUBLIC_ENDPOINT: "http://localhost/api" });
    const { s3Env } = await import("./index");
    expect(() => s3Env.S3_BUCKET).toThrow(/S3_PUBLIC_ENDPOINT/);
  });
});

describe("workerEnv", () => {
  it("treats PUPPETEER_EXECUTABLE_PATH as optional", async () => {
    vi.stubEnv("WORKER_SECRET", SECRET);
    const { workerEnv } = await import("./index");
    expect(workerEnv.PUPPETEER_EXECUTABLE_PATH).toBeUndefined();
    expect(workerEnv.WORKER_PORT).toBe(3001);
    expect(workerEnv.WORKER_PAGES).toBe(2);
  });

  it("refuses to start without a shared secret", async () => {
    const { workerEnv } = await import("./index");
    expect(() => workerEnv.WORKER_PORT).toThrow(/WORKER_SECRET/);
  });

  it("refuses a short shared secret", async () => {
    vi.stubEnv("WORKER_SECRET", "hunter2");
    const { workerEnv } = await import("./index");
    expect(() => workerEnv.WORKER_PORT).toThrow(/WORKER_SECRET/);
  });
});

describe("webEnv", () => {
  it("requires PUBLIC_API_URL", async () => {
    const { webEnv } = await import("./index");
    expect(() => webEnv.PUBLIC_API_URL).toThrow(/PUBLIC_API_URL/);
  });

  it("rejects a PUBLIC_API_URL with a trailing /api", async () => {
    vi.stubEnv("PUBLIC_API_URL", "http://localhost/api");
    const { webEnv } = await import("./index");
    expect(() => webEnv.PUBLIC_API_URL).toThrow(/PUBLIC_API_URL/);
  });

  it("defaults INTERNAL_API_URL for the non-Docker dev loop", async () => {
    vi.stubEnv("PUBLIC_API_URL", "http://localhost:3002");
    const { webEnv } = await import("./index");
    expect(webEnv.INTERNAL_API_URL).toBe("http://localhost:3002");
  });
});
