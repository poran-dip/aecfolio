import {
  cvExportJobItemsTable,
  cvExportJobsTable,
  cvExportsTable,
  studentsTable,
  usersTable,
} from "@aecfolio/db";
import {
  attachmentHeader,
  CvExportJobStatus,
  CvExportKind,
  type CvSectionsConfig,
  type CvTemplateOptions,
  cvFileName,
  uniqueFileName,
} from "@aecfolio/shared";
import { STANDARD_TEMPLATE_ID } from "@aecfolio/ui/manifests";
import { and, asc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { Zip, ZipPassThrough } from "fflate";
import { db } from "../db";
import { getObjectBytes } from "../storage";
import { loadCvSources } from "./data";
import { exportCv, savedPreference } from "./export";
import { workerRenderConcurrency } from "./worker-client";

const LOAD_BATCH = 50;
const JOB_RETENTION_DAYS = 7;
const IDLE_POLL_MS = 2_000;

export async function createExportJob(
  requestedBy: string,
  studentIds: string[],
) {
  return db.transaction(async (tx) => {
    const [job] = await tx
      .insert(cvExportJobsTable)
      .values({ requestedBy, total: studentIds.length })
      .returning();

    await tx.insert(cvExportJobItemsTable).values(
      studentIds.map((studentId, position) => ({
        jobId: job.id,
        studentId,
        position,
      })),
    );

    return job;
  });
}

async function claimNextJob() {
  const rows = await db.execute<{ id: string }>(sql`
    update ${cvExportJobsTable}
    set status = ${CvExportJobStatus.RUNNING}, started_at = coalesce(started_at, now())
    where id = (
      select id from ${cvExportJobsTable}
      where status = ${CvExportJobStatus.QUEUED}
      order by created_at
      for update skip locked
      limit 1
    )
    returning id
  `);
  return rows.rows[0]?.id ?? null;
}

async function runLimited<T>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<void>,
) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const item = items[next++];
        await task(item);
      }
    }),
  );
}

type PendingItem = { id: string; studentId: string };

async function processItem(
  jobId: string,
  requestedBy: string,
  item: PendingItem,
  source: Awaited<ReturnType<typeof loadCvSources>>[number] | undefined,
) {
  try {
    if (!source) throw new Error("Student not found");

    const preference = await savedPreference(source.id, STANDARD_TEMPLATE_ID);
    const result = await exportCv({
      source,
      kind: CvExportKind.STANDARD,
      templateId: STANDARD_TEMPLATE_ID,
      sections: preference?.sections as CvSectionsConfig | undefined,
      options: preference?.options as CvTemplateOptions | undefined,
      requestedBy,
    });

    await db
      .update(cvExportJobItemsTable)
      .set({ exportId: result.export.id, finishedAt: new Date() })
      .where(eq(cvExportJobItemsTable.id, item.id));
    await db
      .update(cvExportJobsTable)
      .set({ completed: sql`${cvExportJobsTable.completed} + 1` })
      .where(eq(cvExportJobsTable.id, jobId));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(cvExportJobItemsTable)
      .set({ error: message.slice(0, 500), finishedAt: new Date() })
      .where(eq(cvExportJobItemsTable.id, item.id));
    await db
      .update(cvExportJobsTable)
      .set({ failed: sql`${cvExportJobsTable.failed} + 1` })
      .where(eq(cvExportJobsTable.id, jobId));
  }
}

export async function processJob(jobId: string) {
  const [job] = await db
    .select()
    .from(cvExportJobsTable)
    .where(eq(cvExportJobsTable.id, jobId))
    .limit(1);
  if (!job) return;

  try {
    const pending = await db
      .select({
        id: cvExportJobItemsTable.id,
        studentId: cvExportJobItemsTable.studentId,
      })
      .from(cvExportJobItemsTable)
      .where(
        and(
          eq(cvExportJobItemsTable.jobId, jobId),
          isNull(cvExportJobItemsTable.finishedAt),
        ),
      )
      .orderBy(asc(cvExportJobItemsTable.position));

    const batches: PendingItem[][] = [];
    for (let i = 0; i < pending.length; i += LOAD_BATCH)
      batches.push(pending.slice(i, i + LOAD_BATCH));

    const load = (batch: PendingItem[] | undefined) =>
      batch ? loadCvSources(batch.map((item) => item.studentId)) : null;

    const concurrency = await workerRenderConcurrency().catch(() => 1);

    let loading = load(batches[0]);
    for (let i = 0; i < batches.length; i++) {
      const sources = new Map((await loading)?.map((s) => [s.id, s]) ?? []);
      loading = load(batches[i + 1]);

      await runLimited(batches[i], concurrency, (item) =>
        processItem(jobId, job.requestedBy, item, sources.get(item.studentId)),
      );
    }

    const [done] = await db
      .select()
      .from(cvExportJobsTable)
      .where(eq(cvExportJobsTable.id, jobId));
    await db
      .update(cvExportJobsTable)
      .set({
        status:
          done.completed === 0 && done.failed > 0
            ? CvExportJobStatus.FAILED
            : CvExportJobStatus.SUCCEEDED,
        error:
          done.completed === 0 && done.failed > 0
            ? "No CV in this export could be generated"
            : null,
        finishedAt: new Date(),
      })
      .where(eq(cvExportJobsTable.id, jobId));
  } catch (err) {
    console.error(`[cv-jobs] job ${jobId} failed:`, err);
    await db
      .update(cvExportJobsTable)
      .set({
        status: CvExportJobStatus.FAILED,
        error: "The export stopped unexpectedly",
        finishedAt: new Date(),
      })
      .where(eq(cvExportJobsTable.id, jobId));
  }
}

