import "dotenv/config";
import { parseArgs } from "node:util";
import { cvExportJobsTable, db } from "@aecfolio/db";
import { CV_EXPORT_JOB_MAX_STUDENTS } from "@aecfolio/shared";
import { inArray } from "drizzle-orm";
import { createApp } from "../src/app";
import { nudgeJobRunner, startJobRunner } from "../src/lib/cv/jobs";
import {
  benchSessionResolver,
  chunk,
  ensureFaculty,
  ensureReviewer,
  ensureScheme,
  pollJobs,
  seedBenchStudents,
  writeState,
} from "./bench/lib";

async function submitJobs(
  app: ReturnType<typeof createApp>,
  studentIds: string[],
) {
  const jobIds: string[] = [];
  for (const ids of chunk(studentIds, CV_EXPORT_JOB_MAX_STUDENTS)) {
    const res = await app.request("/api/cv/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentIds: ids }),
    });
    if (res.status !== 202) {
      throw new Error(
        `Job submission failed (${res.status}): ${await res.text()}`,
      );
    }
    const { data } = (await res.json()) as { data: { id: string } };
    jobIds.push(data.id);
  }
  return jobIds;
}

async function main() {
  const { values } = parseArgs({
    options: { students: { type: "string", short: "n", default: "500" } },
  });
  const studentCount = Number.parseInt(values.students as string, 10);
  if (!Number.isFinite(studentCount) || studentCount < 1) {
    console.error("Usage: pnpm bench:cold -- --students 500");
    process.exit(1);
  }

  const runId = Date.now().toString(36);
  console.log(`[bench-cold] ${studentCount} students, run ${runId}`);

  const [reviewer, faculty, schemeId] = await Promise.all([
    ensureReviewer(),
    ensureFaculty(),
    ensureScheme(),
  ]);

  console.log("[bench-cold] seeding students...");
  const seedStarted = performance.now();
  const studentIds = await seedBenchStudents({
    studentCount,
    runId,
    reviewerId: reviewer.id,
    schemeId,
  });
  const seedSeconds = (performance.now() - seedStarted) / 1000;
  console.log(`[bench-cold] seeded in ${seedSeconds.toFixed(1)}s`);

  writeState({
    runId,
    studentCount,
    studentIds,
    faculty,
    seededAt: new Date().toISOString(),
  });

  const app = createApp({ sessionResolver: benchSessionResolver(faculty) });
  startJobRunner();

  const jobIds = await submitJobs(app, studentIds);
  console.log(`[bench-cold] queued ${jobIds.length} job(s)`);
  nudgeJobRunner();

  const renderStarted = performance.now();
  const jobs = await pollJobs(
    () =>
      db
        .select()
        .from(cvExportJobsTable)
        .where(inArray(cvExportJobsTable.id, jobIds)),
    (jobs) => {
      const done = jobs.reduce((a, j) => a + j.completed + j.failed, 0);
      console.log(`[bench-cold] ${done}/${studentCount} done`);
    },
  );
  const renderSeconds = (performance.now() - renderStarted) / 1000;

  const completed = jobs.reduce((a, j) => a + j.completed, 0);
  const failed = jobs.reduce((a, j) => a + j.failed, 0);

  console.log("");
  console.log(`[bench-cold] ${studentCount} students, run ${runId}`);
  console.log(`  seed:   ${seedSeconds.toFixed(1)}s`);
  console.log(
    `  export: ${renderSeconds.toFixed(1)}s total, ${((renderSeconds * 1000) / studentCount).toFixed(0)}ms/pdf`,
  );
  console.log(`  result: ${completed} succeeded, ${failed} failed`);
  if (failed > 0)
    console.log(
      `  jobs with failures: ${jobs
        .filter((j) => j.failed > 0)
        .map((j) => j.id)
        .join(", ")}`,
    );
  console.log(`  next:   pnpm bench:warm -- --students ${studentCount}`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[bench-cold] failed:", err);
  process.exit(1);
});
