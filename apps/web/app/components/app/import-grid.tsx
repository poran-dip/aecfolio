import { Trash2, TriangleAlert } from "lucide-react";
import { useCallback, useRef } from "react";
import { IconButton } from "~/components/ui/icon-button";
import { BRANCHES, COURSES } from "~/lib/import/parse-students";
import {
  FIELD_LABELS,
  IMPORT_FIELDS,
  type ImportField,
  type ParsedRow,
} from "~/lib/import/types";
import { cn } from "~/lib/utils";

const WIDTHS: Record<ImportField, string> = {
  name: "min-w-44",
  email: "min-w-56",
  rollNo: "min-w-28",
  course: "min-w-24",
  branch: "min-w-24",
  semester: "min-w-16",
  admissionYear: "min-w-24",
};

const SUGGESTIONS: Partial<Record<ImportField, readonly string[]>> = {
  course: COURSES,
  branch: BRANCHES,
};

export function ImportGrid({
  rows,
  onChange,
  onRemove,
  disabled,
}: {
  rows: ParsedRow[];
  onChange: (id: string, field: ImportField, value: string) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);

  const focusCell = useCallback((row: number, column: number) => {
    const selector = `[data-cell="${row}-${column}"]`;
    const cell = container.current?.querySelector<HTMLInputElement>(selector);
    cell?.focus();
    cell?.select();
  }, []);

  function onKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    row: number,
    column: number,
  ) {
    const lastColumn = IMPORT_FIELDS.length - 1;
    const lastRow = rows.length - 1;
    const input = event.currentTarget;
    const atStart = input.selectionStart === 0 && input.selectionEnd === 0;
    const atEnd =
      input.selectionStart === input.value.length &&
      input.selectionEnd === input.value.length;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusCell(Math.min(row + 1, lastRow), column);
        break;
      case "Enter":
        event.preventDefault();
        focusCell(
          row === lastRow ? row : row + 1,
          row === lastRow ? column : column,
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        focusCell(Math.max(row - 1, 0), column);
        break;
      case "ArrowLeft":
        if (!atStart) return;
        event.preventDefault();
        if (column > 0) focusCell(row, column - 1);
        else if (row > 0) focusCell(row - 1, lastColumn);
        break;
      case "ArrowRight":
        if (!atEnd) return;
        event.preventDefault();
        if (column < lastColumn) focusCell(row, column + 1);
        else if (row < lastRow) focusCell(row + 1, 0);
        break;
      default:
        break;
    }
  }

  return (
    <div
      ref={container}
      className="overflow-x-auto rounded-xl border border-line bg-surface-raised"
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-surface text-left text-xs text-ink-faint">
            <th scope="col" className="w-10 px-2 py-2 font-medium">
              #
            </th>
            {IMPORT_FIELDS.map((field) => (
              <th key={field} className="px-2 py-2 font-medium" scope="col">
                {FIELD_LABELS[field]}
              </th>
            ))}
            <th scope="col" className="w-10 px-2 py-2">
              <span className="sr-only">Remove</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const invalid = row._errors.length > 0;

            return (
              <tr
                key={row._id}
                className={cn(
                  "border-b border-line last:border-b-0",
                  invalid && "bg-danger-surface/40",
                )}
              >
                <td className="px-2 py-1 align-middle text-xs text-ink-faint tabular-nums">
                  <span className="flex items-center gap-1">
                    {rowIndex + 1}
                    {invalid && (
                      <TriangleAlert
                        className="size-3 text-danger"
                        aria-label={row._errors.join(". ")}
                      />
                    )}
                  </span>
                </td>

                {IMPORT_FIELDS.map((field, columnIndex) => (
                  <td key={field} className="p-0 align-middle">
                    <input
                      data-cell={`${rowIndex}-${columnIndex}`}
                      list={SUGGESTIONS[field] ? `import-${field}` : undefined}
                      value={row[field]}
                      disabled={disabled}
                      aria-label={`${FIELD_LABELS[field]}, row ${rowIndex + 1}`}
                      onChange={(event) =>
                        onChange(row._id, field, event.target.value)
                      }
                      onKeyDown={(event) =>
                        onKeyDown(event, rowIndex, columnIndex)
                      }
                      className={cn(
                        "h-9 w-full bg-transparent px-2 text-sm text-ink outline-none focus:bg-primary-surface/60 focus:inset-ring-2 focus:inset-ring-primary disabled:opacity-50",
                        WIDTHS[field],
                      )}
                    />
                  </td>
                ))}

                <td className="px-1 align-middle">
                  <IconButton
                    label={`Remove row ${rowIndex + 1}`}
                    size="sm"
                    variant="danger"
                    disabled={disabled}
                    onClick={() => onRemove(row._id)}
                  >
                    <Trash2 />
                  </IconButton>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {Object.entries(SUGGESTIONS).map(([field, values]) => (
        <datalist key={field} id={`import-${field}`}>
          {values?.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
      ))}
    </div>
  );
}