export async function runQueuedJobs() {
  for (let id = await claimNextJob(); id; id = await claimNextJob()) {
    await processJob(id);
  }
}

async function pruneOldJobs() {
  const cutoff = new Date(Date.now() - JOB_RETENTION_DAYS * 86_400_000);
  await db
    .delete(cvExportJobsTable)
    .where(lt(cvExportJobsTable.createdAt, cutoff));
}

let wake: (() => void) | null = null;
let started = false;

export function nudgeJobRunner() {
  wake?.();
}

export function startJobRunner() {
  if (started) return;
  started = true;

  void (async () => {
    await db
      .update(cvExportJobsTable)
      .set({ status: CvExportJobStatus.QUEUED })
      .where(eq(cvExportJobsTable.status, CvExportJobStatus.RUNNING));

    for (;;) {
      try {
        await runQueuedJobs();
        await pruneOldJobs();
      } catch (err) {
        console.error("[cv-jobs] runner error:", err);
      }
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, IDLE_POLL_MS);
        wake = () => {
          clearTimeout(timer);
          resolve();
        };
      });
      wake = null;
    }
  })();
}

export async function jobZipEntries(jobId: string) {
  const rows = await db
    .select({
      position: cvExportJobItemsTable.position,
      error: cvExportJobItemsTable.error,
      objectKey: cvExportsTable.objectKey,
      studentId: cvExportJobItemsTable.studentId,
    })
    .from(cvExportJobItemsTable)
    .leftJoin(
      cvExportsTable,
      eq(cvExportsTable.id, cvExportJobItemsTable.exportId),
    )
    .where(eq(cvExportJobItemsTable.jobId, jobId))
    .orderBy(asc(cvExportJobItemsTable.position));

  const people =
    rows.length === 0
      ? []
      : await db
          .select({
            id: studentsTable.id,
            rollNo: studentsTable.rollNo,
            name: usersTable.name,
          })
          .from(studentsTable)
          .innerJoin(usersTable, eq(usersTable.id, studentsTable.userId))
          .where(
            inArray(
              studentsTable.id,
              rows.map((r) => r.studentId),
            ),
          );
  const names = new Map(people.map((p) => [p.id, cvFileName(p)]));

  return rows.map((row) => ({
    ...row,
    fileName: names.get(row.studentId) ?? `${row.studentId}.pdf`,
  }));
}

export function zipStream(
  entries: Awaited<ReturnType<typeof jobZipEntries>>,
): ReadableStream<Uint8Array> {
  const zip = new Zip();
  const taken = new Set<string>();
  const problems: string[] = [];
  let index = 0;
  let finished = false;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      zip.ondata = (err, chunk, final) => {
        if (err) return controller.error(err);
        controller.enqueue(chunk);
        if (final) controller.close();
      };
    },
    async pull() {
      while (index < entries.length) {
        const entry = entries[index++];
        const bytes = entry.objectKey
          ? await getObjectBytes(entry.objectKey)
          : null;
        if (!bytes) {
          problems.push(
            `${entry.fileName}: ${entry.error ?? "the stored PDF is no longer available"}`,
          );
          continue;
        }
        const file = new ZipPassThrough(uniqueFileName(taken, entry.fileName));
        zip.add(file);
        file.push(bytes, true);
        return;
      }

      if (finished) return;
      finished = true;
      if (problems.length > 0) {
        const file = new ZipPassThrough("MISSING.txt");
        zip.add(file);
        file.push(
          new TextEncoder().encode(
            `${problems.length} CV(s) could not be included:\n\n${problems.join("\n")}\n`,
          ),
          true,
        );
      }
      zip.end();
    },
  });
}

export const jobZipDisposition = (jobId: string) =>
  attachmentHeader(`cv-export-${jobId}.zip`);
