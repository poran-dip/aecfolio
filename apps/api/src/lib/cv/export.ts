import { cvExportsTable, cvPreferencesTable } from "@aecfolio/db";
import {
  CV_EXPORT_HISTORY_MAX,
  type CvExportKind,
  type CvSectionsConfig,
  type CvTemplateOptions,
} from "@aecfolio/shared";
import {
  defaultSectionsConfig,
  getTemplateManifest,
  parseTemplateOptions,
  type TemplateManifest,
} from "@aecfolio/ui/manifests";
import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { deleteObject, getObjectBytes, putObject } from "../storage";
import { sniffContentType } from "../uploads";
import { checksumOf } from "./checksum";
import { buildCvData, type CvSource } from "./data";
import {
  forgetWorkerVersion,
  renderOnWorker,
  workerRenderVersion,
} from "./worker-client";

export class UnknownTemplateError extends Error {
  constructor(templateId: string) {
    super(`Unknown template: ${templateId}`);
  }
}

export type ExportRequest = {
  source: CvSource;
  kind: CvExportKind;
  templateId: string;
  sections?: CvSectionsConfig;
  options?: CvTemplateOptions;
  requestedBy: string;
};

export type ResolvedConfig = {
  manifest: TemplateManifest<unknown>;
  sections: CvSectionsConfig;
  options: CvTemplateOptions;
};

export async function savedPreference(studentId: string, templateId: string) {
  const [row] = await db
    .select()
    .from(cvPreferencesTable)
    .where(
      and(
        eq(cvPreferencesTable.studentId, studentId),
        eq(cvPreferencesTable.templateId, templateId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export function resolveConfig(
  templateId: string,
  source: Pick<CvSource, "customSections">,
  sections: CvSectionsConfig | undefined,
  options: CvTemplateOptions | undefined,
): ResolvedConfig {
  const manifest = getTemplateManifest(templateId);
  if (!manifest) throw new UnknownTemplateError(templateId);

  const customIds = new Set(source.customSections.map((s) => s.id));
  const resolvedSections = (
    sections ?? defaultSectionsConfig(manifest, source.customSections)
  ).filter(
    (section) =>
      manifest.supportedSections.includes(section.type) &&
      (section.type !== "custom" || customIds.has(section.customSectionId)),
  );

  return {
    manifest,
    sections: resolvedSections,
    options: parseTemplateOptions(manifest, options) as CvTemplateOptions,
  };
}

function checksumFor(
  version: string,
  request: ExportRequest,
  config: ResolvedConfig,
  data: ReturnType<typeof buildCvData>,
  photoKey: string | null,
) {
  return checksumOf({
    version,
    kind: request.kind,
    templateId: request.templateId,
    sections: config.sections,
    options: config.options,
    data,
    photoKey,
  });
}

async function inlinePhoto(key: string): Promise<string | null> {
  const bytes = await getObjectBytes(key);
  if (!bytes) return null;
  const type = sniffContentType(bytes);
  if (!type?.startsWith("image/")) return null;
  return `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
}

async function pruneHistory(studentId: string) {
  const stale = await db
    .select({ id: cvExportsTable.id, objectKey: cvExportsTable.objectKey })
    .from(cvExportsTable)
    .where(eq(cvExportsTable.studentId, studentId))
    .orderBy(desc(cvExportsTable.createdAt), desc(cvExportsTable.id))
    .offset(CV_EXPORT_HISTORY_MAX);
  if (stale.length === 0) return;

  await db.delete(cvExportsTable).where(
    inArray(
      cvExportsTable.id,
      stale.map((row) => row.id),
    ),
  );
  await Promise.all(
    stale.map((row) => deleteObject(row.objectKey).catch(() => {})),
  );
}

export async function exportCv(request: ExportRequest) {
  const { source } = request;
  const config = resolveConfig(
    request.templateId,
    source,
    request.sections,
    request.options,
  );

  const data = buildCvData(source, request.kind);
  const photoKey =
    source.user.image && config.manifest.printsPhoto(config.options)
      ? source.user.image
      : null;

  let version = await workerRenderVersion();
  let checksum = checksumFor(version, request, config, data, photoKey);

  const [existing] = await db
    .select()
    .from(cvExportsTable)
    .where(
      and(
        eq(cvExportsTable.studentId, source.id),
        eq(cvExportsTable.checksum, checksum),
      ),
    )
    .orderBy(desc(cvExportsTable.createdAt))
    .limit(1);
  if (existing) return { export: existing, cached: true };

  const photo = photoKey ? await inlinePhoto(photoKey) : null;
  const rendered = await renderOnWorker({
    templateId: request.templateId,
    data: { ...data, user: { ...data.user, image: photo } },
    sections: config.sections,
    options: config.options,
  });

  if (rendered.version && rendered.version !== version) {
    forgetWorkerVersion();
    version = rendered.version;
    checksum = checksumFor(version, request, config, data, photoKey);
  }

  const objectKey = `exports/${source.id}/${createId()}.pdf`;
  await putObject(objectKey, rendered.pdf, "application/pdf");

  const [created] = await db
    .insert(cvExportsTable)
    .values({
      studentId: source.id,
      templateId: request.templateId,
      kind: request.kind,
      config: config.sections,
      options: config.options,
      checksum,
      objectKey,
      sizeBytes: rendered.pdf.byteLength,
      requestedBy: request.requestedBy,
    })
    .returning();

  await pruneHistory(source.id);

  return { export: created, cached: false };
}
