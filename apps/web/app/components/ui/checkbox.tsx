import { Check, Minus } from "lucide-react";
import { Checkbox as Primitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "~/lib/utils";

const BOX =
  "flex size-4 shrink-0 items-center justify-center rounded-xs border border-line-strong bg-surface-raised shadow-xs transition-colors group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary group-data-[state=indeterminate]:border-primary group-data-[state=indeterminate]:bg-primary";

export function CheckboxField({
  children,
  className,
  ...props
}: ComponentProps<typeof Primitive.Root> & { children: ReactNode }) {
  return (
    <Primitive.Root
      className={cn(
        "group flex cursor-pointer items-center gap-2 text-sm text-ink-muted disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span className={BOX}>
        <Primitive.Indicator className="text-primary-ink">
          {props.checked === "indeterminate" ? (
            <Minus className="size-3" strokeWidth={3} />
          ) : (
            <Check className="size-3" strokeWidth={3} />
          )}
        </Primitive.Indicator>
      </span>
      {children}
    </Primitive.Root>
  );
}

export function Checkbox({
  className,
  ...props
}: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      className={cn(
        "flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-xs border border-line-strong bg-surface-raised shadow-xs transition-colors",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <Primitive.Indicator className="text-primary-ink">
        {props.checked === "indeterminate" ? (
          <Minus className="size-3" strokeWidth={3} />
        ) : (
          <Check className="size-3" strokeWidth={3} />
        )}
      </Primitive.Indicator>
    </Primitive.Root>
  );
}
