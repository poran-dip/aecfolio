import { sessionsTable } from "@aecfolio/db";
import { Role } from "@aecfolio/shared";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createUser, resetDatabase } from "../test/harness";
import { db } from "./db";
import { pruneExpiredSessions } from "./session-cleanup";

const HOUR = 60 * 60 * 1000;

async function insertSession(userId: string, expiresAt: Date) {
  const [session] = await db
    .insert(sessionsTable)
    .values({
      token: crypto.randomUUID(),
      userId,
      expiresAt,
    })
    .returning();
  return session.id;
}

async function stillExists(id: string) {
  const rows = await db
    .select({ id: sessionsTable.id })
    .from(sessionsTable)
    .where(eq(sessionsTable.id, id));
  return rows.length > 0;
}

describe("pruneExpiredSessions", () => {
  beforeEach(resetDatabase);

  it("deletes sessions whose expiresAt is in the past", async () => {
    const user = await createUser(Role.STUDENT);
    const expired = await insertSession(user.id, new Date(Date.now() - HOUR));

    await pruneExpiredSessions();

    expect(await stillExists(expired)).toBe(false);
  });

  it("leaves sessions that haven't expired yet", async () => {
    const user = await createUser(Role.STUDENT);
    const valid = await insertSession(user.id, new Date(Date.now() + HOUR));

    await pruneExpiredSessions();

    expect(await stillExists(valid)).toBe(true);
  });

  it("only removes the expired ones out of a mix", async () => {
    const user = await createUser(Role.STUDENT);
    const expired = await insertSession(user.id, new Date(Date.now() - HOUR));
    const valid = await insertSession(user.id, new Date(Date.now() + HOUR));

    await pruneExpiredSessions();

    expect(await stillExists(expired)).toBe(false);
    expect(await stillExists(valid)).toBe(true);
  });

  it("is a no-op when there are no sessions at all", async () => {
    await expect(pruneExpiredSessions()).resolves.not.toThrow();
  });
});
