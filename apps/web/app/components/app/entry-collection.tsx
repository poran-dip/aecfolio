import { VerificationStatus } from "@aecfolio/shared";
import { Lock, Plus, Trash2 } from "lucide-react";
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
  }, [api, entity]);

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
          <SaveIndicator status={summarise(Object.values(statuses))} />
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
  const [value, setValue] = useState(row.value);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const idRef = useRef(row.id);

  const status = statusOf?.(value) ?? null;
  const verified = status === VerificationStatus.VERIFIED;
  const locked = verified && !unlocked;

  const auto = useAutosave<T>({
    canSave,
    save: async (next) => {
      if (idRef.current) {
        await api.update(idRef.current, next);
      } else {
        idRef.current = await api.create(next);
      }
    },
  });

  useEffect(() => {
    onStatus(row.key, auto.status);
  }, [auto.status, onStatus, row.key]);

  function set(patch: Partial<T>) {
    const demote =
      verified && unlocked
        ? ({ status: VerificationStatus.PENDING } as unknown as Partial<T>)
        : null;

    const next = { ...value, ...patch, ...demote };
    setValue(next);
    auto.change(next);
  }

  const title = titleOf(value).trim();
  const untitled = !canSave(value);

  return (
    <AccordionItem value={row.key} className={untitled ? "border-danger" : ""}>
      <AccordionTrigger
        title={title || `Untitled ${singular}`}
        subtitle={subtitleOf?.(value) ?? undefined}
        badge={
          <span className="flex shrink-0 items-center gap-2">
            <SaveIndicator
              status={auto.status}
              onRetry={() => void auto.retry()}
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
            This {singular} needs a title before it can be saved. Nothing here
            is stored until it has one.
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
            blur: () => void auto.flush(),
            locked,
          })}
        </fieldset>
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
          auto.cancel();
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
