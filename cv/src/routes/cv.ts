import { Hono } from "hono";
import JSZip from "jszip";
import { generateCV } from "@/lib/generator";
import { queue } from "@/lib/queue";
import type { BulkPayload, Payload } from "@/types";

const cv = new Hono();

const MAX_BODY_SIZE = 100 * 1024 * 1024;

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

cv.post("/bulk", async (c) => {
  let body: BulkPayload;
  try {
    body = await c.req.json<BulkPayload>();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (!Array.isArray(body.entries) || body.entries.length === 0) {
    return c.json({ error: "Missing or empty entries" }, 400);
  }

  let pdfs: { name: string; buffer: Buffer }[];
  try {
    pdfs = await Promise.all(
      body.entries.map((entry) =>
        queue.add(async () => ({
          name: entry.name,
          buffer: await generateCV(entry.html),
        }))
      )
    ) as { name: string; buffer: Buffer }[];
  } catch (err) {
    console.error("[cv/bulk] PDF generation failed:", err);
    return c.json({ error: "Failed to generate PDFs" }, 500);
  }

  const zip = new JSZip();
  for (const { name, buffer } of pdfs) {
    zip.file(`${name}_resume.pdf`, buffer);
  }
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new Response(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="resumes.zip"`,
    },
  });
});

export default cv;
