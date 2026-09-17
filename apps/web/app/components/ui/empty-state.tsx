import type { ComponentProps, ReactNode } from "react";
import type { NavIcon } from "~/lib/nav";
import { cn } from "~/lib/utils";

type EmptyStateProps = Omit<ComponentProps<"div">, "title"> & {
  icon?: NavIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line-strong px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      {Icon && (
        <span className="flex size-10 items-center justify-center rounded-full bg-surface-sunken text-ink-faint">
          <Icon className="size-5" />
        </span>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-ink">{title}</p>
        {description && (
          <p className="max-w-sm text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
