import { Hono } from "hono";
import { generateCV } from "@/lib/generator";
import { queue } from "@/lib/queue";
import type { Payload } from "@/types";

const cv = new Hono();

cv.post("/", async (c) => {
  const body = await c.req.json<Payload>();

  if (!body.html) {
    return c.json({ error: "Missing html" }, 400);
  }

  const pdf = await queue.add(() => generateCV(body.html));

  if (!pdf) {
    return c.json({ error: "Failed to generate PDF" }, 500);
  }

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="resume.pdf"',
    },
  });
});

export default cv;
