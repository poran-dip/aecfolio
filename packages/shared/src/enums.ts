export const Role = {
  STUDENT: "STUDENT",
  FACULTY: "FACULTY",
  MOD: "MOD",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Course = {
  BTECH: "BTECH",
  MTECH: "MTECH",
  BCA: "BCA",
  MCA: "MCA",
} as const;
export type Course = (typeof Course)[keyof typeof Course];

export const Branch = {
  CSE: "CSE",
  ETE: "ETE",
  EE: "EE",
  IE: "IE",
  ME: "ME",
  CE: "CE",
  IPE: "IPE",
  CHE: "CHE",
  CA: "CA",
} as const;
export type Branch = (typeof Branch)[keyof typeof Branch];

export const StudentStatus = {
  ACTIVE: "ACTIVE",
  ALUMNI: "ALUMNI",
  SUSPENDED: "SUSPENDED",
  LEFT: "LEFT",
} as const;
export type StudentStatus = (typeof StudentStatus)[keyof typeof StudentStatus];

export const VerificationStatus = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;
export type VerificationStatus =
  (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const CvExportKind = {
  SELF: "SELF",
  STANDARD: "STANDARD",
} as const;
export type CvExportKind = (typeof CvExportKind)[keyof typeof CvExportKind];

export const CvExportJobStatus = {
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED",
} as const;
export type CvExportJobStatus =
  (typeof CvExportJobStatus)[keyof typeof CvExportJobStatus];
