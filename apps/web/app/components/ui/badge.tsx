import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

const variants = {
  neutral: "bg-surface-sunken text-ink-muted",
  outline: "border border-line-strong text-ink-muted",
  primary: "bg-primary-surface text-primary-text",
  verified: "bg-verified-surface text-verified",
  pending: "bg-pending-surface text-pending",
  rejected: "bg-rejected-surface text-rejected",
  danger: "bg-danger-surface text-danger-text",
} as const;

const sizes = {
  sm: "h-5 gap-1 px-1.5 text-xs",
  md: "h-6 gap-1.5 px-2 text-xs",
} as const;

export type BadgeVariant = keyof typeof variants;

export type BadgeProps = ComponentProps<"span"> & {
  variant?: BadgeVariant;
  size?: keyof typeof sizes;
};

export function Badge({
  variant = "neutral",
  size = "md",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full font-medium whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

/** A small round count for nav items and tabs. */
export function CountBadge({
  count,
  max = 99,
  className,
  ...props
}: ComponentProps<"span"> & { count: number; max?: number }) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-ink tabular-nums",
        className,
      )}
      {...props}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}
