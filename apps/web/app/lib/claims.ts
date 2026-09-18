import { VerificationStatus } from "@aecfolio/shared";

export const CLAIM_KINDS = [
  "results",
  "achievements",
  "certifications",
] as const;

export type ClaimKind = (typeof CLAIM_KINDS)[number];

export const CLAIM_KIND_LABELS: Record<ClaimKind, string> = {
  results: "Results",
  achievements: "Achievements",
  certifications: "Certifications",
};

export function proofHref(
  apiUrl: string,
  kind: ClaimKind,
  id: string,
): string | null {
  if (kind === "results") return null;
  return `${apiUrl}/api/${kind}/${id}/proof`;
}

export function describeReview(
  result: { reviewed: string[]; skipped: { id: string; reason: string }[] },
  status: string,
): string {
  const verb = status === VerificationStatus.VERIFIED ? "Verified" : "Rejected";
  const done = `${verb} ${result.reviewed.length}`;

  if (result.skipped.length === 0) return done;
  return `${done}, skipped ${result.skipped.length} (${result.skipped[0].reason})`;
}
