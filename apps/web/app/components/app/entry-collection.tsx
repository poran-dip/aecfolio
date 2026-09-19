import { VerificationStatus } from "@aecfolio/shared";
import { Lock, Plus, Save, Trash2, X } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ClaimStatusBadge } from "~/components/app/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/components/ui/dialog";
import { IconButton } from "~/components/ui/icon-button";
import { toast } from "~/components/ui/toast";
import type { AutosaveStatus } from "~/lib/autosave";
import { clearDraft, readDraft, writeDraft } from "~/lib/local-draft";
import { entityApi } from "~/lib/student-api";
import { useAutosave } from "~/lib/use-autosave";
import { SaveIndicator, summarise } from "./save-indicator";

export type EntryApi<T> = {
  create: (value: T) => Promise<string>;
  update: (id: string, value: T) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export type EntryFieldProps<T> = {
  value: T;
  set: (patch: Partial<T>) => void;
  id: string | null;
  blur: () => void;
  locked: boolean;
};

type Row<T> = { key: string; id: string | null; value: T };

function sameValue<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function EntryCollection<T>({
  label,
  singular,
  description,
  initial,
  blank,
  canSave,
  titleOf,
  subtitleOf,
  statusOf,
  entity,
  storageKey,
  toPayload,
  api,
  renderFields,
  emptyHint,
}: {
  label: string;
  singular: string;
  description?: ReactNode;
  initial: { id: string; value: T }[];
  blank: () => T;
  canSave: (value: T) => boolean;
  titleOf: (value: T) => string;
  subtitleOf?: (value: T) => string | null;
  statusOf?: (value: T) => VerificationStatus | null;
  entity?: string;
  storageKey?: string;
  toPayload?: (value: T) => unknown;
  api?: EntryApi<T>;
  renderFields: (props: EntryFieldProps<T>) => ReactNode;
  emptyHint?: string;
}) {
  const [rows, setRows] = useState<Row<T>[]>(() =>
    initial.map((row) => ({ key: row.id, id: row.id, value: row.value })),
  );
  const [open, setOpen] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AutosaveStatus>>({});

  const collectionKey = storageKey ?? entity;
  if (!collectionKey) {
    throw new Error("EntryCollection needs either storageKey or entity");
  }

  const report = useCallback((key: string, status: AutosaveStatus) => {
    setStatuses((previous) => ({ ...previous, [key]: status }));
  }, []);

  const resolved = useMemo<EntryApi<T>>(() => {
    if (api) return api;
    if (!entity || !toPayload)
      throw new Error(
        "EntryCollection needs either api, or entity + toPayload",
      );
    return entityApi<T>(entity, toPayload);
  }, [api, entity, toPayload]);

  function add() {
    const key = `draft-${crypto.randomUUID()}`;
    setRows((previous) => [...previous, { key, id: null, value: blank() }]);
    setOpen((previous) => [...previous, key]);
  }

  function drop(key: string) {
    setRows((previous) => previous.filter((row) => row.key !== key));
    setStatuses((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <h2 className="font-heading text-xl font-semibold text-ink">
            {label}
          </h2>
          <SaveIndicator
            status={summarise(Object.values(statuses))}
            labels={{
              dirty: "Unsaved changes",
              saving: "Saving draft…",
              saved: "Draft saved locally",
            }}
          />
        </div>
        <Button size="sm" variant="secondary" onClick={add}>
          <Plus />
          Add {singular}
        </Button>
      </div>

      {description && <p className="text-sm text-ink-muted">{description}</p>}

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-ink-subtle">
          {emptyHint ?? `No ${label.toLowerCase()} yet.`}
        </p>
      ) : (
        <Accordion type="multiple" value={open} onValueChange={setOpen} asChild>
          <div className="flex flex-col gap-2">
            {rows.map((row) => (
              <EntryRow
                key={row.key}
                row={row}
                draftKey={`${collectionKey}:${row.key}`}
                api={resolved}
                canSave={canSave}
                titleOf={titleOf}
                subtitleOf={subtitleOf}
                statusOf={statusOf}
                singular={singular}
                renderFields={renderFields}
                onStatus={report}
                onRemoved={() => drop(row.key)}
              />
            ))}
          </div>
        </Accordion>
      )}
    </section>
  );
}

function EntryRow<T>({
  row,
  draftKey,
  api,
  canSave,
  titleOf,
  subtitleOf,
  statusOf,
  singular,
  renderFields,
  onStatus,
  onRemoved,
}: {
  row: Row<T>;
  draftKey: string;
  api: EntryApi<T>;
  canSave: (value: T) => boolean;
  titleOf: (value: T) => string;
  subtitleOf?: (value: T) => string | null;
  statusOf?: (value: T) => VerificationStatus | null;
  singular: string;
  renderFields: (props: EntryFieldProps<T>) => ReactNode;
  onStatus: (key: string, status: AutosaveStatus) => void;
  onRemoved: () => void;
}) {
  const original = useRef(row.value);
  const [value, setValue] = useState<T>(
    () => readDraft<T>(draftKey) ?? row.value,
  );

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [committing, setCommitting] = useState(false);
  const idRef = useRef(row.id);

  const status = statusOf?.(value) ?? null;
  const verified = status === VerificationStatus.VERIFIED;
  const locked = verified && !unlocked;

  const draft = useAutosave<T>({
    save: async (next) => writeDraft(draftKey, next),
  });

  useEffect(() => {
    onStatus(row.key, draft.status);
  }, [draft.status, onStatus, row.key]);

  useEffect(() => {
    const recovered = readDraft<T>(draftKey);
    if (recovered && !sameValue(recovered, row.value)) {
      draft.change(recovered);
    }
  }, []);

  function set(patch: Partial<T>) {
    const demote =
      verified && unlocked
        ? ({ status: VerificationStatus.PENDING } as unknown as Partial<T>)
        : null;

    const next = { ...value, ...patch, ...demote };
    setValue(next);
    draft.change(next);
  }

  const title = titleOf(value).trim();
  const untitled = !canSave(value);
  const isNew = idRef.current === null;
  const dirty = isNew || !sameValue(value, original.current);

  async function commit() {
    if (untitled || committing) return;
    setCommitting(true);
    try {
      if (idRef.current) {
        await api.update(idRef.current, value);
      } else {
        idRef.current = await api.create(value);
      }
      original.current = value;
      setUnlocked(false);
      clearDraft(draftKey);
      draft.cancel();
      toast.success(`${title || singular} saved.`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `That ${singular} could not be saved. Try again.`,
      );
    } finally {
      setCommitting(false);
    }
  }

  function discard() {
    draft.cancel();
    clearDraft(draftKey);
    if (isNew) {
      onRemoved();
      return;
    }
    setValue(original.current);
    setUnlocked(false);
  }

  return (
    <AccordionItem value={row.key} className={untitled ? "border-danger" : ""}>
      <AccordionTrigger
        title={title || `Untitled ${singular}`}
        subtitle={subtitleOf?.(value) ?? undefined}
        badge={
          <span className="flex shrink-0 items-center gap-2">
            <SaveIndicator
              status={draft.status}
              onRetry={() => void draft.retry()}
              labels={{
                dirty: "Unsaved",
                saving: "Saving…",
                saved: "Draft saved locally",
              }}
            />
            {status && <ClaimStatusBadge status={status} size="sm" />}
          </span>
        }
        actions={
          <IconButton
            label={`Delete this ${singular}`}
            size="sm"
            variant="danger"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 />
          </IconButton>
        }
      />

      <AccordionContent>
        {untitled && (
          <p className="mb-3 rounded-lg border border-danger bg-danger-surface px-3 py-2 text-xs text-danger-text">
            This {singular} needs a title before it can be saved. Your changes
            are kept in this browser until then.
          </p>
        )}

        {locked && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2">
            <p className="flex items-center gap-2 text-xs text-ink-muted">
              <Lock className="size-3.5 shrink-0" />
              Verified, so it is read-only. Editing sends it back for review.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setConfirmEdit(true)}
            >
              Edit anyway
            </Button>
          </div>
        )}

        <fieldset disabled={locked} className="flex flex-col gap-4">
          {renderFields({
            value,
            set,
            id: idRef.current,
            blur: () => void draft.flush(),
            locked,
          })}
        </fieldset>

        {dirty && !locked && (
          <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={discard}
              disabled={committing}
            >
              <X />
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => void commit()}
              disabled={untitled || committing}
            >
              <Save />
              {committing ? "Saving…" : `Save ${singular}`}
            </Button>
          </div>
        )}
      </AccordionContent>

      <ConfirmDialog
        open={confirmEdit}
        onOpenChange={setConfirmEdit}
        title="Edit a verified entry?"
        description={`This ${singular} has been verified. Editing it sends it back for review, and faculty and the college will not see it again until someone re-verifies it.`}
        confirmLabel="Edit it anyway"
        onConfirm={() => {
          setUnlocked(true);
          setConfirmEdit(false);
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete this ${singular}?`}
        description={
          title
            ? `"${title}" is removed from your profile and from any CV you export after this.`
            : "This draft has never been saved, so nothing is lost."
        }
        confirmLabel={`Delete ${singular}`}
        danger
        onConfirm={async () => {
          draft.cancel();
          clearDraft(draftKey);
          const id = idRef.current;
          onRemoved();
          if (!id) return;
          try {
            await api.remove(id);
          } catch {
            toast.error(
              `That ${singular} could not be deleted. Reload and try again.`,
            );
          }
        }}
      />
    </AccordionItem>
  );
}
