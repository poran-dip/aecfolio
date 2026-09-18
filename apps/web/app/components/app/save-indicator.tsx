import { Check, CloudUpload, RotateCw, TriangleAlert } from "lucide-react";
import type { AutosaveStatus } from "~/lib/autosave";
import { cn } from "~/lib/utils";

export function SaveIndicator({
  status,
  onRetry,
  className,
}: {
  status: AutosaveStatus;
  onRetry?: () => void;
  className?: string;
}) {
  if (status.state === "clean") return null;

  if (status.state === "error") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-danger-text",
          className,
        )}
      >
        <TriangleAlert className="size-3.5" />
        Couldn&apos;t save
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex cursor-pointer items-center gap-1 font-medium underline"
          >
            <RotateCw className="size-3" />
            Retry
          </button>
        )}
      </span>
    );
  }

  const copy = {
    dirty: { icon: CloudUpload, text: "Unsaved" },
    saving: { icon: CloudUpload, text: "Saving…" },
    saved: { icon: Check, text: "Saved" },
  }[status.state];

  const Icon = copy.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        status.state === "saved" ? "text-verified" : "text-ink-faint",
        className,
      )}
      aria-live="polite"
    >
      <Icon className="size-3.5" />
      {copy.text}
    </span>
  );
}

export function summarise(statuses: AutosaveStatus[]): AutosaveStatus {
  if (statuses.some((s) => s.state === "error"))
    return statuses.find((s) => s.state === "error") as AutosaveStatus;
  if (statuses.some((s) => s.state === "saving")) return { state: "saving" };
  if (statuses.some((s) => s.state === "dirty")) return { state: "dirty" };
  if (statuses.some((s) => s.state === "saved")) return { state: "saved" };
  return { state: "clean" };
}
