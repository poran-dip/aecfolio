import "dotenv/config";
import { parseArgs } from "node:util";
import { cvExportJobsTable, cvExportsTable, db } from "@aecfolio/db";
import { CV_EXPORT_JOB_MAX_STUDENTS } from "@aecfolio/shared";
import { count, inArray } from "drizzle-orm";
import { createApp } from "../src/app";
import { nudgeJobRunner, startJobRunner } from "../src/lib/cv/jobs";
import { benchSessionResolver, chunk, pollJobs, readState } from "./bench/lib";

async function exportCountFor(studentIds: string[]) {
  const [row] = await db
    .select({ value: count() })
    .from(cvExportsTable)
    .where(inArray(cvExportsTable.studentId, studentIds));
  return row.value;
}

async function main() {
  const { values } = parseArgs({
    options: { students: { type: "string", short: "n", default: "500" } },
  });
  const studentCount = Number.parseInt(values.students as string, 10);
  const state = readState(studentCount);
  if (!state) {
    console.error(
      `No seeded run for ${studentCount} students. Run: pnpm bench:cold -- --students ${studentCount}`,
    );
    process.exit(1);
  }

  console.log(
    `[bench-warm] ${studentCount} students, reusing run ${state.runId}`,
  );

  const app = createApp({
    sessionResolver: benchSessionResolver(state.faculty),
  });
  startJobRunner();

  const before = await exportCountFor(state.studentIds);

  const jobIds: string[] = [];
  for (const ids of chunk(state.studentIds, CV_EXPORT_JOB_MAX_STUDENTS)) {
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
  console.log(`[bench-warm] queued ${jobIds.length} job(s)`);
  nudgeJobRunner();

  const started = performance.now();
  const jobs = await pollJobs(
    () =>
      db
        .select()
        .from(cvExportJobsTable)
        .where(inArray(cvExportJobsTable.id, jobIds)),
    (jobs) => {
      const done = jobs.reduce((a, j) => a + j.completed + j.failed, 0);
      console.log(`[bench-warm] ${done}/${studentCount} done`);
    },
  );
  const seconds = (performance.now() - started) / 1000;

  const after = await exportCountFor(state.studentIds);
  const completed = jobs.reduce((a, j) => a + j.completed, 0);
  const failed = jobs.reduce((a, j) => a + j.failed, 0);

  console.log("");
  console.log(`[bench-warm] ${studentCount} students, run ${state.runId}`);
  console.log(
    `  export: ${seconds.toFixed(1)}s total, ${((seconds * 1000) / studentCount).toFixed(0)}ms/pdf`,
  );
  console.log(`  result: ${completed} succeeded, ${failed} failed`);
  console.log(
    `  cache:  ${after - before} new export row(s) written (0 means every PDF was reused)`,
  );

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[bench-warm] failed:", err);
  process.exit(1);
});
