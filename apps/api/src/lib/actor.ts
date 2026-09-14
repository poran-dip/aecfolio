import { facultyTable, studentsTable } from "@aecfolio/db";
import { Role } from "@aecfolio/shared";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./db";
import type { Actor } from "./session";

export async function getStudentForUser(userId: string) {
  const [row] = await db
    .select({
      id: studentsTable.id,
      branch: studentsTable.branch,
      admissionYear: studentsTable.admissionYear,
      semester: studentsTable.semester,
      status: studentsTable.status,
    })
    .from(studentsTable)
    .where(
      and(eq(studentsTable.userId, userId), isNull(studentsTable.deletedAt)),
    )
    .limit(1);
  return row ?? null;
}

export async function getFacultyForUser(userId: string) {
  const [row] = await db
    .select({
      id: facultyTable.id,
      employeeId: facultyTable.employeeId,
      designation: facultyTable.designation,
      department: facultyTable.department,
    })
    .from(facultyTable)
    .where(and(eq(facultyTable.userId, userId), isNull(facultyTable.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function getActorDepartment(actor: Actor) {
  if (actor.role === Role.STUDENT) return null;
  const faculty = await getFacultyForUser(actor.id);
  return faculty?.department ?? null;
}
