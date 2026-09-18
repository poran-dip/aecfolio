import {
  BRANCH_LABELS,
  Branch,
  Capability,
  VerificationStatus,
} from "@aecfolio/shared";
import { BadgeCheck, FileText, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  useFetcher,
  useRevalidator,
  useSearchParams,
} from "react-router";
import { ClaimCard } from "~/components/app/claim-card";
import {
  ListWithPanel,
  PanelRow,
  PanelSection,
} from "~/components/app/detail-panel";
import { FilterBar, useFilterNavigation } from "~/components/app/filter-bar";
import { Page } from "~/components/app/page";
import {
  ReviewActions,
  reviewSubmitter,
} from "~/components/app/review-actions";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { EmptyState } from "~/components/ui/empty-state";
import { Pagination } from "~/components/ui/pagination";
import { Select } from "~/components/ui/select";
import { LinkTabs } from "~/components/ui/tabs";
import { toast } from "~/components/ui/toast";
import { api, unwrap } from "~/lib/api.server";
import {
  CLAIM_KIND_LABELS,
  CLAIM_KINDS,
  type ClaimKind,
  describeReview,
  proofHref,
} from "~/lib/claims";
import { formatRelative } from "~/lib/format";
import { requireCapability } from "~/lib/guard";
import { usePublicApiUrl } from "~/lib/public-env";
import {
  boolParam,
  enumParam,
  intParam,
  queryOf,
  withParams,
} from "~/lib/query";
import { reviewFromForm } from "~/lib/review.server";
import type { Route } from "./+types/verifications";

export const handle = { title: "Verifications" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Verifications · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.CLAIM_REVIEW);
  const params = new URL(request.url).searchParams;
  const client = api(request);

  const filters = {
    kind: enumParam(params, "kind", CLAIM_KINDS),
    department: enumParam(params, "department", Object.values(Branch)),
    allDepartments: boolParam(params, "allDepartments"),
    page: intParam(params, "page", 1),
  };

  const [queue, me] = await Promise.all([
    unwrap(await client.api.verifications.$get({ query: queryOf(filters) })),
    unwrap(await client.api.me.$get()),
  ]);

  return { queue, filters, ownDepartment: me.faculty?.department ?? null };
}

export async function action({ request }: Route.ActionArgs) {
  await requireCapability(request, Capability.CLAIM_REVIEW);
  const form = await request.formData();
  const status = String(form.get("status"));
  const result = await reviewFromForm(request, form);

  return result.ok ? { ...result, status } : result;
}

type QueueRow = {
  kind: string;
  id: string;
  studentId: string;
  rollNo: string;
  branch: string;
  studentName: string;
  title: string;
  detail: string | null;
  proofKey: string | null;
  createdAt: string;
};

