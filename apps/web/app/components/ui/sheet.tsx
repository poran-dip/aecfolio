import { Dialog as Primitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

export const Sheet = Primitive.Root;
export const SheetTrigger = Primitive.Trigger;
export const SheetClose = Primitive.Close;
export const SheetTitle = Primitive.Title;
export const SheetDescription = Primitive.Description;

const sides = {
  left: "inset-y-0 left-0 border-r data-[state=open]:animate-slide-in-left data-[state=closed]:animate-slide-out-left",
  right:
    "inset-y-0 right-0 border-l data-[state=open]:animate-slide-in-right data-[state=closed]:animate-slide-out-right",
} as const;

export function SheetContent({
  side = "left",
  className,
  overlayClassName,
  children,
  ...props
}: ComponentProps<typeof Primitive.Content> & {
  side?: keyof typeof sides;
  overlayClassName?: string;
}) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-overlay",
          "data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out",
          overlayClassName,
        )}
      />
      <Primitive.Content
        className={cn(
          "fixed z-50 flex w-72 max-w-[85vw] flex-col border-line bg-surface-raised shadow-lg",
          sides[side],
          className,
        )}
        {...props}
      >
        {children}
      </Primitive.Content>
    </Primitive.Portal>
  );
}
