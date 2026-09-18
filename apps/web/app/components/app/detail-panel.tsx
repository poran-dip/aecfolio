import { X } from "lucide-react";
import { Dialog as Primitive } from "radix-ui";
import { type ReactNode, useEffect, useState } from "react";
import { EmptyState } from "~/components/ui/empty-state";
import { IconButton } from "~/components/ui/icon-button";
import type { NavIcon } from "~/lib/nav";
import { cn } from "~/lib/utils";

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 64rem)");
    const sync = () => setIsDesktop(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return isDesktop;
}

export function ListWithPanel({
  list,
  panel,
  open,
  onClose,
  panelTitle,
  emptyIcon,
  emptyTitle = "Nothing selected",
  emptyDescription,
  className,
}: {
  list: ReactNode;
  panel: ReactNode | null;
  open: boolean;
  onClose: () => void;
  panelTitle: string;
  emptyIcon?: NavIcon;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  className?: string;
}) {
  const isDesktop = useIsDesktop();

  return (
    <div className={cn("flex gap-6", className)}>
      <div className="min-w-0 flex-1">{list}</div>

      <aside aria-label={panelTitle} className="hidden w-96 shrink-0 lg:block">
        <div className="sticky top-20 max-h-[calc(100svh-6rem)] overflow-y-auto rounded-xl border border-line bg-surface-raised shadow-xs">
          {open && panel ? (
            panel
          ) : (
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle}
              description={emptyDescription}
              className="border-0"
            />
          )}
        </div>
      </aside>

      <Primitive.Root
        open={open && !isDesktop}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
      >
        <Primitive.Portal>
          <Primitive.Overlay
            className={cn(
              "fixed inset-0 z-50 bg-overlay lg:hidden",
              "data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out",
            )}
          />
          <Primitive.Content
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 flex max-h-[85svh] flex-col rounded-t-xl border-t border-line bg-surface-raised shadow-lg lg:hidden",
              "data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out",
            )}
          >
            <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
              <Primitive.Title className="font-heading text-base font-semibold text-ink">
                {panelTitle}
              </Primitive.Title>
              <Primitive.Close asChild>
                <IconButton label="Close" size="sm">
                  <X />
                </IconButton>
              </Primitive.Close>
            </div>
            <Primitive.Description className="sr-only">
              Details for the selected item.
            </Primitive.Description>
            <div className="flex-1 overflow-y-auto">{panel}</div>
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
    </div>
  );
}

export function PanelSection({
  title,
  children,
  className,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-line p-4 last:border-b-0", className)}>
      {title && (
        <h3 className="mb-2 text-xs font-medium tracking-wide text-ink-faint uppercase">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export function PanelRow({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1 text-sm">
      <dt className="shrink-0 text-ink-subtle">{label}</dt>
      <dd className="min-w-0 text-right text-ink">{children}</dd>
    </div>
  );
}