export default function VerificationsRoute({
  loaderData,
}: Route.ComponentProps) {
  const { queue, filters, ownDepartment } = loaderData;
  const [params] = useSearchParams();
  const { set } = useFilterNavigation();
  const fetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();
  const apiUrl = usePublicApiUrl();

  const [openId, setOpenId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const items = queue.items as QueueRow[];
  const busy = fetcher.state !== "idle";
  const submitReview = reviewSubmitter(fetcher);
  const open = items.find((row) => row.id === openId) ?? null;

  useEffect(() => {
    const result = fetcher.data;
    if (!result || fetcher.state !== "idle") return;

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(describeReview(result.data, result.status));
    setSelected(new Set());
    setOpenId(null);
    revalidator.revalidate();
  }, [fetcher.data, fetcher.state, revalidator]);

  // Bulk review goes through one endpoint per kind, so a mixed selection has
  // no single call to make. Selection is confined to one tab at a time.
  const selectedKind = filters.kind;
  const selectable = Boolean(selectedKind);
  const selectedIds = [...selected];

  const tabs = [
    {
      key: "all",
      label: "All",
      to: withParams(params, { kind: null }),
      count:
        queue.byKind.results +
        queue.byKind.achievements +
        queue.byKind.certifications,
    },
    ...CLAIM_KINDS.map((kind) => ({
      key: kind,
      label: CLAIM_KIND_LABELS[kind],
      to: withParams(params, { kind }),
      count: queue.byKind[kind],
    })),
  ];

  const list = (
    <>
      {items.length === 0 ? (
        <EmptyState
          icon={BadgeCheck}
          title="Nothing waiting"
          description="Every claim in this view has been reviewed. New submissions appear here."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((row) => (
            <ClaimCard
              key={row.id}
              active={row.id === openId}
              selected={selected.has(row.id)}
              onSelectedChange={
                selectable
                  ? (on) =>
                      setSelected((previous) => {
                        const next = new Set(previous);
                        if (on) next.add(row.id);
                        else next.delete(row.id);
                        return next;
                      })
                  : undefined
              }
              onOpen={() => setOpenId(row.id)}
              claim={{
                id: row.id,
                kind: row.kind as ClaimKind,
                title: row.title,
                detail: row.detail,
                status: VerificationStatus.PENDING,
                hasProof: Boolean(row.proofKey),
              }}
            >
              <p className="text-xs text-ink-faint">
                {row.studentName} · {row.rollNo} · {row.branch} ·{" "}
                {formatRelative(row.createdAt)}
              </p>
            </ClaimCard>
          ))}
        </div>
      )}

      <Pagination info={queue} unit="claims" className="mt-4" />
    </>
  );

  const panel = open && (
    <div>
      <PanelSection title={CLAIM_KIND_LABELS[open.kind as ClaimKind]}>
        <p className="font-medium text-ink">{open.title}</p>
        {open.detail && (
          <p className="mt-1 text-sm text-ink-muted">{open.detail}</p>
        )}
      </PanelSection>

      <PanelSection title="Student">
        <dl>
          <PanelRow label="Name">
            <Link
              to={`/students/${open.studentId}`}
              className="text-primary-text hover:underline"
            >
              {open.studentName}
            </Link>
          </PanelRow>
          <PanelRow label="Roll number">{open.rollNo}</PanelRow>
          <PanelRow label="Department">
            {BRANCH_LABELS[open.branch as Branch] ?? open.branch}
          </PanelRow>
          <PanelRow label="Submitted">
            {formatRelative(open.createdAt)}
          </PanelRow>
        </dl>
      </PanelSection>

      <PanelSection title="Evidence">
        {open.proofKey ? (
          <Button asChild variant="secondary" size="sm">
            <a
              href={proofHref(apiUrl, open.kind as ClaimKind, open.id) ?? "#"}
              target="_blank"
              rel="noreferrer"
            >
              <FileText />
              Open proof
            </a>
          </Button>
        ) : (
          <p className="text-sm text-ink-subtle">
            {open.kind === "results"
              ? "A submitted SGPA carries no file. Check it against the published result."
              : "The student attached no file to this claim."}
          </p>
        )}
      </PanelSection>

      <PanelSection>
        <div className="flex gap-2">
          <ReviewActions
            kind={open.kind as ClaimKind}
            ids={[open.id]}
            busy={busy}
            onSubmit={submitReview}
            size="md"
          />
        </div>
      </PanelSection>
    </div>
  );

  return (
    <Page
      description={
        !filters.department && !filters.allDepartments && ownDepartment
          ? `Showing ${BRANCH_LABELS[ownDepartment]}. Switch the department filter to see every claim.`
          : undefined
      }
    >
      <LinkTabs
        items={tabs}
        activeKey={filters.kind ?? "all"}
        className="mb-4"
      />

      <FilterBar
        activeCount={
          [filters.department, filters.allDepartments || undefined].filter(
            Boolean,
          ).length
        }
        onClear={() => set({ department: null, allDepartments: null })}
      >
        <Select
          value={
            filters.department ??
            (filters.allDepartments ? undefined : (ownDepartment ?? undefined))
          }
          onValueChange={(value) =>
            set({
              department: value ?? null,
              allDepartments: value ? null : "true",
            })
          }
          anyLabel="All departments"
          placeholder="Department"
          className="w-44"
          options={Object.values(Branch).map((branch) => ({
            value: branch,
            label: branch,
          }))}
        />
      </FilterBar>

      {!selectable && items.length > 0 && (
        <p className="mb-3 flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-muted">
          <TriangleAlert className="size-4 shrink-0 text-ink-faint" />
          Pick a claim type above to select several at once — a bulk decision
          applies to one type at a time.
        </p>
      )}

      {selectable && items.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Checkbox
              checked={
                selected.size === items.length
                  ? true
                  : selected.size > 0
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={(next) =>
                setSelected(
                  next === true
                    ? new Set(items.map((row) => row.id))
                    : new Set(),
                )
              }
              aria-label="Select every claim on this page"
            />
            <span>
              {selected.size > 0
                ? `${selected.size} selected`
                : "Select all on this page"}
            </span>
          </div>

          {selected.size > 0 && selectedKind && (
            <div className="flex gap-2">
              <ReviewActions
                kind={selectedKind}
                ids={selectedIds}
                busy={busy}
                onSubmit={submitReview}
              />
            </div>
          )}
        </div>
      )}

      <ListWithPanel
        list={list}
        panel={panel}
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        panelTitle="Claim details"
        emptyIcon={BadgeCheck}
        emptyTitle="Open a claim to view details"
        emptyDescription="The student who submitted it, the evidence behind it and the verify and reject actions all appear here."
      />
    </Page>
  );
}
