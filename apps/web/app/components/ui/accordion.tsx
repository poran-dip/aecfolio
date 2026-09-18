import { ChevronDown } from "lucide-react";
import { Accordion as Primitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "~/lib/utils";

export const Accordion = Primitive.Root;

export function AccordionItem({
  className,
  ...props
}: ComponentProps<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-surface-raised shadow-xs",
        "data-[state=open]:border-line-strong",
        className,
      )}
      {...props}
    />
  );
}

export function AccordionTrigger({
  title,
  subtitle,
  badge,
  actions,
  className,
  ...props
}: Omit<ComponentProps<typeof Primitive.Trigger>, "title"> & {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 pr-3">
      <Primitive.Header className="flex min-w-0 flex-1">
        <Primitive.Trigger
          className={cn(
            "group flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface",
            className,
          )}
          {...props}
        >
          <ChevronDown className="size-4 shrink-0 text-ink-faint transition-transform group-data-[state=open]:rotate-180" />

          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-ink">
              {title}
            </span>
            {subtitle && (
              <span className="truncate text-xs text-ink-subtle">
                {subtitle}
              </span>
            )}
          </span>

          {badge}
        </Primitive.Trigger>
      </Primitive.Header>

      {actions && (
        <div className="flex shrink-0 items-center gap-1">{actions}</div>
      )}
    </div>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Content
      className={cn(
        "overflow-hidden data-[state=open]:animate-fade-in",
        className,
      )}
      {...props}
    >
      <div className="border-t border-line p-4">{children}</div>
    </Primitive.Content>
  );
}
