import { Markdown } from "@aecfolio/ui";
import { Bold, Eye, Italic, Link2, List, Pencil } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { type ControlTone, controlBase, controlTone } from "./input";

type Wrap = { before: string; after: string; placeholder: string };

const TOOLS: {
  key: string;
  label: string;
  icon: typeof Bold;
  wrap?: Wrap;
  linePrefix?: string;
}[] = [
  {
    key: "bold",
    label: "Bold",
    icon: Bold,
    wrap: { before: "**", after: "**", placeholder: "bold text" },
  },
  {
    key: "italic",
    label: "Italic",
    icon: Italic,
    wrap: { before: "_", after: "_", placeholder: "italic text" },
  },
  {
    key: "link",
    label: "Link",
    icon: Link2,
    wrap: { before: "[", after: "](https://)", placeholder: "link text" },
  },
  { key: "list", label: "Bullet list", icon: List, linePrefix: "- " },
];

export function MarkdownEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  rows = 5,
  tone = "normal",
  id,
  "aria-describedby": describedBy,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  rows?: number;
  tone?: ControlTone;
  id?: string;
  "aria-describedby"?: string;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  function apply(tool: (typeof TOOLS)[number]) {
    const input = area.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = value.slice(start, end);

    let next: string;
    let caret: [number, number];

    if (tool.linePrefix) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = end === start ? start : end;
      const block = value.slice(lineStart, lineEnd) || "";
      const prefixed = block
        .split("\n")
        .map((line) =>
          line.startsWith(tool.linePrefix as string)
            ? line
            : `${tool.linePrefix}${line}`,
        )
        .join("\n");
      next = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
      caret = [lineStart + prefixed.length, lineStart + prefixed.length];
    } else if (tool.wrap) {
      const body = selected || tool.wrap.placeholder;
      next =
        value.slice(0, start) +
        tool.wrap.before +
        body +
        tool.wrap.after +
        value.slice(end);
      const bodyStart = start + tool.wrap.before.length;
      caret = [bodyStart, bodyStart + body.length];
    } else {
      return;
    }

    onChange(next);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(caret[0], caret[1]);
    });
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border bg-surface-raised shadow-xs",
        controlTone[tone],
      )}
    >
      <div className="flex items-center gap-0.5 border-b border-line bg-surface px-1.5 py-1">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.key}
              type="button"
              title={tool.label}
              aria-label={tool.label}
              disabled={preview}
              onClick={() => apply(tool)}
              className="inline-flex size-7 cursor-pointer items-center justify-center rounded text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink disabled:opacity-40"
            >
              <Icon className="size-3.5" />
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setPreview((on) => !on)}
          className="ml-auto inline-flex h-7 cursor-pointer items-center gap-1.5 rounded px-2 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          {preview ? (
            <Pencil className="size-3.5" />
          ) : (
            <Eye className="size-3.5" />
          )}
          {preview ? "Edit" : "Preview"}
        </button>
      </div>

      {preview ? (
        <div className="min-h-24 p-3 text-sm">
          {value.trim() ? (
            <Markdown className="text-ink [&_a]:text-primary-text [&_a]:underline [&_li]:mb-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
              {value}
            </Markdown>
          ) : (
            <p className="text-ink-faint">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <textarea
          ref={area}
          id={id}
          aria-describedby={describedBy}
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={cn(
            controlBase,
            "h-auto resize-y border-0 py-2 leading-relaxed shadow-none focus:outline-none",
          )}
        />
      )}
    </div>
  );
}
