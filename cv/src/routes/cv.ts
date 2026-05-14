import { Hono } from "hono";
import { generateCV } from "@/lib/generator";
import { queue } from "@/lib/queue";
import type { Payload } from "@/types";

const cv = new Hono();

const MAX_BODY_SIZE = 2 * 1024 * 1024;

cv.post("/", async (c) => {
  const contentLength = c.req.header("content-length");
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return c.json({ error: "Payload too large" }, 413);
  }

  let body: Payload;
  try {
    body = await c.req.json<Payload>();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (!body.html) {
    return c.json({ error: "Missing html" }, 400);
  }

  let pdf: Buffer | undefined;
  try {
    pdf = await queue.add(() => generateCV(body.html));
  } catch (err) {
    console.error("[cv] PDF generation failed:", err);
    return c.json({ error: "Failed to generate PDF" }, 500);
  }

  if (!pdf) {
    return c.json({ error: "Failed to generate PDF" }, 500);
  }

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="resume.pdf"`,
    },
  });
});

export default cv;
