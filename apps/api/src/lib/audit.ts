import { auditLogsTable } from "@aecfolio/db";
import { db } from "./db";

export const AuditEntity = {
  USER: "User",
  STUDENT: "Student",
  FACULTY: "Faculty",
  RESULT: "Result",
  ACHIEVEMENT: "Achievement",
  CERTIFICATION: "Certification",
  EXPERIENCE: "Experience",
  PROJECT: "Project",
  SOCIAL: "Social",
  INTEREST: "Interest",
  CUSTOM_SECTION: "CustomSection",
  CUSTOM_SECTION_ENTRY: "CustomSectionEntry",
  SEMESTER_CREDIT_SCHEME: "SemesterCreditScheme",
} as const;

export type AuditEntity = (typeof AuditEntity)[keyof typeof AuditEntity];

export const AuditAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  VERIFY: "VERIFY",
  REJECT: "REJECT",
  IMPORT: "IMPORT",
  PROMOTE: "PROMOTE",
  SET_ROLE: "SET_ROLE",
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

interface AuditLogParams {
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(params: AuditLogParams) {
  await db.insert(auditLogsTable).values(params);
}

export async function createAuditLogs(entries: AuditLogParams[]) {
  if (entries.length === 0) return;
  await db.insert(auditLogsTable).values(entries);
}

export function diff<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
): Record<string, unknown> | undefined {
  const changed: Record<string, { from: unknown; to: unknown }> = {};

  for (const key of Object.keys(after)) {
    const from = before[key];
    const to = after[key];
    if (from === to) continue;
    if (
      from instanceof Date &&
      to instanceof Date &&
      from.getTime() === to.getTime()
    )
      continue;
    changed[key] = { from, to };
  }

  return Object.keys(changed).length ? { changed } : undefined;
}
