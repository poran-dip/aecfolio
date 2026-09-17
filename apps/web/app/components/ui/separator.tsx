import { Separator as Primitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

export function Separator({
  orientation = "horizontal",
  className,
  ...props
}: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      orientation={orientation}
      className={cn(
        "shrink-0 bg-line",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}
