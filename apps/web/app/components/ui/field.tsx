import { TriangleAlert } from "lucide-react";
import { Label as LabelPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { cn } from "~/lib/utils";

export function Label({
  className,
  ...props
}: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn("text-sm font-medium text-ink", className)}
      {...props}
    />
  );
}

type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  children: (props: { id: string; "aria-describedby"?: string }) => ReactNode;
};

export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
      </Label>

      {children({
        id,
        "aria-describedby": message ? messageId : undefined,
      })}

      {message && (
        <p
          id={messageId}
          className={cn(
            "flex items-start gap-1.5 text-xs",
            error ? "text-danger-text" : "text-ink-subtle",
          )}
        >
          {error && <TriangleAlert className="mt-px size-3.5 shrink-0" />}
          {message}
        </p>
      )}
    </div>
  );
}
