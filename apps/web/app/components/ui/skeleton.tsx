import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-surface-sunken", className)}
      {...props}
    />
  );
}

/** Placeholder for a list of cards while a route's data loads. */
export function SkeletonList({
  count = 5,
  className,
  ...props
}: ComponentProps<"div"> & { count?: number }) {
  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}
