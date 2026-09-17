import { Tooltip as Primitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "~/lib/utils";

export const TooltipProvider = Primitive.Provider;
export const TooltipRoot = Primitive.Root;
export const TooltipTrigger = Primitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 8,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-md bg-ink px-2 py-1 text-xs font-medium text-ink-inverse shadow-md",
          "data-[state=delayed-open]:animate-fade-in",
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  );
}

/** The common case: wrap a control, label it on hover and focus. */
export function Tooltip({
  label,
  side = "right",
  children,
  ...props
}: Omit<ComponentProps<typeof Primitive.Root>, "children"> & {
  label: ReactNode;
  side?: ComponentProps<typeof Primitive.Content>["side"];
  children: ReactNode;
}) {
  return (
    <Primitive.Root {...props}>
      <Primitive.Trigger asChild>{children}</Primitive.Trigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Primitive.Root>
  );
}
