import { Capability } from "@aecfolio/shared";
import { ScrollText } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import {
  ListWithPanel,
  PanelRow,
  PanelSection,
} from "~/components/app/detail-panel";
import {
  FilterBar,
  SearchField,
  useFilterNavigation,
} from "~/components/app/filter-bar";
import { Page } from "~/components/app/page";
import { Badge, type BadgeVariant } from "~/components/ui/badge";
import { EmptyState } from "~/components/ui/empty-state";
import { Pagination } from "~/components/ui/pagination";
import { Select } from "~/components/ui/select";
import { api, unwrap } from "~/lib/api.server";
import { formatDateTime, formatRelative } from "~/lib/format";
import { requireCapability } from "~/lib/guard";
import { enumParam, intParam, queryOf, stringParam } from "~/lib/query";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/audit";

export const handle = { title: "Audit log" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Audit log · AECFolio" }];
}

const ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "VERIFY",
  "REJECT",
  "IMPORT",
  "PROMOTE",
  "SET_ROLE",
] as const;

const ENTITIES = [
  "User",
  "Student",
  "Faculty",
  "Result",
  "Achievement",
  "Certification",
  "Experience",
  "Project",
  "Social",
  "Interest",
  "CustomSection",
  "CustomSectionEntry",
  "SemesterCreditScheme",
] as const;

const ACTION_TONE: Record<string, BadgeVariant> = {
  CREATE: "primary",
  UPDATE: "neutral",
  DELETE: "danger",
  VERIFY: "verified",
  REJECT: "rejected",
  IMPORT: "primary",
  PROMOTE: "primary",
  SET_ROLE: "primary",
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.AUDIT_READ);
  const params = new URL(request.url).searchParams;

  const filters = {
    action: enumParam(params, "action", ACTIONS),
    entity: enumParam(params, "entity", ENTITIES),
    entityId: stringParam(params, "entityId"),
    page: intParam(params, "page", 1),
  };

  const page = await unwrap(
    await api(request).api["audit-logs"].$get({ query: queryOf(filters) }),
  );

  return { page, filters };
}

type LogRow = {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
  actorName: string;
  actorEmail: string;
};

export default function AuditRoute({ loaderData }: Route.ComponentProps) {
  const { page, filters } = loaderData;
  const { set } = useFilterNavigation();
  const [openId, setOpenId] = useState<string | null>(null);

  const items = page.items as LogRow[];
  const open = items.find((row) => row.id === openId) ?? null;

  const list =
    items.length === 0 ? (
      <EmptyState
        icon={ScrollText}
        title="Nothing logged here"
        description="Every write the app makes is recorded. Widen the filters to see more."
      />
    ) : (
      <>
        <ol className="flex flex-col gap-2">
          {items.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => setOpenId(row.id)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-xl border bg-surface-raised p-3 text-left shadow-xs transition-colors",
                  row.id === openId
                    ? "border-primary bg-primary-surface/40"
                    : "border-line hover:border-line-strong",
                )}
              >
                <Badge
                  variant={ACTION_TONE[row.action] ?? "neutral"}
                  className="shrink-0"
                >
                  {row.action.replace("_", " ")}
                </Badge>

                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm text-ink">
                    <span className="font-medium">{row.entity}</span>
                    <span className="text-ink-faint"> · {row.entityId}</span>
                  </p>
                  <p className="truncate text-xs text-ink-subtle">
                    {row.actorName} · {formatRelative(row.createdAt)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ol>

        <Pagination info={page} unit="entries" className="mt-4" />
      </>
    );

  const panel = open && (
    <div>
      <PanelSection title="Entry">
        <dl>
          <PanelRow label="Action">{open.action.replace("_", " ")}</PanelRow>
          <PanelRow label="Entity">{open.entity}</PanelRow>
          <PanelRow label="Entity ID">
            <span className="font-mono text-xs">{open.entityId}</span>
          </PanelRow>
          <PanelRow label="When">{formatDateTime(open.createdAt)}</PanelRow>
        </dl>
      </PanelSection>

      <PanelSection title="Who">
        <dl>
          <PanelRow label="Name">{open.actorName}</PanelRow>
          <PanelRow label="Email">{open.actorEmail}</PanelRow>
        </dl>
      </PanelSection>

      <PanelSection title="What changed">
        {open.metadata ? (
          <MetadataView metadata={open.metadata} />
        ) : (
          <p className="text-sm text-ink-subtle">
            No details were recorded for this action.
          </p>
        )}
      </PanelSection>

      {open.entity === "Student" && (
        <PanelSection>
          <Link
            to={`/students/${open.entityId}`}
            className="text-sm font-medium text-primary-text hover:underline"
          >
            Open this student
          </Link>
        </PanelSection>
      )}
    </div>
  );

  return (
    <Page description="Every write this app makes, newest first.">
      <FilterBar
        activeCount={
          [filters.action, filters.entity, filters.entityId].filter(Boolean)
            .length
        }
        onClear={() => set({ action: null, entity: null, entityId: null })}
      >
        <SearchField paramKey="entityId" placeholder="Entity ID" />

        <Select
          value={filters.action}
          onValueChange={(value) => set({ action: value ?? null })}
          anyLabel="Any action"
          placeholder="Action"
          className="w-40"
          options={ACTIONS.map((action) => ({
            value: action,
            label: action.replace("_", " "),
          }))}
        />

        <Select
          value={filters.entity}
          onValueChange={(value) => set({ entity: value ?? null })}
          anyLabel="Any entity"
          placeholder="Entity"
          className="w-48"
          options={ENTITIES.map((entity) => ({ value: entity, label: entity }))}
        />
      </FilterBar>

      <ListWithPanel
        list={list}
        panel={panel}
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        panelTitle="Log entry"
        emptyIcon={ScrollText}
        emptyTitle="Open an entry to view details"
        emptyDescription="Who made the change, when, and the before and after of every field it touched."
      />
    </Page>
  );
}

function isDiff(
  value: unknown,
): value is Record<string, { from: unknown; to: unknown }> {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value).every(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      "from" in entry &&
      "to" in entry,
  );
}

function show(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value || "(empty)";
  return JSON.stringify(value);
}

/** Updates carry a before/after diff; everything else is a plain record. */
function MetadataView({ metadata }: { metadata: unknown }) {
  if (isDiff(metadata)) {
    return (
      <dl className="flex flex-col gap-2">
        {Object.entries(metadata).map(([field, change]) => (
          <div key={field} className="text-sm">
            <dt className="text-xs text-ink-faint">{field}</dt>
            <dd className="flex flex-wrap items-baseline gap-2">
              <span className="rounded bg-rejected-surface px-1.5 py-0.5 text-xs text-rejected line-through">
                {show(change.from)}
              </span>
              <span className="rounded bg-verified-surface px-1.5 py-0.5 text-xs text-verified">
                {show(change.to)}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <pre className="overflow-x-auto rounded-lg bg-surface-sunken p-3 text-xs text-ink-muted">
      {JSON.stringify(metadata, null, 2)}
    </pre>
  );
}
