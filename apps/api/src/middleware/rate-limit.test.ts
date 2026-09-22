import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { buildIpRateLimit } from "./rate-limit";

function appWith(...middlewares: ReturnType<typeof buildIpRateLimit>[]) {
  const app = new Hono();
  for (const [i, mw] of middlewares.entries()) {
    app.get(`/route-${i}`, mw, (c) => c.text("ok"));
  }
  return app;
}

function get(app: Hono, path: string, ip = "203.0.113.1") {
  return app.request(path, { headers: { "X-Real-IP": ip } });
}

describe("buildIpRateLimit", () => {
  it("allows requests up to the limit, then rejects the rest", async () => {
    const app = appWith(buildIpRateLimit({ limit: 2, windowMs: 10_000 }));

    expect((await get(app, "/route-0")).status).toBe(200);
    expect((await get(app, "/route-0")).status).toBe(200);
    expect((await get(app, "/route-0")).status).toBe(429);
  });

  it("resets the budget once the window has passed", async () => {
    const app = appWith(buildIpRateLimit({ limit: 1, windowMs: 50 }));

    expect((await get(app, "/route-0")).status).toBe(200);
    expect((await get(app, "/route-0")).status).toBe(429);

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect((await get(app, "/route-0")).status).toBe(200);
  });

  it("tracks separate IPs independently", async () => {
    const app = appWith(buildIpRateLimit({ limit: 1, windowMs: 10_000 }));

    expect((await get(app, "/route-0", "203.0.113.1")).status).toBe(200);
    expect((await get(app, "/route-0", "203.0.113.2")).status).toBe(200);
    expect((await get(app, "/route-0", "203.0.113.1")).status).toBe(429);
  });

  it("carries a Retry-After header on the 429", async () => {
    const app = appWith(buildIpRateLimit({ limit: 1, windowMs: 10_000 }));

    await get(app, "/route-0");
    const blocked = await get(app, "/route-0");

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).not.toBeNull();
  });

  it("returns the standard fail() error shape on the 429", async () => {
    const app = appWith(buildIpRateLimit({ limit: 1, windowMs: 10_000 }));

    await get(app, "/route-0");
    const blocked = await get(app, "/route-0");

    await expect(blocked.json()).resolves.toEqual({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Try again shortly.",
        details: null,
      },
    });
  });

  it("shares one budget across every route the same middleware value is mounted on", async () => {
    const shared = buildIpRateLimit({ limit: 1, windowMs: 10_000 });
    const app = appWith(shared, shared);

    expect((await get(app, "/route-0")).status).toBe(200);
    expect((await get(app, "/route-1")).status).toBe(429);
  });

  it("gives independent budgets to separately-constructed middleware", async () => {
    const app = appWith(
      buildIpRateLimit({ limit: 1, windowMs: 10_000 }),
      buildIpRateLimit({ limit: 1, windowMs: 10_000 }),
    );

    expect((await get(app, "/route-0")).status).toBe(200);
    expect((await get(app, "/route-1")).status).toBe(200);
  });

  it("never blocks when skip returns true", async () => {
    const app = appWith(
      buildIpRateLimit({ limit: 1, windowMs: 10_000, skip: () => true }),
    );

    for (let i = 0; i < 5; i++) {
      expect((await get(app, "/route-0")).status).toBe(200);
    }
  });
});
