import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["STUDENT", "FACULTY", "MOD", "ADMIN"]);

export const courseEnum = pgEnum("course", ["BTECH", "MTECH", "BCA", "MCA"]);

export const branchEnum = pgEnum("branch", [
  "CSE",
  "ETE",
  "EE",
  "IE",
  "ME",
  "CE",
  "IPE",
  "CHE",
  "CA",
]);

export const studentStatusEnum = pgEnum("student_status", [
  "ACTIVE",
  "ALUMNI",
  "SUSPENDED",
  "LEFT",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "PENDING",
  "VERIFIED",
  "REJECTED",
]);

export const cvExportKindEnum = pgEnum("cv_export_kind", ["SELF", "STANDARD"]);

export const cvExportJobStatusEnum = pgEnum("cv_export_job_status", [
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
]);
