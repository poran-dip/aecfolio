import { StudentStatus, VerificationStatus } from "@aecfolio/shared";
import {
  Badge,
  type BadgeProps,
  type BadgeVariant,
} from "~/components/ui/badge";

const CLAIM: Record<VerificationStatus, { label: string; tone: BadgeVariant }> =
  {
    [VerificationStatus.PENDING]: { label: "Pending", tone: "pending" },
    [VerificationStatus.VERIFIED]: { label: "Verified", tone: "verified" },
    [VerificationStatus.REJECTED]: { label: "Rejected", tone: "rejected" },
  };

const STUDENT: Record<StudentStatus, { label: string; tone: BadgeVariant }> = {
  [StudentStatus.ACTIVE]: { label: "Active", tone: "verified" },
  [StudentStatus.ALUMNI]: { label: "Alumni", tone: "primary" },
  [StudentStatus.SUSPENDED]: { label: "Suspended", tone: "danger" },
  [StudentStatus.LEFT]: { label: "Left", tone: "neutral" },
};

export function ClaimStatusBadge({
  status,
  ...props
}: Omit<BadgeProps, "variant"> & { status: VerificationStatus }) {
  const { label, tone } = CLAIM[status];
  return (
    <Badge variant={tone} {...props}>
      {label}
    </Badge>
  );
}

export function StudentStatusBadge({
  status,
  ...props
}: Omit<BadgeProps, "variant"> & { status: StudentStatus }) {
  const { label, tone } = STUDENT[status];
  return (
    <Badge variant={tone} {...props}>
      {label}
    </Badge>
  );
}
