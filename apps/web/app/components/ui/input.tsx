import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

export const controlBase =
  "h-9 w-full rounded-md border bg-surface-raised px-3 text-sm text-ink shadow-xs transition-colors placeholder:text-ink-faint disabled:cursor-not-allowed disabled:opacity-50";

export const controlTone = {
  normal: "border-line-strong",
  invalid: "border-danger bg-danger-surface",
} as const;

export type ControlTone = keyof typeof controlTone;

export type InputProps = Omit<ComponentProps<"input">, "size"> & {
  tone?: ControlTone;
};

export function Input({ tone = "normal", className, ...props }: InputProps) {
  return (
    <input
      className={cn(controlBase, controlTone[tone], className)}
      aria-invalid={tone === "invalid" || undefined}
      {...props}
    />
  );
}

export function Textarea({
  tone = "normal",
  className,
  rows = 4,
  ...props
}: ComponentProps<"textarea"> & { tone?: ControlTone }) {
  return (
    <textarea
      rows={rows}
      className={cn(
        controlBase,
        controlTone[tone],
        "h-auto py-2 leading-relaxed",
        className,
      )}
      aria-invalid={tone === "invalid" || undefined}
      {...props}
    />
  );
}
