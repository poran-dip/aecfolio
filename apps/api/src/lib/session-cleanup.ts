import { sessionsTable } from "@aecfolio/db";
import { lt } from "drizzle-orm";
import { db } from "./db";

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

export async function pruneExpiredSessions() {
  await db.delete(sessionsTable).where(lt(sessionsTable.expiresAt, new Date()));
}

let started = false;

export function startSessionCleanup() {
  if (started) return;
  started = true;

  void (async () => {
    for (;;) {
      try {
        await pruneExpiredSessions();
      } catch (err) {
        console.error("[session-cleanup] failed:", err);
      }
      await new Promise<void>((resolve) =>
        setTimeout(resolve, CLEANUP_INTERVAL_MS),
      );
    }
  })();
}
