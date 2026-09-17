import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

const variants = {
  primary:
    "bg-primary text-primary-ink shadow-xs hover:bg-primary-hover active:bg-primary-hover",
  secondary:
    "border border-line-strong bg-surface-raised text-ink shadow-xs hover:bg-surface-sunken",
  ghost:
    "border border-transparent text-ink hover:border-line-strong hover:bg-surface-raised",
  danger:
    "bg-danger text-danger-ink shadow-xs hover:bg-danger-hover active:bg-danger-hover",
} as const;

const sizes = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-sm",
  md: "h-9 gap-2 rounded-md px-3.5 text-sm",
  lg: "h-10 gap-2 rounded-lg px-4 text-sm",
} as const;

export type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  asChild?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  asChild = false,
  className,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      type={asChild ? undefined : (type ?? "button")}
      className={cn(
        "inline-flex shrink-0 cursor-pointer select-none items-center justify-center whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
