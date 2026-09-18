import {
  type CvDateInput,
  composeDate,
  decomposeDate,
  isYearMonthOrdered,
  type YearMonth,
} from "@aecfolio/shared";
import { TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { CheckboxField } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/field";
import { Input } from "~/components/ui/input";

export function DateField({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<CvDateInput>(() => decomposeDate(value));
  const custom = typeof draft.custom === "string";

  function emit(next: CvDateInput) {
    setDraft(next);
    onChange(composeDate(next));
  }

  const ordered = isYearMonthOrdered(draft.start, draft.end);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-medium text-ink">{label}</legend>

      <div className="flex flex-wrap items-center gap-4">
        <CheckboxField
          checked={!custom}
          onCheckedChange={(on) => {
            if (on !== true) return;
            emit({ ...decomposeDate(null), start: draft.start ?? null });
          }}
        >
          Pick dates
        </CheckboxField>

        <CheckboxField
          checked={custom}
          onCheckedChange={(on) => {
            if (on !== true) return;
            emit({
              custom: composeDate(draft) ?? "",
              start: null,
              end: null,
              present: false,
            });
          }}
        >
          Custom text
        </CheckboxField>
      </div>

      {custom ? (
        <Input
          id={id}
          value={draft.custom ?? ""}
          placeholder="Summer 2025"
          onChange={(event) =>
            emit({ custom: event.target.value, start: null, end: null })
          }
          onBlur={onBlur}
          className="sm:max-w-xs"
        />
      ) : (
        <div className="flex flex-wrap items-end gap-4">
          <MonthField
            label="Start"
            value={draft.start ?? null}
            onChange={(start) => emit({ ...draft, start })}
            onBlur={onBlur}
          />

          {!draft.present && (
            <MonthField
              label="End"
              value={draft.end ?? null}
              onChange={(end) => emit({ ...draft, end })}
              onBlur={onBlur}
            />
          )}

          <CheckboxField
            className="h-9"
            checked={Boolean(draft.present)}
            onCheckedChange={(on) =>
              emit({ ...draft, present: on === true, end: null })
            }
          >
            Present
          </CheckboxField>
        </div>
      )}

      {!custom && !ordered && (
        <p className="flex items-center gap-1.5 text-xs text-danger-text">
          <TriangleAlert className="size-3.5 shrink-0" />
          The end is before the start.
        </p>
      )}

      <p className="text-xs text-ink-faint">
        {composeDate(draft) ?? "No date set"}
      </p>
    </fieldset>
  );
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function MonthField({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  value: YearMonth | null;
  onChange: (value: YearMonth | null) => void;
  onBlur?: () => void;
}) {
  const id = useId();
  const year = new Date().getFullYear();

  function update(patch: Partial<YearMonth>) {
    const next = {
      year: patch.year ?? value?.year ?? year,
      month: patch.month ?? value?.month ?? 1,
    };
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-ink-subtle">
        {label}
      </Label>
      <div className="flex gap-2">
        <select
          id={id}
          value={value?.month ?? ""}
          onChange={(event) => update({ month: Number(event.target.value) })}
          onBlur={onBlur}
          className="h-9 cursor-pointer rounded-md border border-line-strong bg-surface-raised px-2 text-sm text-ink shadow-xs"
        >
          <option value="">Month</option>
          {MONTHS.map((month, index) => (
            <option key={month} value={index + 1}>
              {month}
            </option>
          ))}
        </select>

        <Input
          type="number"
          inputMode="numeric"
          min={1950}
          max={year + 10}
          placeholder="Year"
          aria-label={`${label} year`}
          value={value?.year ?? ""}
          onChange={(event) => {
            const next = event.target.value;
            if (!next) return onChange(null);
            update({ year: Number(next) });
          }}
          onBlur={onBlur}
          className="w-24"
        />
      </div>
    </div>
  );
}
