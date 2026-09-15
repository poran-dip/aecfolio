import type { CvSectionsConfig, CvTemplateOptions } from "@aecfolio/shared";
import { attachmentHeader, cvFileName, uniqueFileName } from "@aecfolio/shared";
import type { CvData } from "@aecfolio/ui";
import { getTemplate } from "@aecfolio/ui";
import { Hono } from "hono";
import JSZip from "jszip";
import { generateCV } from "../lib/generator";
import { queue } from "../lib/queue";

const MAX_BODY_SIZE = 100 * 1024 * 1024;

type CvRequest = {
  template: string;
  data: CvData;
  sections?: CvSectionsConfig;
  options?: CvTemplateOptions;
};

const cv = new Hono()
  .post("/", async (c) => {
    const contentLength = c.req.header("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE)
      return c.json({ error: "Payload too large" }, 413);

    let body: CvRequest;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    const template = getTemplate(body.template);
    if (!template) return c.json({ error: "Unknown template" }, 400);

    let pdf: Buffer | undefined;
    try {
      pdf = await queue.add(() =>
        generateCV(
          template.render({
            data: body.data,
            sections: body.sections,
            options: body.options,
          }),
        ),
      );
    } catch (err) {
      console.error("[cv] PDF generation failed:", err);
      return c.json({ error: "Failed to generate PDF" }, 500);
    }

    if (!pdf) return c.json({ error: "Failed to generate PDF" }, 500);

    const file = cvFileName({
      rollNo: body.data.student.rollNo,
      name: body.data.user.name,
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": attachmentHeader(file),
      },
    });
  })

  .post("/bulk", async (c) => {
    let body: { template: string; students: Omit<CvRequest, "template">[] };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    if (!Array.isArray(body.students) || body.students.length === 0)
      return c.json({ error: "Missing or empty students" }, 400);

    const template = getTemplate(body.template);
    if (!template) return c.json({ error: "Unknown template" }, 400);

    let pdfs: { name: string; buffer: Buffer }[];
    try {
      pdfs = (await Promise.all(
        body.students.map((student) =>
          queue.add(async () => ({
            name: cvFileName({
              rollNo: student.data.student.rollNo,
              name: student.data.user.name,
            }),
            buffer: await generateCV(
              template.render({
                data: student.data,
                sections: student.sections,
                options: student.options,
              }),
            ),
          })),
        ),
      )) as { name: string; buffer: Buffer }[];
    } catch (err) {
      console.error("[cv/bulk] PDF generation failed:", err);
      return c.json({ error: "Failed to generate PDFs" }, 500);
    }

    const zip = new JSZip();
    const taken = new Set<string>();
    for (const { name, buffer } of pdfs) {
      zip.file(uniqueFileName(taken, name), buffer);
    }
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": attachmentHeader("resumes.zip"),
      },
    });
  });

export default cv;
