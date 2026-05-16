import { studentsTable } from "@aecfolio/db";
import { eq } from "drizzle-orm";
import { db } from "./db";

export async function getStudentForUser(userId: string) {
  const result = await db
    .select({ id: studentsTable.id })
    .from(studentsTable)
    .where(eq(studentsTable.userId, userId))
    .limit(1);
  return result[0] ?? null;
}
