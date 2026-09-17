import { Capability, hasCapability, isStaffRole, Role } from "@aecfolio/shared";
import {
  BadgeCheck,
  CalendarSync,
  FileDown,
  FileText,
  GraduationCap,
  History,
  ScrollText,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type NavItem = {
  to: string;
  label: string;
  icon: NavIcon;
  capability?: Capability;
  staffOnly?: boolean;
  nested?: boolean;
  badge?: "verifications";
};

const STUDENT_NAV: NavItem[] = [
  {
    to: "/app",
    label: "My profile",
    icon: UserRound,
    capability: Capability.PROFILE_WRITE_SELF,
  },
  {
    to: "/export",
    label: "CV builder",
    icon: FileText,
    capability: Capability.CV_EXPORT_SELF,
  },
  {
    to: "/history",
    label: "Export history",
    icon: History,
    capability: Capability.CV_EXPORT_SELF,
  },
];

const STAFF_NAV: NavItem[] = [
  {
    to: "/verifications",
    label: "Verifications",
    icon: BadgeCheck,
    capability: Capability.CLAIM_REVIEW,
    badge: "verifications",
  },
  {
    to: "/students",
    label: "Students",
    icon: GraduationCap,
    capability: Capability.STUDENT_READ,
    nested: true,
  },
  {
    to: "/students/exports",
    label: "Bulk exports",
    icon: FileDown,
    capability: Capability.CV_EXPORT_STANDARD,
  },
  {
    to: "/import",
    label: "Import students",
    icon: Upload,
    capability: Capability.STUDENT_MANAGE,
  },
  {
    to: "/faculty",
    label: "Faculty",
    icon: Users,
    capability: Capability.FACULTY_MANAGE,
    nested: true,
  },
  {
    to: "/cohort",
    label: "Cohorts",
    icon: CalendarSync,
    capability: Capability.COHORT_PROMOTE,
  },
  {
    to: "/audit",
    label: "Audit log",
    icon: ScrollText,
    capability: Capability.AUDIT_READ,
  },
];

export function navItemsFor(role: Role): NavItem[] {
  const items = role === Role.STUDENT ? STUDENT_NAV : STAFF_NAV;

  return items.filter((item) => {
    if (item.staffOnly && !isStaffRole(role)) return false;
    if (item.capability && !hasCapability(role, item.capability)) return false;
    return true;
  });
}

export function homeFor(role: Role): string {
  switch (role) {
    case Role.STUDENT:
      return "/app";
    case Role.FACULTY:
      return "/students";
    default:
      return "/verifications";
  }
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.STUDENT]: "Student",
  [Role.FACULTY]: "Faculty",
  [Role.MOD]: "Moderator",
  [Role.ADMIN]: "Administrator",
};

export function accountPathFor(role: Role): string {
  return role === Role.STUDENT ? "/app" : "/profile";
}

export function activeNavPath(
  pathname: string,
  items: readonly NavItem[],
): string | null {
  let best: NavItem | null = null;

  for (const item of items) {
    const matches =
      pathname === item.to ||
      (item.nested && pathname.startsWith(`${item.to}/`));
    if (!matches) continue;
    if (!best || item.to.length > best.to.length) best = item;
  }

  return best?.to ?? null;
}
