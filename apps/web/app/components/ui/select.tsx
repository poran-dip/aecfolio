import { Check, ChevronDown } from "lucide-react";
import { Select as Primitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "~/lib/utils";
import { type ControlTone, controlBase, controlTone } from "./input";

export const SelectRoot = Primitive.Root;
export const SelectValue = Primitive.Value;

export function SelectTrigger({
  tone = "normal",
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.Trigger> & { tone?: ControlTone }) {
  return (
    <Primitive.Trigger
      className={cn(
        controlBase,
        controlTone[tone],
        "inline-flex cursor-pointer items-center justify-between gap-2 text-left data-placeholder:text-ink-faint",
        className,
      )}
      {...props}
    >
      {children}
      <Primitive.Icon asChild>
        <ChevronDown className="size-4 shrink-0 text-ink-faint" />
      </Primitive.Icon>
    </Primitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        position="popper"
        sideOffset={6}
        className={cn(
          "z-50 max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden rounded-lg border border-line bg-surface-raised shadow-lg",
          "data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
          className,
        )}
        {...props}
      >
        <Primitive.Viewport className="p-1">{children}</Primitive.Viewport>
      </Primitive.Content>
    </Primitive.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      className={cn(
        "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-ink outline-none select-none",
        "data-highlighted:bg-surface-sunken data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <Primitive.ItemText>{children}</Primitive.ItemText>
      <Primitive.ItemIndicator>
        <Check className="size-4 text-primary" />
      </Primitive.ItemIndicator>
    </Primitive.Item>
  );
}

export type SelectOption = { value: string; label: ReactNode };

export const ANY_VALUE = "__any__";

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Any",
  anyLabel,
  tone,
  className,
  id,
  "aria-describedby": describedBy,
}: {
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  anyLabel?: string;
  tone?: ControlTone;
  className?: string;
  id?: string;
  "aria-describedby"?: string;
}) {
  return (
    <SelectRoot
      value={value ?? (anyLabel ? ANY_VALUE : undefined)}
      onValueChange={(next) =>
        onValueChange(next === ANY_VALUE ? undefined : next)
      }
    >
      <SelectTrigger
        tone={tone}
        className={className}
        id={id}
        aria-describedby={describedBy}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {anyLabel && <SelectItem value={ANY_VALUE}>{anyLabel}</SelectItem>}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}
