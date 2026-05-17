import type { CVData, CVTemplateName } from "@aecfolio/ui";
import { templates } from "@aecfolio/ui";
import { Hono } from "hono";
import JSZip from "jszip";
import { generateCV } from "../lib/generator";
import { queue } from "../lib/queue";

const cv = new Hono();

const MAX_BODY_SIZE = 100 * 1024 * 1024;

cv.post("/", async (c) => {
  const contentLength = c.req.header("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE)
    return c.json({ error: "Payload too large" }, 413);

  let body: { template: CVTemplateName; data: CVData };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const Template = templates[body.template];
  if (!Template) return c.json({ error: "Unknown template" }, 400);

  let pdf: Buffer | undefined;
  try {
    pdf = await queue.add(() => generateCV(<Template data={body.data} />));
  } catch (err) {
    console.error("[cv] PDF generation failed:", err);
    return c.json({ error: "Failed to generate PDF" }, 500);
  }

  if (!pdf) return c.json({ error: "Failed to generate PDF" }, 500);

  const name = body.data.user.name ?? "resume";
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}_resume.pdf"`,
    },
  });
});

cv.post("/bulk", async (c) => {
  let body: { template: CVTemplateName; students: CVData[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (!Array.isArray(body.students) || body.students.length === 0)
    return c.json({ error: "Missing or empty students" }, 400);

  const Template = templates[body.template];
  if (!Template) return c.json({ error: "Unknown template" }, 400);

  let pdfs: { name: string; buffer: Buffer }[];
  try {
    pdfs = (await Promise.all(
      body.students.map((data) =>
        queue.add(async () => ({
          name: data.user.name ?? "resume",
          buffer: await generateCV(<Template data={data} />),
        })),
      ),
    )) as { name: string; buffer: Buffer }[];
  } catch (err) {
    console.error("[cv/bulk] PDF generation failed:", err);
    return c.json({ error: "Failed to generate PDFs" }, 500);
  }

  const zip = new JSZip();
  for (const { name, buffer } of pdfs) {
    zip.file(`${name}_resume.pdf`, buffer);
  }
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="resumes.zip"`,
    },
  });
});

export default cv;
