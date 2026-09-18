import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { type PageInfo, pageCount, rangeOf, withParams } from "~/lib/query";
import { cn } from "~/lib/utils";

export function Pagination({
  info,
  className,
  unit = "results",
}: {
  info: PageInfo;
  className?: string;
  unit?: string;
}) {
  const [params] = useSearchParams();
  const pages = pageCount(info);
  const { from, to } = rangeOf(info);

  if (info.total === 0) return null;

  const previousTo = withParams(params, { page: info.page - 1 });
  const nextTo = withParams(params, { page: info.page + 1 });
  const hasPrevious = info.page > 1;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-t border-line pt-4",
        className,
      )}
    >
      <p className="text-sm text-ink-subtle tabular-nums">
        {from}–{to} of {info.total} {unit}
      </p>

      {pages > 1 && (
        <div className="flex items-center gap-1">
          <PageLink to={previousTo} disabled={!hasPrevious} label="Previous">
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Previous</span>
          </PageLink>
          <span className="px-2 text-sm text-ink-subtle tabular-nums">
            {info.page} / {pages}
          </span>
          <PageLink to={nextTo} disabled={!info.hasNext} label="Next">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="size-4" />
          </PageLink>
        </div>
      )}
    </div>
  );
}

function PageLink({
  to,
  disabled,
  label,
  children,
}: {
  to: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const classes =
    "inline-flex h-8 items-center gap-1 rounded-md border border-line-strong bg-surface-raised px-2.5 text-sm font-medium text-ink shadow-xs";

  if (disabled) {
    return (
      <span
        aria-disabled
        className={cn(classes, "pointer-events-none opacity-50")}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      to={to}
      aria-label={label}
      preventScrollReset={false}
      className={cn(classes, "hover:bg-surface-sunken")}
    >
      {children}
    </Link>
  );
}
