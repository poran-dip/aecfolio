import { Role } from "@aecfolio/shared";

export const Capability = {
  PROFILE_WRITE_SELF: "profile:write:self",
  RESULT_SUBMIT_SELF: "result:submit:self",
  STUDENT_READ: "student:read",
  STUDENT_MANAGE: "student:manage",
  ACADEMIC_RECTIFY: "academic:rectify",
  COHORT_PROMOTE: "cohort:promote",
  CLAIM_REVIEW: "claim:review",
  FACULTY_MANAGE: "faculty:manage",
  MOD_MANAGE: "mod:manage",
  ADMIN_MANAGE: "admin:manage",
  ROLE_PROMOTE_FACULTY_TO_MOD: "role:promote:faculty-to-mod",
  ROLE_DEMOTE_MOD_TO_FACULTY: "role:demote:mod-to-faculty",
  ROLE_SET_ADMIN: "role:set:admin",
  AUDIT_READ: "audit:read",
  CV_EXPORT_SELF: "cv:export:self",
  CV_EXPORT_STANDARD: "cv:export:standard",
  PROOF_READ: "proof:read",
} as const;

export type Capability = (typeof Capability)[keyof typeof Capability];

const STUDENT: Capability[] = [
  Capability.PROFILE_WRITE_SELF,
  Capability.RESULT_SUBMIT_SELF,
  Capability.CV_EXPORT_SELF,
  Capability.PROOF_READ,
];

const FACULTY: Capability[] = [
  Capability.STUDENT_READ,
  Capability.CV_EXPORT_STANDARD,
  Capability.PROOF_READ,
];

const MOD: Capability[] = [
  Capability.STUDENT_READ,
  Capability.STUDENT_MANAGE,
  Capability.ACADEMIC_RECTIFY,
  Capability.CLAIM_REVIEW,
  Capability.FACULTY_MANAGE,
  Capability.ROLE_PROMOTE_FACULTY_TO_MOD,
  Capability.AUDIT_READ,
  Capability.CV_EXPORT_STANDARD,
  Capability.PROOF_READ,
];

const ADMIN: Capability[] = [
  ...MOD,
  Capability.COHORT_PROMOTE,
  Capability.MOD_MANAGE,
  Capability.ADMIN_MANAGE,
  Capability.ROLE_DEMOTE_MOD_TO_FACULTY,
  Capability.ROLE_SET_ADMIN,
];

export const CAPABILITY_MATRIX: Record<Role, readonly Capability[]> = {
  [Role.STUDENT]: STUDENT,
  [Role.FACULTY]: FACULTY,
  [Role.MOD]: MOD,
  [Role.ADMIN]: ADMIN,
};

export function hasCapability(role: Role, capability: Capability): boolean {
  return CAPABILITY_MATRIX[role]?.includes(capability) ?? false;
}

export const STAFF_ROLES: readonly Role[] = [
  Role.FACULTY,
  Role.MOD,
  Role.ADMIN,
];

export function isStaffRole(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

export function canManageStaffWithRole(
  actorRole: Role,
  targetRole: Role,
): boolean {
  switch (targetRole) {
    case Role.FACULTY:
      return hasCapability(actorRole, Capability.FACULTY_MANAGE);
    case Role.MOD:
      return hasCapability(actorRole, Capability.MOD_MANAGE);
    case Role.ADMIN:
      return hasCapability(actorRole, Capability.ADMIN_MANAGE);
    default:
      return false;
  }
}

export function canChangeRole(
  actorRole: Role,
  fromRole: Role,
  toRole: Role,
): boolean {
  if (fromRole === toRole) return false;
  if (fromRole === Role.STUDENT || toRole === Role.STUDENT) return false;

  if (fromRole === Role.ADMIN || toRole === Role.ADMIN)
    return hasCapability(actorRole, Capability.ROLE_SET_ADMIN);

  if (fromRole === Role.FACULTY && toRole === Role.MOD)
    return hasCapability(actorRole, Capability.ROLE_PROMOTE_FACULTY_TO_MOD);

  if (fromRole === Role.MOD && toRole === Role.FACULTY)
    return hasCapability(actorRole, Capability.ROLE_DEMOTE_MOD_TO_FACULTY);

  return false;
}
