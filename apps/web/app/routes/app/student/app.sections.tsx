import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DateField } from "~/components/app/date-field";
import {
  type EntryApi,
  EntryCollection,
} from "~/components/app/entry-collection";
import { SaveIndicator } from "~/components/app/save-indicator";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { ConfirmDialog } from "~/components/ui/dialog";
import { Field } from "~/components/ui/field";
import { IconButton } from "~/components/ui/icon-button";
import { Input } from "~/components/ui/input";
import { MarkdownEditor } from "~/components/ui/markdown-editor";
import { toast } from "~/components/ui/toast";
import { studentApi } from "~/lib/student-api";
import { useAutosave } from "~/lib/use-autosave";

type EntryValue = {
  title: string;
  org: string | null;
  date: string | null;
  body: string | null;
};

export type SectionData = {
  id: string;
  name: string;
  entries: { id: string; value: EntryValue }[];
};

type SectionRow = { key: string; id: string | null; data: SectionData };

export function CustomSections({ initial }: { initial: SectionData[] }) {
  const [rows, setRows] = useState<SectionRow[]>(() =>
    initial.map((data) => ({ key: data.id, id: data.id, data })),
  );

  function add() {
    const key = `draft-${crypto.randomUUID()}`;
    setRows((previous) => [
      ...previous,
      { key, id: null, data: { id: key, name: "", entries: [] } },
    ]);
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-xl font-semibold text-ink">
          Your own sections
        </h2>
        <Button size="sm" variant="secondary" onClick={add}>
          <Plus />
          Add section
        </Button>
      </div>

      <p className="text-sm text-ink-muted">
        For anything the sections above do not cover — publications,
        conferences, positions of responsibility. Each one becomes a heading on
        the CV.
      </p>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-ink-subtle">
          No sections of your own yet.
        </p>
      ) : (
        rows.map((row) => (
          <SectionCard
            key={row.key}
            row={row}
            onRemoved={() =>
              setRows((previous) => previous.filter((it) => it.key !== row.key))
            }
          />
        ))
      )}
    </section>
  );
}

function SectionCard({
  row,
  onRemoved,
}: {
  row: SectionRow;
  onRemoved: () => void;
}) {
  const [name, setName] = useState(row.data.name);
  const [id, setId] = useState(row.id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const auto = useAutosave<string>({
    canSave: (next) => next.trim().length > 0,
    save: async (next) => {
      if (id) {
        await studentApi.update("custom-sections", id, { name: next.trim() });
      } else {
        const created = await studentApi.create<{ id: string }>(
          "custom-sections",
          { name: next.trim() },
        );
        setId(created.id);
      }
    },
  });

  const api = useMemo<EntryApi<EntryValue>>(() => {
    const payload = (value: EntryValue) => ({
      title: value.title.trim(),
      org: value.org?.trim() || null,
      date: value.date,
      body: value.body,
    });

    return {
      async create(value) {
        if (!id) throw new Error("Name the section first");
        const created = await studentApi.sectionEntry.create<{ id: string }>(
          id,
          payload(value),
        );
        return created.id;
      },
      async update(entryId, value) {
        if (!id) throw new Error("Name the section first");
        await studentApi.sectionEntry.update(id, entryId, payload(value));
      },
      async remove(entryId) {
        if (!id) return;
        await studentApi.sectionEntry.remove(id, entryId);
      },
    };
  }, [id]);

  const named = name.trim().length > 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 pt-6">
        <div className="flex items-end gap-3">
          <Field
            label="Section name"
            required
            className="flex-1"
            error={named ? undefined : "A name is required."}
          >
            {(props) => (
              <Input
                {...props}
                value={name}
                placeholder="Publications"
                tone={named ? "normal" : "invalid"}
                onChange={(event) => {
                  setName(event.target.value);
                  auto.change(event.target.value);
                }}
                onBlur={() => void auto.flush()}
              />
            )}
          </Field>

          <div className="flex h-9 items-center gap-2">
            <SaveIndicator
              status={auto.status}
              onRetry={() => void auto.retry()}
            />
            <IconButton
              label="Delete this section"
              size="sm"
              variant="danger"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 />
            </IconButton>
          </div>
        </div>

        {id ? (
          <EntryCollection
            label="Entries"
            singular="entry"
            initial={row.data.entries}
            blank={() => ({ title: "", org: null, date: null, body: null })}
            canSave={(value) => value.title.trim().length > 0}
            titleOf={(value) => value.title}
            subtitleOf={(value) => value.org}
            api={api}
            emptyHint="Nothing in this section yet."
            renderFields={({ value, set, blur }) => (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Title"
                    required
                    error={
                      value.title.trim() ? undefined : "A title is required."
                    }
                  >
                    {(props) => (
                      <Input
                        {...props}
                        value={value.title}
                        tone={value.title.trim() ? "normal" : "invalid"}
                        onChange={(event) => set({ title: event.target.value })}
                        onBlur={blur}
                      />
                    )}
                  </Field>

                  <Field label="Organisation" hint="Optional.">
                    {(props) => (
                      <Input
                        {...props}
                        value={value.org ?? ""}
                        onChange={(event) => set({ org: event.target.value })}
                        onBlur={blur}
                      />
                    )}
                  </Field>
                </div>

                <DateField
                  label="Dates"
                  value={value.date}
                  onChange={(date) => set({ date })}
                  onBlur={blur}
                />

                <Field label="Details" hint="Optional.">
                  {(props) => (
                    <MarkdownEditor
                      {...props}
                      value={value.body ?? ""}
                      rows={3}
                      onChange={(body) => set({ body })}
                      onBlur={blur}
                    />
                  )}
                </Field>
              </>
            )}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-ink-subtle">
            Give the section a name and you can start adding entries to it.
          </p>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this section?"
        description={
          id
            ? `Everything in ${name.trim() || "this section"} goes with it, and it disappears from any CV you export after this.`
            : "This section has never been saved, so nothing is lost."
        }
        confirmLabel="Delete section"
        danger
        onConfirm={async () => {
          auto.cancel();
          onRemoved();
          if (!id) return;
          try {
            await studentApi.remove("custom-sections", id);
          } catch {
            toast.error(
              "That section could not be deleted. Reload and try again.",
            );
          }
        }}
      />
    </Card>
  );
}
