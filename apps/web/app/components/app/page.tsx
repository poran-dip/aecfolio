import type { ComponentProps, ReactNode } from "react";
import { cn } from "~/lib/utils";

export function Page({
  description,
  actions,
  className,
  children,
  ...props
}: Omit<ComponentProps<"div">, "title"> & {
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8",
        className,
      )}
      {...props}
    >
      {(description || actions) && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {description && (
            <p className="max-w-2xl text-sm text-ink-muted">{description}</p>
          )}
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
