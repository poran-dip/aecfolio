import type { CvSectionPreference, CvTemplateOptions } from "@aecfolio/shared";
import type { CvData, CvOptionControl, TemplateManifest } from "@aecfolio/ui";
import { ChevronRight, Info } from "lucide-react";
import { useState } from "react";
import { SortableList } from "~/components/app/sortable-list";
import { Card, CardContent } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { sectionEntries, sectionKey, sectionLabel } from "~/lib/cv-arrange";
import { cn } from "~/lib/utils";

export function TemplatePicker({
  manifests,
  templateId,
  onSelect,
}: {
  manifests: TemplateManifest<unknown>[];
  templateId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 pt-5">
        <h2 className="font-heading text-base font-semibold text-ink">
          Template
        </h2>

        {manifests.map((manifest) => {
          const active = manifest.id === templateId;
          return (
            <button
              key={manifest.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(manifest.id)}
              className={cn(
                "cursor-pointer rounded-lg border px-3 py-2.5 text-left transition-colors",
                active
                  ? "border-primary bg-primary-surface"
                  : "border-line hover:border-line-strong",
              )}
            >
              <span className="block text-sm font-medium text-ink">
                {manifest.name}
              </span>
              <span className="mt-0.5 block text-xs text-ink-subtle">
                {manifest.description}
              </span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function SectionArranger({
  manifest,
  data,
  sections,
  onChange,
}: {
  manifest: TemplateManifest<unknown>;
  data: CvData;
  sections: CvSectionPreference[];
  onChange: (sections: CvSectionPreference[]) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const items = sections.map((section) => ({
    id: sectionKey(section),
    section,
  }));

  function reorder(next: typeof items) {
    onChange(next.map((item, order) => ({ ...item.section, order })));
  }

  function patch(key: string, change: Partial<CvSectionPreference>) {
    onChange(
      sections.map((section) =>
        sectionKey(section) === key
          ? ({ ...section, ...change } as CvSectionPreference)
          : section,
      ),
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-5">
        <div>
          <h2 className="font-heading text-base font-semibold text-ink">
            Sections
          </h2>
          <p className="mt-0.5 text-xs text-ink-subtle">
            Drag to reorder, or open one to arrange the entries inside it.
          </p>
        </div>

        <SortableList
          items={items}
          onReorder={reorder}
          renderItem={({ id, section }) => {
            const entries = sectionEntries(section, data);
            const note =
              section.type === "custom"
                ? undefined
                : manifest.sectionNotes?.[section.type];
            const open = expanded === id;

            return (
              <div className="flex flex-col gap-2 py-0.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={entries.length === 0 && !note}
                    onClick={() => setExpanded(open ? null : id)}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-left text-sm text-ink disabled:cursor-default"
                  >
                    {(entries.length > 0 || note) && (
                      <ChevronRight
                        className={cn(
                          "size-3.5 shrink-0 text-ink-faint transition-transform",
                          open && "rotate-90",
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "truncate",
                        !section.include && "text-ink-faint line-through",
                      )}
                    >
                      {sectionLabel(section, data)}
                    </span>
                    {entries.length > 0 && (
                      <span className="shrink-0 text-xs text-ink-faint tabular-nums">
                        {entries.length}
                      </span>
                    )}
                  </button>

                  <Switch
                    checked={section.include}
                    aria-label={`Include ${sectionLabel(section, data)}`}
                    onCheckedChange={(include) => patch(id, { include })}
                  />
                </div>

                {open && (
                  <div className="flex flex-col gap-2 border-line border-l pb-1 pl-3">
                    {note && (
                      <p className="flex gap-1.5 text-xs text-ink-subtle">
                        <Info className="mt-0.5 size-3 shrink-0" />
                        {note}
                      </p>
                    )}

                    {entries.length > 0 && (
                      <EntryArranger
                        entries={entries}
                        order={section.entryOrder}
                        onChange={(entryOrder) => patch(id, { entryOrder })}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          }}
        />
      </CardContent>
    </Card>
  );
}

function EntryArranger({
  entries,
  order,
  onChange,
}: {
  entries: { id: string; label: string }[];
  order: readonly string[];
  onChange: (order: string[]) => void;
}) {
  const rank = new Map(order.map((id, i) => [id, i]));
  const sorted = entries
    .slice()
    .sort(
      (a, b) =>
        (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );

  return (
    <SortableList
      items={sorted}
      onReorder={(next) => onChange(next.map((item) => item.id))}
      renderItem={(item) => (
        <span className="block truncate text-xs text-ink-muted">
          {item.label || "Untitled"}
        </span>
      )}
    />
  );
}

export function OptionControls({
  controls,
  options,
  onChange,
}: {
  controls: readonly CvOptionControl[];
  options: CvTemplateOptions;
  onChange: (options: CvTemplateOptions) => void;
}) {
  if (controls.length === 0) return null;

  function set(key: string, value: unknown) {
    onChange({ ...options, [key]: value });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-5">
        <h2 className="font-heading text-base font-semibold text-ink">
          Appearance
        </h2>

        {controls.map((control) =>
          control.kind === "boolean" ? (
            <div key={control.key} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">{control.label}</p>
                {control.hint && (
                  <p className="text-xs text-ink-subtle">{control.hint}</p>
                )}
              </div>
              <Switch
                checked={options[control.key] === true}
                aria-label={control.label}
                onCheckedChange={(on) => set(control.key, on)}
              />
            </div>
          ) : (
            <div key={control.key} className="flex flex-col gap-1.5">
              <p className="text-sm text-ink">{control.label}</p>
              {control.hint && (
                <p className="-mt-1 text-xs text-ink-subtle">{control.hint}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {control.choices.map((choice) => {
                  const active = options[control.key] === choice.value;
                  return (
                    <button
                      key={String(choice.value)}
                      type="button"
                      aria-pressed={active}
                      onClick={() => set(control.key, choice.value)}
                      className={cn(
                        "cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors",
                        active
                          ? "border-primary bg-primary-surface text-ink"
                          : "border-line text-ink-muted hover:border-line-strong",
                      )}
                    >
                      {choice.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ),
        )}
      </CardContent>
    </Card>
  );
}
