import { Capability, hasCapability, Role } from "@aecfolio/shared";
import type { Context } from "hono";
import { getStudentForUser } from "./actor";
import { fail } from "./response";
import type { Actor } from "./session";

export type ScopeFailure = ReturnType<typeof fail>;

export type Scope =
  | { ok: true; studentId: string; isOwn: boolean }
  | { ok: false; response: ScopeFailure };

export async function resolveReadScope(
  c: Context,
  actor: Actor,
  requestedStudentId: string | undefined,
): Promise<Scope> {
  if (actor.role === Role.STUDENT) {
    const student = await getStudentForUser(actor.id);
    if (!student)
      return {
        ok: false,
        response: fail(c, "NOT_FOUND", "Student profile not found", 404),
      };
    if (requestedStudentId && requestedStudentId !== student.id)
      return { ok: false, response: fail(c, "FORBIDDEN", "Forbidden", 403) };
    return { ok: true, studentId: student.id, isOwn: true };
  }

  if (!hasCapability(actor.role, Capability.STUDENT_READ))
    return { ok: false, response: fail(c, "FORBIDDEN", "Forbidden", 403) };

  if (!requestedStudentId)
    return {
      ok: false,
      response: fail(c, "VALIDATION", "studentId is required", 400),
    };

  return { ok: true, studentId: requestedStudentId, isOwn: false };
}

export async function resolveOwnStudent(
  c: Context,
  actor: Actor,
): Promise<Scope> {
  const student = await getStudentForUser(actor.id);
  if (!student)
    return {
      ok: false,
      response: fail(c, "NOT_FOUND", "Student profile not found", 404),
    };
  return { ok: true, studentId: student.id, isOwn: true };
}
