import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../lib/db";
import { fail, getUser, ok } from "../lib/response";
import { requireRole } from "../middleware/role";
import type { AppEnv } from "../types/context";

const CV_SERVICE_URL = process.env.CV_SERVICE_URL ?? "http://localhost:3001/cv";

const cv = new Hono<AppEnv>();

cv.get("/me", requireRole("STUDENT"), async (c) => {
  const user = getUser(c);

  const student = await db.query.studentsTable.findFirst({
    where: (s, { eq }) => eq(s.userId, user.id),
    with: {
      user: true,
      experiences: { where: (e, { isNull }) => isNull(e.deletedAt) },
      projects: { where: (p, { isNull }) => isNull(p.deletedAt) },
      achievements: { where: (a, { isNull }) => isNull(a.deletedAt) },
      certifications: { where: (cert, { isNull }) => isNull(cert.deletedAt) },
      socials: true,
      results: true,
    },
  });

  if (!student) return fail(c, "NOT_FOUND", "Student profile not found", 404);
  return ok(c, student);
});

const generateSchema = z.object({
  template: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
});

cv.post(
  "/generate",
  requireRole("STUDENT"),
  zValidator("json", generateSchema),
  async (c) => {
    const user = getUser(c);
    const { template, data } = c.req.valid("json");

    const pdfRes = await fetch(CV_SERVICE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template, data }),
    });

    if (!pdfRes.ok) return fail(c, "CV_ERROR", "Failed to generate PDF", 500);

    const buffer = await pdfRes.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${user.name}_resume.pdf"`,
      },
    });
  },
);

const bulkSchema = z.object({
  template: z.string().min(1),
  ids: z.array(z.string()).min(1),
});

cv.post(
  "/generate/bulk",
  requireRole("FACULTY"),
  zValidator("json", bulkSchema),
  async (c) => {
    const { template, ids } = c.req.valid("json");

    const students = await db.query.studentsTable.findMany({
      where: (s, { and, inArray, isNull }) =>
        and(inArray(s.id, ids), isNull(s.deletedAt)),
      with: {
        user: true,
        experiences: { where: (e, { isNull }) => isNull(e.deletedAt) },
        projects: { where: (p, { isNull }) => isNull(p.deletedAt) },
        achievements: { where: (a, { isNull }) => isNull(a.deletedAt) },
        certifications: { where: (cert, { isNull }) => isNull(cert.deletedAt) },
        socials: true,
        results: true,
      },
    });

    const pdfRes = await fetch(`${CV_SERVICE_URL}/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template, students }),
    });

    if (!pdfRes.ok) return fail(c, "CV_ERROR", "Failed to generate PDFs", 500);

    const buffer = await pdfRes.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="resumes.zip"`,
      },
    });
  },
);

export default cv;
