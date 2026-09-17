import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

const variants = {
  ghost:
    "text-ink-muted hover:bg-surface-sunken hover:text-ink active:bg-surface-sunken",
  outline:
    "border border-line-strong bg-surface-raised text-ink shadow-xs hover:bg-surface-sunken",
  danger: "text-danger hover:bg-danger-surface",
} as const;

const sizes = {
  sm: "size-7 rounded-md [&_svg]:size-4",
  md: "size-9 rounded-md [&_svg]:size-4",
  lg: "size-10 rounded-lg [&_svg]:size-5",
} as const;

export type IconButtonProps = ComponentProps<"button"> & {
  /** Required: the control has no visible text. */
  label: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  asChild?: boolean;
};

export function IconButton({
  label,
  variant = "ghost",
  size = "md",
  asChild = false,
  className,
  type,
  ...props
}: IconButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      type={asChild ? undefined : (type ?? "button")}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
