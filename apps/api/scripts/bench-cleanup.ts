import "dotenv/config";
import { existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { cvExportsTable, db, studentsTable, usersTable } from "@aecfolio/db";
import { Role } from "@aecfolio/shared";
import { inArray, like } from "drizzle-orm";
import { deleteObject } from "../src/lib/storage";
import { BENCH_DOMAIN } from "./bench/lib";

async function main() {
  const benchUsers = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(like(usersTable.email, `%@${BENCH_DOMAIN}`));
  if (benchUsers.length === 0) {
    console.log("[bench-cleanup] nothing to clean up");
  } else {
    const studentUserIds = benchUsers
      .filter((u) => u.role === Role.STUDENT)
      .map((u) => u.id);
    const staffUserIds = benchUsers
      .filter((u) => u.role !== Role.STUDENT)
      .map((u) => u.id);

    const studentRows = await db
      .select({ id: studentsTable.id })
      .from(studentsTable)
      .where(inArray(studentsTable.userId, studentUserIds));
    const studentIds = studentRows.map((s) => s.id);

    const exports =
      studentIds.length === 0
        ? []
        : await db
            .select({ objectKey: cvExportsTable.objectKey })
            .from(cvExportsTable)
            .where(inArray(cvExportsTable.studentId, studentIds));

    console.log(
      `[bench-cleanup] deleting ${exports.length} bucket object(s) for ${studentIds.length} bench student(s)...`,
    );
    for (const batch of chunk(exports, 20)) {
      await Promise.all(
        batch.map((row) => deleteObject(row.objectKey).catch(() => {})),
      );
    }

    await db.delete(usersTable).where(inArray(usersTable.id, studentUserIds));
    await db.delete(usersTable).where(inArray(usersTable.id, staffUserIds));
    console.log(`[bench-cleanup] deleted ${benchUsers.length} bench user(s)`);
  }

  const stateDir = path.join(import.meta.dirname, "bench", ".state");
  if (existsSync(stateDir)) {
    for (const file of readdirSync(stateDir)) rmSync(path.join(stateDir, file));
    console.log(`[bench-cleanup] cleared ${stateDir}`);
  }

  process.exit(0);
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size));
  return out;
}

main().catch((err) => {
  console.error("[bench-cleanup] failed:", err);
  process.exit(1);
});
