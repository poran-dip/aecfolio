import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { Spinner } from "./spinner";

export { toast } from "sonner";

const base =
  "flex w-full items-start gap-3 rounded-lg border p-3 text-sm shadow-md bg-surface-raised border-line";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      duration={5000}
      gap={8}
      offset={16}
      icons={{
        success: <CircleCheck className="size-4 text-verified" />,
        error: <CircleAlert className="size-4 text-danger" />,
        warning: <TriangleAlert className="size-4 text-accent" />,
        info: <Info className="size-4 text-primary" />,
        loading: <Spinner size="sm" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: base,
          content: "flex flex-col gap-0.5",
          title: "font-medium text-ink",
          description: "text-ink-muted",
          icon: "mt-0.5 shrink-0",
          error: "border-danger-line bg-danger-surface",
          success: "border-primary-line bg-verified-surface",
          actionButton:
            "ml-auto h-7 shrink-0 cursor-pointer rounded-md bg-primary px-2.5 text-xs font-medium text-primary-ink",
          cancelButton:
            "h-7 shrink-0 cursor-pointer rounded-md bg-surface-sunken px-2.5 text-xs font-medium text-ink-muted",
          closeButton:
            "cursor-pointer rounded-md border border-line bg-surface-raised text-ink-faint",
        },
      }}
      {...props}
    />
  );
}
