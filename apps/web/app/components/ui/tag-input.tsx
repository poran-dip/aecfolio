import { X } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { cn } from "~/lib/utils";
import { controlTone } from "./input";

export function TagInput({
  value,
  onChange,
  onBlur,
  placeholder = "Type and press Enter",
  id,
  "aria-describedby": describedBy,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  placeholder?: string;
  id?: string;
  "aria-describedby"?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const tag = raw.trim().replace(/,$/, "").trim();
    if (!tag) return;
    if (value.some((existing) => existing.toLowerCase() === tag.toLowerCase()))
      return;
    onChange([...value, tag]);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit(draft);
      setDraft("");
      return;
    }

    if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-surface-raised px-2 py-1.5 shadow-xs",
        controlTone.normal,
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-surface-sunken py-0.5 pr-1 pl-2 text-xs text-ink"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(value.filter((item) => item !== tag))}
            className="inline-flex size-4 cursor-pointer items-center justify-center rounded-full text-ink-faint hover:bg-line hover:text-ink"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      <input
        id={id}
        aria-describedby={describedBy}
        value={draft}
        placeholder={value.length === 0 ? placeholder : ""}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (draft.trim()) {
            commit(draft);
            setDraft("");
          }
          onBlur?.();
        }}
        className="min-w-32 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
      />
    </div>
  );
}
