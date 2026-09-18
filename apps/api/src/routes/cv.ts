import {
  cvExportJobItemsTable,
  cvExportJobsTable,
  cvExportsTable,
  cvPreferencesTable,
  studentsTable,
  usersTable,
} from "@aecfolio/db";
import {
  attachmentHeader,
  Capability,
  CvExportJobStatus,
  CvExportKind,
  type CvSectionsConfig,
  type CvTemplateOptions,
  createCvExportJobSchema,
  createSelfCvExportSchema,
  createStandardCvExportSchema,
  cvFileName,
  upsertCvPreferenceSchema,
} from "@aecfolio/shared";
import { STANDARD_TEMPLATE_ID } from "@aecfolio/ui/manifests";
import { and, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { type Context, Hono } from "hono";
import { loadCvSources } from "../lib/cv/data";
import {
  exportCv,
  resolveConfig,
  savedPreference,
  UnknownTemplateError,
} from "../lib/cv/export";
import {
  createExportJob,
  jobZipDisposition,
  jobZipEntries,
  nudgeJobRunner,
  zipStream,
} from "../lib/cv/jobs";
import { WorkerError } from "../lib/cv/worker-client";
import { db } from "../lib/db";
import { resolveOwnStudent, resolveReadScope } from "../lib/ownership";
import { fail, getUser, ok } from "../lib/response";
import { redirectToObject } from "../lib/uploads";
import { validate } from "../lib/validate";
import { requireAuth, requireCapability } from "../middleware/capability";
import type { AppEnv } from "../types/context";

async function loadSource(studentId: string) {
  const [source] = await loadCvSources([studentId]);
  return source ?? null;
}

function exportFailure(c: Context, err: unknown) {
  if (err instanceof UnknownTemplateError)
    return fail(c, "VALIDATION", err.message, 400);
  if (err instanceof WorkerError) {
    console.error("[cv]", err.message);
    return fail(c, "WORKER_UNAVAILABLE", "CV generation is unavailable", 502);
  }
  throw err;
}

function publicExport(row: typeof cvExportsTable.$inferSelect) {
  const { objectKey: _key, checksum: _checksum, ...rest } = row;
  return rest;
}

const cv = new Hono<AppEnv>()
  .get(
    "/preferences",
    requireCapability(Capability.PROFILE_WRITE_SELF),
    async (c) => {
      const scope = await resolveOwnStudent(c, getUser(c));
      if (!scope.ok) return scope.response;

      const rows = await db
        .select()
        .from(cvPreferencesTable)
        .where(eq(cvPreferencesTable.studentId, scope.studentId));
      return ok(c, rows);
    },
  )

  .put(
    "/preferences",
    requireCapability(Capability.PROFILE_WRITE_SELF),
    validate("json", upsertCvPreferenceSchema),
    async (c) => {
      const body = c.req.valid("json");
      const scope = await resolveOwnStudent(c, getUser(c));
      if (!scope.ok) return scope.response;

      const source = await loadSource(scope.studentId);
      if (!source) return fail(c, "NOT_FOUND", "Student not found", 404);

      let config: ReturnType<typeof resolveConfig>;
      try {
        config = resolveConfig(
          body.templateId,
          source,
          body.sections,
          body.options,
        );
      } catch (err) {
        return exportFailure(c, err);
      }

      const values = {
        studentId: scope.studentId,
        templateId: body.templateId,
        sections: config.sections,
        options: config.options,
      };
      const [row] = await db
        .insert(cvPreferencesTable)
        .values(values)
        .onConflictDoUpdate({
          target: [cvPreferencesTable.studentId, cvPreferencesTable.templateId],
          set: { sections: values.sections, options: values.options },
        })
        .returning();
      return ok(c, row);
    },
  )

  .post(
    "/exports/self",
    requireCapability(Capability.CV_EXPORT_SELF),
    validate("json", createSelfCvExportSchema),
    async (c) => {
      const user = getUser(c);
      const body = c.req.valid("json");
      const scope = await resolveOwnStudent(c, user);
      if (!scope.ok) return scope.response;

      const source = await loadSource(scope.studentId);
      if (!source) return fail(c, "NOT_FOUND", "Student not found", 404);

      const preference =
        body.sections && body.options
          ? null
          : await savedPreference(source.id, body.templateId);

      try {
        const result = await exportCv({
          source,
          kind: CvExportKind.SELF,
          templateId: body.templateId,
          sections:
            body.sections ??
            (preference?.sections as CvSectionsConfig | undefined),
          options:
            body.options ??
            (preference?.options as CvTemplateOptions | undefined),
          requestedBy: user.id,
        });
        return ok(
          c,
          { export: publicExport(result.export), cached: result.cached },
          result.cached ? 200 : 201,
        );
      } catch (err) {
        return exportFailure(c, err);
      }
    },
  )

  .post(
    "/exports/standard",
    requireCapability(Capability.CV_EXPORT_STANDARD),
    validate("json", createStandardCvExportSchema),
    async (c) => {
      const user = getUser(c);
      const { studentId } = c.req.valid("json");

      const source = await loadSource(studentId);
      if (!source) return fail(c, "NOT_FOUND", "Student not found", 404);

      const preference = await savedPreference(source.id, STANDARD_TEMPLATE_ID);

      try {
        const result = await exportCv({
          source,
          kind: CvExportKind.STANDARD,
          templateId: STANDARD_TEMPLATE_ID,
          sections: preference?.sections as CvSectionsConfig | undefined,
          options: preference?.options as CvTemplateOptions | undefined,
          requestedBy: user.id,
        });
        return ok(
          c,
          { export: publicExport(result.export), cached: result.cached },
          result.cached ? 200 : 201,
        );
      } catch (err) {
        return exportFailure(c, err);
      }
    },
  )

  .get("/exports", requireAuth(), async (c) => {
    const user = getUser(c);
    const scope = await resolveReadScope(c, user, c.req.query("studentId"));
    if (!scope.ok) return scope.response;

    const rows = await db
      .select()
      .from(cvExportsTable)
      .where(eq(cvExportsTable.studentId, scope.studentId))
      .orderBy(desc(cvExportsTable.createdAt));
    return ok(c, rows.map(publicExport));
  })

  .get("/exports/:id/download", requireAuth(), async (c) => {
    const user = getUser(c);

    const [row] = await db
      .select({
        export: cvExportsTable,
        rollNo: studentsTable.rollNo,
        name: usersTable.name,
      })
      .from(cvExportsTable)
      .innerJoin(studentsTable, eq(studentsTable.id, cvExportsTable.studentId))
      .innerJoin(usersTable, eq(usersTable.id, studentsTable.userId))
      .where(
        and(
          eq(cvExportsTable.id, c.req.param("id")),
          isNull(studentsTable.deletedAt),
        ),
      )
      .limit(1);
    if (!row) return fail(c, "NOT_FOUND", "Export not found", 404);

    const scope = await resolveReadScope(c, user, row.export.studentId);
    if (!scope.ok) return scope.response;

    return redirectToObject(
      c,
      row.export.objectKey,
      attachmentHeader(cvFileName({ rollNo: row.rollNo, name: row.name })),
    );
  })

  .post(
    "/jobs",
    requireCapability(Capability.CV_EXPORT_STANDARD),
    validate("json", createCvExportJobSchema),
    async (c) => {
      const user = getUser(c);
      const { studentIds } = c.req.valid("json");

      const found = await db
        .select({ id: studentsTable.id })
        .from(studentsTable)
        .where(
          and(
            inArray(studentsTable.id, studentIds),
            isNull(studentsTable.deletedAt),
          ),
        );
      const known = new Set(found.map((row) => row.id));
      const missing = studentIds.filter((id) => !known.has(id));
      if (missing.length > 0)
        return fail(c, "VALIDATION", "Some students do not exist", 400, {
          missing,
        });

      const job = await createExportJob(user.id, studentIds);
      nudgeJobRunner();
      return ok(c, job, 202);
    },
  )

  .get("/jobs", requireCapability(Capability.CV_EXPORT_STANDARD), async (c) => {
    const rows = await db
      .select()
      .from(cvExportJobsTable)
      .where(eq(cvExportJobsTable.requestedBy, getUser(c).id))
      .orderBy(desc(cvExportJobsTable.createdAt))
      .limit(20);
    return ok(c, rows);
  })

  .get(
    "/jobs/:id",
    requireCapability(Capability.CV_EXPORT_STANDARD),
    async (c) => {
      const [job] = await db
        .select()
        .from(cvExportJobsTable)
        .where(
          and(
            eq(cvExportJobsTable.id, c.req.param("id")),
            eq(cvExportJobsTable.requestedBy, getUser(c).id),
          ),
        )
        .limit(1);
      if (!job) return fail(c, "NOT_FOUND", "Export job not found", 404);
      return ok(c, job);
    },
  )

  .get(
    "/jobs/:id/failures",
    requireCapability(Capability.CV_EXPORT_STANDARD),
    async (c) => {
      const [job] = await db
        .select({ id: cvExportJobsTable.id })
        .from(cvExportJobsTable)
        .where(
          and(
            eq(cvExportJobsTable.id, c.req.param("id")),
            eq(cvExportJobsTable.requestedBy, getUser(c).id),
          ),
        )
        .limit(1);
      if (!job) return fail(c, "NOT_FOUND", "Export job not found", 404);

      const rows = await db
        .select({
          studentId: cvExportJobItemsTable.studentId,
          rollNo: studentsTable.rollNo,
          name: usersTable.name,
          error: cvExportJobItemsTable.error,
        })
        .from(cvExportJobItemsTable)
        .innerJoin(
          studentsTable,
          eq(cvExportJobItemsTable.studentId, studentsTable.id),
        )
        .innerJoin(usersTable, eq(studentsTable.userId, usersTable.id))
        .where(
          and(
            eq(cvExportJobItemsTable.jobId, job.id),
            isNotNull(cvExportJobItemsTable.error),
          ),
        )
        .orderBy(cvExportJobItemsTable.position);

      return ok(c, rows);
    },
  )

  .get(
    "/jobs/:id/download",
    requireCapability(Capability.CV_EXPORT_STANDARD),
    async (c) => {
      const [job] = await db
        .select()
        .from(cvExportJobsTable)
        .where(
          and(
            eq(cvExportJobsTable.id, c.req.param("id")),
            eq(cvExportJobsTable.requestedBy, getUser(c).id),
          ),
        )
        .limit(1);
      if (!job) return fail(c, "NOT_FOUND", "Export job not found", 404);
      if (job.status !== CvExportJobStatus.SUCCEEDED)
        return fail(c, "CONFLICT", "This export has not finished", 409);

      const entries = await jobZipEntries(job.id);
      return new Response(zipStream(entries), {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": jobZipDisposition(job.id),
          "Cache-Control": "private, no-store",
        },
      });
    },
  );

export default cv;
