import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { type CvData, getTemplate } from "@aecfolio/ui";
import { makeCvData } from "@aecfolio/ui/fixtures";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app";
import { createPool } from "./lib/browser";
import { readPdf } from "./test/pdf";

const SECRET = process.env.WORKER_SECRET as string;
const pool = createPool({ size: 2, queueMax: 64 });
const app = createApp({ pool, secret: SECRET });

type RenderBody = {
  templateId?: string;
  data?: unknown;
  sections?: unknown;
  options?: unknown;
};

function render(
  body: RenderBody,
  secret: string | null = SECRET,
  target = app,
) {
  return target.request("/render", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: JSON.stringify({ templateId: "standard", ...body }),
  });
}

async function renderPdfOf(data: CvData, options?: Record<string, unknown>) {
  const res = await render({ data, options });
  expect(res.status, await res.clone().text()).toBe(200);
  return new Uint8Array(await res.arrayBuffer());
}

function longCv(): CvData {
  const base = makeCvData();
  const paragraph =
    "Designed and shipped the thing end to end, then measured it in production and wrote down what we learned so the next team would not repeat it.";
  return {
    ...base,
    projects: Array.from({ length: 24 }, (_, i) => ({
      ...base.projects[1],
      id: `long-${i}`,
      title: `Project number ${i + 1}`,
      description: `${paragraph}\n\n- ${paragraph}\n- ${paragraph}`,
    })),
  };
}

beforeAll(async () => {
  await pool.warm();
});

afterAll(async () => {
  await pool.close();
});

describe("authentication", () => {
  it("refuses a render with no secret", async () => {
    const res = await render({ data: makeCvData() }, null);
    expect(res.status).toBe(401);
  });

  it("refuses a render with the wrong secret", async () => {
    const res = await render({ data: makeCvData() }, `${SECRET}-nope`);
    expect(res.status).toBe(401);
  });

  it("guards /version too", async () => {
    expect((await app.request("/version")).status).toBe(401);
  });

  it("leaves /health open so compose can probe it, and it still warms the browser", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(pool.stats().created).toBeGreaterThan(0);
  });
});

describe("render requests", () => {
  it("renders the standard template to a PDF", async () => {
    const res = await render({ data: makeCvData() });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("x-render-version")).toMatch(/^[0-9a-f]{16}$/);

    const pdf = await readPdf(new Uint8Array(await res.arrayBuffer()));
    expect(pdf.text).toContain("Smart India Hackathon");
  });

  it("rejects an unknown template", async () => {
    const res = await render({ templateId: "nope", data: makeCvData() });
    expect(res.status).toBe(400);
  });

  it("rejects a body that is not a render request", async () => {
    const res = await render({ data: "hello" });
    expect(res.status).toBe(400);
  });
});

describe("fonts", () => {
  it("embeds Outfit in the PDF rather than falling back to a system face", async () => {
    const pdf = await readPdf(await renderPdfOf(makeCvData()));
    expect(pdf.embedsFont("Outfit")).toBe(true);
  });
});

describe("the verified mark in the PDF", () => {
  it("links a checkmark to the durable proof route, not a signed URL", async () => {
    const pdf = await readPdf(await renderPdfOf(makeCvData()));
    expect(pdf.links).toContain(
      "https://aecfolio.example/api/achievements/a1/proof",
    );
    expect(pdf.links).toContain(
      "https://aecfolio.example/api/certifications/c1/proof",
    );
    expect(pdf.links.some((url) => /X-Amz-/i.test(url))).toBe(false);
  });

  it("gives a verified claim with no proof a bare mark, never a dead link", async () => {
    const pdf = await readPdf(await renderPdfOf(makeCvData()));
    expect(
      pdf.links.every(
        (url) =>
          url.startsWith("http") ||
          url.startsWith("mailto:") ||
          url.startsWith("tel:"),
      ),
    ).toBe(true);
    expect(pdf.links.filter((url) => url.includes("/proof"))).toHaveLength(2);
  });
});

describe("no network from inside Chromium", () => {
  let server: Server;
  let hits: string[];
  let origin: string;

  beforeAll(async () => {
    hits = [];
    server = createServer((req, res) => {
      hits.push(req.url ?? "");
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end();
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("never fetches a remote image, even an internal one", async () => {
    const base = makeCvData();
    const data: CvData = {
      ...base,
      user: { ...base.user, image: `${origin}/avatar.png` },
    };

    const pdf = await renderPdfOf(data, { showPhoto: true });

    expect(pdf.byteLength).toBeGreaterThan(0);
    expect(hits).toEqual([]);
  });

  it("still prints an inlined image", async () => {
    const png =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
    const base = makeCvData();
    const data: CvData = {
      ...base,
      user: { ...base.user, image: `data:image/png;base64,${png}` },
    };
    const res = await render({ data, options: { showPhoto: true } });
    expect(res.status).toBe(200);
  });
});

describe("pagination", () => {
  it("starts the ink at the same offset on every page of a three-page CV", async () => {
    const pdf = await readPdf(await renderPdfOf(longCv()));

    expect(pdf.pages.length).toBeGreaterThanOrEqual(3);
    const [first, ...rest] = pdf.pages.map((page) => page.topInk);
    for (const top of rest) {
      expect(Math.abs(top - first)).toBeLessThan(8);
    }
    expect(first).toBeGreaterThan(20);
  });
});

describe("the page pool", () => {
  it("reuses its tabs instead of opening one per render", async () => {
    const before = pool.stats().created;
    await Promise.all(
      Array.from({ length: 8 }, () => renderPdfOf(makeCvData())),
    );
    expect(pool.stats().created - before).toBeLessThanOrEqual(2);
    expect(pool.stats().busy).toBe(0);
  });

  it("does not leak one render's content into the next", async () => {
    const base = makeCvData();
    await renderPdfOf({ ...base, user: { ...base.user, name: "Leaky Name" } });
    const pdf = await readPdf(await renderPdfOf(base));
    expect(pdf.text).not.toContain("Leaky Name");
  });

  it("answers 503 when the queue is full instead of piling up work", async () => {
    const tiny = createPool({ size: 1, queueMax: 1 });
    const tinyApp = createApp({ pool: tiny, secret: SECRET });
    try {
      const statuses = await Promise.all(
        Array.from({ length: 6 }, () =>
          Promise.resolve(render({ data: makeCvData() }, SECRET, tinyApp)).then(
            (r) => r.status,
          ),
        ),
      );
      expect(statuses).toContain(503);
      expect(statuses).toContain(200);
    } finally {
      await tiny.close();
    }
  });
});

describe("speed", () => {
  it("measures render time with the configured two tabs", async () => {
    const template = getTemplate("standard");
    expect(template).not.toBeNull();

    const count = 40;
    const started = performance.now();
    await Promise.all(
      Array.from({ length: count }, () => renderPdfOf(makeCvData())),
    );
    const perPdf = (performance.now() - started) / count;

    console.log(
      `[speed] ${count} PDFs, ${perPdf.toFixed(0)}ms each on average, ~${((perPdf * 500) / 1000).toFixed(0)}s for 500`,
    );
    expect(perPdf).toBeLessThan(1000);
  });
});
