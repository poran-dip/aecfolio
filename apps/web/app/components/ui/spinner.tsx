import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

const sizes = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-6",
} as const;

export type SpinnerProps = Omit<ComponentProps<typeof LoaderCircle>, "size"> & {
  size?: keyof typeof sizes;
  label?: string;
};

export function Spinner({
  size = "md",
  className,
  label = "Loading",
  ...props
}: SpinnerProps) {
  return (
    <LoaderCircle
      role="status"
      aria-label={label}
      className={cn("animate-spin text-ink-faint", sizes[size], className)}
      {...props}
    />
  );
}
