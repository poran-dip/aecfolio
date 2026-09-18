import type { VerificationStatus } from "@aecfolio/shared";
import { VerificationStatus as Status } from "@aecfolio/shared";
import { FileText } from "lucide-react";
import type { ReactNode } from "react";
import { ClaimStatusBadge } from "~/components/app/status-badge";
import { Checkbox } from "~/components/ui/checkbox";
import { type ClaimKind, proofHref } from "~/lib/claims";
import { formatDate } from "~/lib/format";
import { usePublicApiUrl } from "~/lib/public-env";
import { cn } from "~/lib/utils";

export type ClaimView = {
  id: string;
  kind: ClaimKind;
  title: string;
  detail: string | null;
  status: VerificationStatus;
  reviewedAt?: string | Date | null;
  reviewer?: { id: string; name: string } | null;
  rejectionReason?: string | null;
  hasProof?: boolean;
};

export function ClaimCard({
  claim,
  selected,
  onSelectedChange,
  onOpen,
  active,
  actions,
  children,
}: {
  claim: ClaimView;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  onOpen?: () => void;
  active?: boolean;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const apiUrl = usePublicApiUrl();
  const proof = claim.hasProof ? proofHref(apiUrl, claim.kind, claim.id) : null;

  return (
    <div
      className={cn(
        "rounded-xl border bg-surface-raised p-4 shadow-xs transition-colors",
        active ? "border-primary bg-primary-surface/40" : "border-line",
      )}
    >
      <div className="flex items-start gap-3">
        {onSelectedChange && (
          <Checkbox
            checked={selected}
            onCheckedChange={(next) => onSelectedChange(next === true)}
            aria-label={`Select ${claim.title}`}
            className="mt-1"
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {onOpen ? (
              <button
                type="button"
                onClick={onOpen}
                className="cursor-pointer text-left font-medium text-ink hover:text-primary-text"
              >
                {claim.title}
              </button>
            ) : (
              <span className="font-medium text-ink">{claim.title}</span>
            )}
            <ClaimStatusBadge status={claim.status} size="sm" />
          </div>

          {claim.detail && (
            <p className="line-clamp-2 text-sm text-ink-muted">
              {claim.detail}
            </p>
          )}

          {claim.status === Status.VERIFIED && claim.reviewedAt && (
            <p className="text-xs text-ink-faint">
              Verified{claim.reviewer ? ` by ${claim.reviewer.name}` : ""} on{" "}
              {formatDate(claim.reviewedAt)}
            </p>
          )}

          {claim.status === Status.REJECTED && claim.rejectionReason && (
            <p className="rounded-lg bg-rejected-surface px-2.5 py-1.5 text-xs text-rejected">
              Rejected: {claim.rejectionReason}
            </p>
          )}

          {proof && (
            <a
              href={proof}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-primary-text hover:underline"
            >
              <FileText className="size-3.5" />
              Open proof
            </a>
          )}

          {children}
        </div>

        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
    </div>
  );
}
