import { X } from "lucide-react";
import { Dialog as Primitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "~/lib/utils";
import { Button } from "./button";
import { IconButton } from "./icon-button";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-overlay",
          "data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out",
        )}
      />
      <Primitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex w-[min(32rem,calc(100vw-2rem))] max-h-[calc(100svh-4rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-line bg-surface-raised shadow-lg",
          "data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
          className,
        )}
        {...props}
      >
        {children}
      </Primitive.Content>
    </Primitive.Portal>
  );
}

export function DialogHeader({
  title,
  description,
  closeLabel = "Close",
}: {
  title: ReactNode;
  description?: ReactNode;
  closeLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line p-5">
      <div className="flex flex-col gap-1">
        <Primitive.Title className="font-heading text-base font-semibold text-ink">
          {title}
        </Primitive.Title>
        {description ? (
          <Primitive.Description className="text-sm text-ink-muted">
            {description}
          </Primitive.Description>
        ) : (
          <Primitive.Description className="sr-only">
            {typeof title === "string" ? title : closeLabel}
          </Primitive.Description>
        )}
      </div>
      <Primitive.Close asChild>
        <IconButton label={closeLabel} size="sm">
          <X />
        </IconButton>
      </Primitive.Close>
    </div>
  );
}

export function DialogBody({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("flex-1 overflow-y-auto p-5", className)} {...props} />
  );
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t border-line p-4",
        className,
      )}
      {...props}
    />
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader title={title} description={description} />
        {children && <DialogBody>{children}</DialogBody>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" disabled={busy}>
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            variant={danger ? "danger" : "primary"}
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
