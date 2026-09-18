import {
  Branch,
  Capability,
  canManageStaffWithRole,
  Role,
} from "@aecfolio/shared";
import { Plus, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useFetcher } from "react-router";
import { FilterBar, useFilterNavigation } from "~/components/app/filter-bar";
import { Page } from "~/components/app/page";
import { UserAvatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import { Pagination } from "~/components/ui/pagination";
import { Select } from "~/components/ui/select";
import { toast } from "~/components/ui/toast";
import { api, attempt, unwrap } from "~/lib/api.server";
import { requireCapability } from "~/lib/guard";
import { ROLE_LABELS } from "~/lib/nav";
import { enumParam, intParam, queryOf } from "~/lib/query";
import type { Route } from "./+types/faculty";
import { emptyStaffRow, type StaffDraft, StaffGrid } from "./faculty.grid";

export const handle = { title: "Faculty" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Faculty · AECFolio" }];
}

const STAFF_ROLES = [Role.FACULTY, Role.MOD, Role.ADMIN] as const;

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireCapability(request, Capability.FACULTY_MANAGE);
  const params = new URL(request.url).searchParams;
  const client = api(request);

  const filters = {
    role: enumParam(params, "role", STAFF_ROLES),
    department: enumParam(params, "department", Object.values(Branch)),
    page: intParam(params, "page", 1),
  };

  const page = await unwrap(
    await client.api.faculty.$get({ query: queryOf(filters) }),
  );

  return {
    page,
    filters,
    actorRole: session.user.role,
    creatableRoles: STAFF_ROLES.filter((role) =>
      canManageStaffWithRole(session.user.role, role),
    ),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireCapability(request, Capability.FACULTY_MANAGE);
  const form = await request.formData();

  let rows: StaffDraft[];
  try {
    rows = JSON.parse(String(form.get("staff") ?? "[]"));
  } catch {
    return {
      ok: false as const,
      message: "Could not read the rows",
      code: "VALIDATION",
    };
  }

  if (rows.length === 0) {
    return {
      ok: false as const,
      message: "There is nothing to create",
      code: "VALIDATION",
    };
  }

  const client = api(request);

  // There is no bulk staff endpoint, and there should not be: staff arrive a
  // few at a time. Each row is its own call, and each failure is its own row.
  const created: string[] = [];
  const failed: { email: string; reason: string }[] = [];

  for (const row of rows) {
    if (!canManageStaffWithRole(session.user.role, row.role as Role)) {
      failed.push({
        email: row.email,
        reason: `You cannot create an account with the ${row.role} role`,
      });
      continue;
    }

    const outcome = await attempt(async () =>
      unwrap(
        await client.api.faculty.$post({
          json: {
            name: row.name.trim(),
            email: row.email.trim(),
            employeeId: row.employeeId.trim(),
            designation: row.designation.trim() || null,
            department: row.department ? (row.department as Branch) : null,
            role: row.role as (typeof STAFF_ROLES)[number],
          },
        }),
      ),
    );

    if (outcome.ok) created.push(row.email);
    else failed.push({ email: row.email, reason: outcome.message });
  }

  return { ok: true as const, data: { created, failed } };
}

type StaffRow = {
  id: string;
  userId: string;
  employeeId: string;
  designation: string | null;
  department: string | null;
  role: Role;
  name: string;
  email: string;
};

export default function FacultyRoute({ loaderData }: Route.ComponentProps) {
  const { page, filters, actorRole, creatableRoles } = loaderData;
  const { set } = useFilterNavigation();
  const fetcher = useFetcher<typeof action>();
  const [drafts, setDrafts] = useState<StaffDraft[]>([]);

  const staff = page.items as StaffRow[];
  const busy = fetcher.state !== "idle";

  useEffect(() => {
    const result = fetcher.data;
    if (!result || fetcher.state !== "idle") return;

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    const { created, failed } = result.data;
    if (created.length > 0) {
      toast.success(
        `Created ${created.length} staff account${created.length === 1 ? "" : "s"}`,
      );
    }

    if (failed.length === 0) {
      setDrafts([]);
    } else {
      toast.error(`${failed.length} could not be created: ${failed[0].reason}`);
      const stuck = new Set(failed.map((row) => row.email));
      setDrafts((previous) => previous.filter((row) => stuck.has(row.email)));
    }
  }, [fetcher.data, fetcher.state]);

  function addDraft() {
    setDrafts((previous) => [
      ...previous,
      emptyStaffRow(previous.at(-1)?.department),
    ]);
  }

  return (
    <Page
      description={
        actorRole === Role.MOD
          ? "You can create and manage faculty records, and promote a faculty member to moderator. Moderator and administrator accounts are managed by an administrator."
          : "Every staff account. Roles, departments and removals are all changed here."
      }
      actions={
        <Button onClick={addDraft} disabled={busy}>
          <Plus />
          Add staff
        </Button>
      }
    >
      {drafts.length > 0 && (
        <div className="mb-6 flex flex-col gap-3">
          <StaffGrid
            rows={drafts}
            roles={creatableRoles}
            disabled={busy}
            onChange={(id, field, value) =>
              setDrafts((previous) =>
                previous.map((row) =>
                  row._id === id ? { ...row, [field]: value } : row,
                ),
              )
            }
            onRemove={(id) =>
              setDrafts((previous) => previous.filter((row) => row._id !== id))
            }
          />

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setDrafts([])}
              disabled={busy}
            >
              <X />
              Discard
            </Button>
            <Button variant="secondary" onClick={addDraft} disabled={busy}>
              <Plus />
              Add row
            </Button>
            <Button
              disabled={busy || drafts.some((row) => !isDraftReady(row))}
              onClick={() => {
                const body = new FormData();
                body.set("staff", JSON.stringify(drafts));
                fetcher.submit(body, { method: "post" });
              }}
            >
              {busy
                ? "Creating…"
                : `Create ${drafts.length} account${drafts.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </div>
      )}

      <FilterBar
        activeCount={[filters.role, filters.department].filter(Boolean).length}
        onClear={() => set({ role: null, department: null })}
      >
        <Select
          value={filters.role}
          onValueChange={(value) => set({ role: value ?? null })}
          anyLabel="Any role"
          placeholder="Role"
          className="w-40"
          options={STAFF_ROLES.map((role) => ({
            value: role,
            label: ROLE_LABELS[role],
          }))}
        />

        <Select
          value={filters.department}
          onValueChange={(value) => set({ department: value ?? null })}
          anyLabel="Any department"
          placeholder="Department"
          className="w-44"
          options={Object.values(Branch).map((branch) => ({
            value: branch,
            label: branch,
          }))}
        />
      </FilterBar>

      {staff.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff match"
          description="Add a colleague with the button above, or widen the filters."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {staff.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface-raised p-3 shadow-xs sm:gap-4 sm:p-4"
            >
              <UserAvatar
                userId={member.userId}
                name={member.name}
                size="md"
                className="hidden sm:inline-flex"
              />

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-baseline gap-2">
                  <Link
                    to={`/faculty/${member.id}`}
                    className="truncate font-medium text-ink hover:text-primary-text"
                  >
                    {member.name}
                  </Link>
                  <span className="shrink-0 font-mono text-xs text-ink-faint">
                    {member.employeeId}
                  </span>
                </div>
                <p className="truncate text-sm text-ink-muted">
                  {member.designation ?? "—"}
                  {member.department ? ` · ${member.department}` : ""} ·{" "}
                  {member.email}
                </p>
              </div>

              <Badge
                variant={member.role === Role.FACULTY ? "neutral" : "primary"}
              >
                {ROLE_LABELS[member.role]}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <Pagination info={page} unit="staff" className="mt-4" />
    </Page>
  );
}

function isDraftReady(row: StaffDraft): boolean {
  return (
    row.name.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim()) &&
    row.employeeId.trim().length > 0
  );
}
