import {
  BRANCH_LABELS,
  Branch,
  Capability,
  canChangeRole,
  canManageStaffWithRole,
  Role,
} from "@aecfolio/shared";
import { Save, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { Page } from "~/components/app/page";
import { UserAvatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ConfirmDialog } from "~/components/ui/dialog";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { toast } from "~/components/ui/toast";
import { api, attempt, unwrap, unwrapOr404 } from "~/lib/api.server";
import { requireCapability } from "~/lib/guard";
import { ROLE_LABELS } from "~/lib/nav";
import type { Route } from "./+types/faculty-detail";

export const handle = { title: "Faculty member" };

export function meta({ loaderData }: Route.MetaArgs) {
  const name = loaderData?.staff.name;
  return [{ title: name ? `${name} · AECFolio` : "Faculty · AECFolio" }];
}

const STAFF_ROLES = [Role.FACULTY, Role.MOD, Role.ADMIN] as const;

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireCapability(request, Capability.FACULTY_MANAGE);
  const client = api(request);

  const staff = await unwrapOr404(
    await client.api.faculty[":id"].$get({ param: { id: params.id } }),
  );

  return {
    staff,
    actor: session.user,
    canManage: canManageStaffWithRole(session.user.role, staff.role),
    roleTargets: STAFF_ROLES.filter((role) =>
      canChangeRole(session.user.role, staff.role, role),
    ),
    isSelf: staff.userId === session.user.id,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireCapability(request, Capability.FACULTY_MANAGE);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const client = api(request);

  if (intent === "details") {
    const department = String(form.get("department") ?? "");
    return attempt(async () =>
      unwrap(
        await client.api.faculty[":id"].$patch({
          param: { id: params.id },
          json: {
            employeeId: String(form.get("employeeId") ?? "").trim(),
            designation: String(form.get("designation") ?? "").trim() || null,
            department: department ? (department as Branch) : null,
          },
        }),
      ),
    );
  }

  if (intent === "role") {
    return attempt(async () =>
      unwrap(
        await client.api.users[":id"].role.$patch({
          param: { id: String(form.get("userId")) },
          json: { role: String(form.get("role")) as Role },
        }),
      ),
    );
  }

  if (intent === "delete") {
    return attempt(async () =>
      unwrap(
        await client.api.faculty[":id"].$delete({ param: { id: params.id } }),
      ),
    );
  }

  return { ok: false as const, message: "Unknown action", code: "VALIDATION" };
}

export default function FacultyDetailRoute({
  loaderData,
}: Route.ComponentProps) {
  const { staff, canManage, roleTargets, isSelf } = loaderData;
  const fetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [department, setDepartment] = useState(staff.department ?? "");
  const [nextRole, setNextRole] = useState<string | undefined>();

  const busy = fetcher.state !== "idle";

  useEffect(() => {
    const result = fetcher.data;
    if (!result || fetcher.state !== "idle") return;

    if (result.ok) {
      toast.success("Saved");
      setConfirmDelete(false);
      setNextRole(undefined);
      revalidator.revalidate();
    } else {
      toast.error(result.message);
    }
  }, [fetcher.data, fetcher.state, revalidator]);

  function submit(fields: Record<string, string>) {
    const body = new FormData();
    for (const [key, value] of Object.entries(fields)) body.set(key, value);
    fetcher.submit(body, { method: "post" });
  }

  return (
    <Page className="max-w-3xl">
      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex items-center gap-4">
            <UserAvatar userId={staff.userId} name={staff.name} size="xl" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-xl font-semibold text-ink">
                  {staff.name}
                </h2>
                <Badge
                  variant={staff.role === Role.FACULTY ? "neutral" : "primary"}
                >
                  {ROLE_LABELS[staff.role]}
                </Badge>
              </div>
              <p className="text-sm text-ink-muted">{staff.email}</p>
              <p className="text-sm text-ink-subtle">
                {staff.employeeId}
                {staff.department
                  ? ` · ${BRANCH_LABELS[staff.department]}`
                  : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        {!canManage && (
          <p className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
            An account with the {ROLE_LABELS[staff.role]} role is managed by an
            administrator. You can see it here but not change it.
          </p>
        )}

        {canManage && (
          <Card>
            <CardHeader>
              <CardTitle>Staff record</CardTitle>
              <CardDescription>
                The name and email come from the college account and are not
                editable here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <fetcher.Form method="post" className="flex flex-col gap-4">
                <input type="hidden" name="intent" value="details" />
                <input type="hidden" name="department" value={department} />

                <Field label="Employee ID" required>
                  {(props) => (
                    <Input
                      {...props}
                      name="employeeId"
                      defaultValue={staff.employeeId}
                      required
                    />
                  )}
                </Field>

                <Field label="Designation">
                  {(props) => (
                    <Input
                      {...props}
                      name="designation"
                      defaultValue={staff.designation ?? ""}
                    />
                  )}
                </Field>

                <Field
                  label="Department"
                  hint="Sets the default department on the student and verification lists."
                >
                  {(props) => (
                    <Select
                      {...props}
                      value={department || undefined}
                      onValueChange={(value) => setDepartment(value ?? "")}
                      anyLabel="None"
                      placeholder="None"
                      options={Object.values(Branch).map((branch) => ({
                        value: branch,
                        label: BRANCH_LABELS[branch],
                      }))}
                    />
                  )}
                </Field>

                <div>
                  <Button type="submit" disabled={busy}>
                    <Save />
                    Save record
                  </Button>
                </div>
              </fetcher.Form>
            </CardContent>
          </Card>
        )}

        {roleTargets.length > 0 && !isSelf && (
          <Card>
            <CardHeader>
              <CardTitle>Role</CardTitle>
              <CardDescription>
                {ROLE_LABELS[staff.role]} today. Every role change is
                audit-logged with who made it.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <Field label="Change to" className="w-52">
                {(props) => (
                  <Select
                    {...props}
                    value={nextRole}
                    onValueChange={setNextRole}
                    placeholder="Pick a role"
                    options={roleTargets.map((role) => ({
                      value: role,
                      label: ROLE_LABELS[role],
                    }))}
                  />
                )}
              </Field>
              <Button
                disabled={busy || !nextRole}
                onClick={() =>
                  submit({
                    intent: "role",
                    userId: staff.userId,
                    role: nextRole ?? "",
                  })
                }
              >
                <ShieldCheck />
                Apply
              </Button>
            </CardContent>
          </Card>
        )}

        {canManage && !isSelf && (
          <Card>
            <CardHeader>
              <CardTitle>Remove</CardTitle>
              <CardDescription>
                Soft-deletes the staff record. The person can no longer sign in
                to this app; nothing they reviewed is undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 />
                Remove {staff.name}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Remove ${staff.name}?`}
        description="Their staff record is soft-deleted and they lose access. Claims they verified keep their name on them."
        confirmLabel="Remove staff member"
        danger
        busy={busy}
        onConfirm={() => submit({ intent: "delete" })}
      />
    </Page>
  );
}
