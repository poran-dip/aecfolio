import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

type SectionProps = ComponentProps<"section"> & {
  emphasis?: boolean;
};

export function Section({
  emphasis = false,
  className,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        emphasis
          ? "flex items-center bg-primary-surface-strong lg:min-h-[calc(100svh-4rem)]"
          : "odd:bg-primary-surface even:bg-background",
        className,
      )}
      {...props}
    />
  );
}
