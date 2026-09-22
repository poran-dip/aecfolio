import {
  ADMISSION_YEAR_MAX,
  ADMISSION_YEAR_MIN,
  BRANCH_LABELS,
  Branch,
  Capability,
  SEMESTER_MAX,
  SEMESTER_MIN,
  TOTAL_CREDITS_MAX,
  TOTAL_CREDITS_MIN,
} from "@aecfolio/shared";
import { ArrowUpRight, Eye, Pencil, Plus, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { Page } from "~/components/app/page";
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
import { api, attempt, unwrap } from "~/lib/api.server";
import { semesterLabel } from "~/lib/format";
import { requireCapability } from "~/lib/guard";
import { intParam, queryOf } from "~/lib/query";
import type { Route } from "./+types/cohort";

export const handle = { title: "Cohorts" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Cohorts · AECFolio" }];
}

type MissingScheme = { branch: string; semester: number };

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.COHORT_PROMOTE);
  const params = new URL(request.url).searchParams;
  const admissionYear = intParam(params, "admissionYear");

  const schemes = await unwrap(
    await api(request).api.admin["credit-schemes"].$get({
      query: queryOf({ admissionYear, pageSize: 100 }),
    }),
  );

  return { schemes, admissionYear };
}

export async function action({ request }: Route.ActionArgs) {
  await requireCapability(request, Capability.COHORT_PROMOTE);
  const form = await request.formData();
  const client = api(request);
  const intent = String(form.get("intent") ?? "promote");

  if (intent === "createScheme") {
    const result = await attempt(async () =>
      unwrap(
        await client.api.admin["credit-schemes"].$post({
          json: {
            branch: String(form.get("branch")) as Branch,
            admissionYear: Number(form.get("admissionYear")),
            semester: Number(form.get("semester")),
            totalCredits: Number(form.get("totalCredits")),
          },
        }),
      ),
    );
    return { ...result, intent: "createScheme" as const };
  }

  if (intent === "updateScheme") {
    const result = await attempt(async () =>
      unwrap(
        await client.api.admin["credit-schemes"][":id"].$patch({
          param: { id: String(form.get("id")) },
          json: { totalCredits: Number(form.get("totalCredits")) },
        }),
      ),
    );
    return { ...result, intent: "updateScheme" as const };
  }

  const admissionYear = Number(form.get("admissionYear"));
  const branchValue = String(form.get("branch") ?? "");
  const dryRun = form.get("dryRun") === "true";

  let creditSchemes: unknown[] = [];
  try {
    creditSchemes = JSON.parse(String(form.get("creditSchemes") ?? "[]"));
  } catch {
    creditSchemes = [];
  }

  const result = await attempt(async () =>
    unwrap(
      await client.api.admin.promotions.$post({
        json: {
          admissionYear,
          branch: branchValue ? (branchValue as Branch) : undefined,
          dryRun,
          // biome-ignore lint/suspicious/noExplicitAny: validated by the API
          creditSchemes: creditSchemes as any,
        },
      }),
    ),
  );

  return result.ok
    ? { ...result, dryRun, intent: "promote" as const }
    : { ...result, intent: "promote" as const };
}

const EMPTY_SCHEME_FORM = {
  branch: "" as string,
  admissionYear: String(new Date().getFullYear() - 3),
  semester: "",
  totalCredits: "",
};

export default function CohortRoute({ loaderData }: Route.ComponentProps) {
  const { schemes } = loaderData;
  const fetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();

  const [admissionYear, setAdmissionYear] = useState(
    String(new Date().getFullYear() - 3),
  );
  const [branch, setBranch] = useState<string | undefined>();
  const [credits, setCredits] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{
    promoted: number;
    graduated: number;
    missingSchemes: MissingScheme[];
  } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const [schemeForm, setSchemeForm] = useState(EMPTY_SCHEME_FORM);
  const [editingSchemeId, setEditingSchemeId] = useState<string | null>(null);
  const [editingCredits, setEditingCredits] = useState("");

  const busy = fetcher.state !== "idle";
  const handledResultRef = useRef<typeof fetcher.data>(undefined);

  useEffect(() => {
    const result = fetcher.data;
    if (!result || fetcher.state !== "idle") return;
    if (handledResultRef.current === result) return;
    handledResultRef.current = result;

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    if (result.intent === "createScheme" || result.intent === "updateScheme") {
      toast.success(
        result.intent === "createScheme"
          ? "Credit scheme saved"
          : "Credit scheme updated",
      );
      setSchemeForm(EMPTY_SCHEME_FORM);
      setEditingSchemeId(null);
      revalidator.revalidate();
      return;
    }

    if (result.dryRun) {
      setPreview(result.data as typeof preview);
      return;
    }

    toast.success(
      `Promoted ${result.data.promoted}, graduated ${result.data.graduated}`,
    );
    setPreview(null);
    setCredits({});
    setConfirming(false);
  }, [fetcher.data, fetcher.state, revalidator]);

  function schemePayload() {
    return Object.entries(credits)
      .filter(([, value]) => value.trim() !== "")
      .map(([key, value]) => {
        const [schemeBranch, semester] = key.split(":");
        return {
          branch: schemeBranch,
          admissionYear: Number(admissionYear),
          semester: Number(semester),
          totalCredits: Number(value),
        };
      });
  }

  function submit(dryRun: boolean) {
    const body = new FormData();
    body.set("admissionYear", admissionYear);
    if (branch) body.set("branch", branch);
    body.set("dryRun", String(dryRun));
    body.set("creditSchemes", JSON.stringify(schemePayload()));
    fetcher.submit(body, { method: "post" });
  }

  function submitScheme() {
    const body = new FormData();
    body.set("intent", "createScheme");
    body.set("branch", schemeForm.branch);
    body.set("admissionYear", schemeForm.admissionYear);
    body.set("semester", schemeForm.semester);
    body.set("totalCredits", schemeForm.totalCredits);
    fetcher.submit(body, { method: "post" });
  }

  function submitSchemeEdit(id: string) {
    const body = new FormData();
    body.set("intent", "updateScheme");
    body.set("id", id);
    body.set("totalCredits", editingCredits);
    fetcher.submit(body, { method: "post" });
  }

  const missing = preview?.missingSchemes ?? [];
  const allFilled = missing.every(
    (row) => (credits[`${row.branch}:${row.semester}`] ?? "").trim() !== "",
  );
  const yearValid =
    Number(admissionYear) >= ADMISSION_YEAR_MIN &&
    Number(admissionYear) <= ADMISSION_YEAR_MAX;

  const schemeYear = Number(schemeForm.admissionYear);
  const schemeSemester = Number(schemeForm.semester);
  const schemeCredits = Number(schemeForm.totalCredits);
  const schemeFormValid =
    Boolean(schemeForm.branch) &&
    Number.isInteger(schemeYear) &&
    schemeYear >= ADMISSION_YEAR_MIN &&
    schemeYear <= ADMISSION_YEAR_MAX &&
    Number.isInteger(schemeSemester) &&
    schemeSemester >= SEMESTER_MIN &&
    schemeSemester <= SEMESTER_MAX &&
    Number.isInteger(schemeCredits) &&
    schemeCredits >= TOTAL_CREDITS_MIN &&
    schemeCredits <= TOTAL_CREDITS_MAX;

  return (
    <Page description="Promoting a cohort moves every active student in it up one semester, and graduates anyone finishing their final one. A semester with no credit scheme cannot accept SGPA submissions, so the preview names every gap before anything moves.">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Choose a cohort</CardTitle>
            <CardDescription>
              Leave the department empty to promote the whole admission year.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <fetcher.Form
              className="flex flex-wrap items-end gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                submit(true);
              }}
            >
              <Field label="Admission year" required className="w-40">
                {(props) => (
                  <Input
                    {...props}
                    type="number"
                    min={ADMISSION_YEAR_MIN}
                    max={ADMISSION_YEAR_MAX}
                    value={admissionYear}
                    onChange={(event) => {
                      setAdmissionYear(event.target.value);
                      setPreview(null);
                    }}
                  />
                )}
              </Field>

              <Field label="Department" className="w-52">
                {(props) => (
                  <Select
                    {...props}
                    value={branch}
                    onValueChange={(value) => {
                      setBranch(value);
                      setPreview(null);
                    }}
                    anyLabel="Every department"
                    placeholder="Every department"
                    options={Object.values(Branch).map((value) => ({
                      value,
                      label: BRANCH_LABELS[value],
                    }))}
                  />
                )}
              </Field>

              <Button
                type="submit"
                variant="secondary"
                disabled={busy || !yearValid}
              >
                <Eye />
                {busy && !confirming ? "Checking…" : "Preview promotion"}
              </Button>
            </fetcher.Form>
          </CardContent>
        </Card>

        {preview && (
          <Card>
            <CardHeader>
              <CardTitle>What this would do</CardTitle>
              <CardDescription>
                Nothing has moved yet. This is a dry run.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-6">
                <Stat label="Promoted" value={preview.promoted} />
                <Stat label="Graduated" value={preview.graduated} />
                <Stat
                  label="Missing schemes"
                  value={missing.length}
                  danger={missing.length > 0}
                />
              </div>

              {missing.length > 0 ? (
                <fetcher.Form
                  className="flex flex-col gap-3 rounded-lg border border-danger-line bg-danger-surface p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submit(true);
                  }}
                >
                  <p className="flex items-start gap-2 text-sm text-danger-text">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    These semesters have no credit scheme for admission year{" "}
                    {admissionYear}. Students promoted into them could not
                    submit an SGPA at all. Set the total credits for each before
                    promoting.
                  </p>

                  <div className="flex flex-col gap-2">
                    {missing.map((row) => {
                      const key = `${row.branch}:${row.semester}`;
                      return (
                        <div
                          key={key}
                          className="flex flex-wrap items-center gap-3"
                        >
                          <Badge
                            variant="outline"
                            className="w-40 justify-center"
                          >
                            {row.branch} · {semesterLabel(row.semester)}
                          </Badge>
                          <Input
                            type="number"
                            min={1}
                            placeholder="Total credits"
                            aria-label={`Total credits for ${row.branch} ${semesterLabel(row.semester)} semester`}
                            className="w-40"
                            value={credits[key] ?? ""}
                            onChange={(event) =>
                              setCredits((previous) => ({
                                ...previous,
                                [key]: event.target.value,
                              }))
                            }
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <Button
                      type="submit"
                      size="sm"
                      variant="secondary"
                      disabled={busy || !allFilled}
                    >
                      Re-check with these credits
                    </Button>
                  </div>
                </fetcher.Form>
              ) : (
                <p className="rounded-lg border border-primary-line bg-primary-surface px-4 py-3 text-sm text-primary-text">
                  Every semester this cohort moves into already has a credit
                  scheme. The promotion is safe to run.
                </p>
              )}

              <div>
                <Button
                  disabled={
                    busy ||
                    (missing.length > 0 && !allFilled) ||
                    preview.promoted + preview.graduated === 0
                  }
                  onClick={() => setConfirming(true)}
                >
                  <ArrowUpRight />
                  Promote this cohort
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Credit schemes</CardTitle>
            <CardDescription>
              Every (department, admission year, semester) that can accept an
              SGPA, and the total credits its CGPA is weighted by. Add one
              directly here — useful for a semester a new import needs before
              any promotion has run — or edit an existing one's credits. Saving
              one for a triple that already exists just updates it.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <fetcher.Form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                submitScheme();
              }}
            >
              <Field label="Department" className="w-44">
                {(props) => (
                  <Select
                    {...props}
                    value={schemeForm.branch || undefined}
                    onValueChange={(value) =>
                      setSchemeForm((previous) => ({
                        ...previous,
                        branch: value ?? "",
                      }))
                    }
                    placeholder="Department"
                    options={Object.values(Branch).map((value) => ({
                      value,
                      label: BRANCH_LABELS[value],
                    }))}
                  />
                )}
              </Field>

              <Field label="Admission year" className="w-32">
                {(props) => (
                  <Input
                    {...props}
                    type="number"
                    min={ADMISSION_YEAR_MIN}
                    max={ADMISSION_YEAR_MAX}
                    value={schemeForm.admissionYear}
                    onChange={(event) =>
                      setSchemeForm((previous) => ({
                        ...previous,
                        admissionYear: event.target.value,
                      }))
                    }
                  />
                )}
              </Field>

              <Field label="Semester" className="w-28">
                {(props) => (
                  <Input
                    {...props}
                    type="number"
                    min={SEMESTER_MIN}
                    max={SEMESTER_MAX}
                    value={schemeForm.semester}
                    onChange={(event) =>
                      setSchemeForm((previous) => ({
                        ...previous,
                        semester: event.target.value,
                      }))
                    }
                  />
                )}
              </Field>

              <Field label="Total credits" className="w-32">
                {(props) => (
                  <Input
                    {...props}
                    type="number"
                    min={TOTAL_CREDITS_MIN}
                    max={TOTAL_CREDITS_MAX}
                    value={schemeForm.totalCredits}
                    onChange={(event) =>
                      setSchemeForm((previous) => ({
                        ...previous,
                        totalCredits: event.target.value,
                      }))
                    }
                  />
                )}
              </Field>

              <Button type="submit" disabled={busy || !schemeFormValid}>
                <Plus />
                Save scheme
              </Button>
            </fetcher.Form>

            {schemes.items.length === 0 ? (
              <p className="text-sm text-ink-subtle">
                No credit schemes exist yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {schemes.items.map((scheme) =>
                  editingSchemeId === scheme.id ? (
                    <fetcher.Form
                      key={scheme.id}
                      className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-1 pl-3 text-sm"
                      onSubmit={(event) => {
                        event.preventDefault();
                        submitSchemeEdit(scheme.id);
                      }}
                    >
                      <span>
                        {scheme.branch} · {scheme.admissionYear} ·{" "}
                        {semesterLabel(scheme.semester)}
                      </span>
                      <Input
                        type="number"
                        min={TOTAL_CREDITS_MIN}
                        max={TOTAL_CREDITS_MAX}
                        aria-label={`Total credits for ${scheme.branch} ${scheme.admissionYear} ${semesterLabel(scheme.semester)}`}
                        className="h-7 w-20"
                        value={editingCredits}
                        onChange={(event) =>
                          setEditingCredits(event.target.value)
                        }
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={
                          busy ||
                          !Number.isInteger(Number(editingCredits)) ||
                          Number(editingCredits) < TOTAL_CREDITS_MIN ||
                          Number(editingCredits) > TOTAL_CREDITS_MAX
                        }
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => setEditingSchemeId(null)}
                      >
                        Cancel
                      </Button>
                    </fetcher.Form>
                  ) : (
                    <button
                      key={scheme.id}
                      type="button"
                      className="group"
                      onClick={() => {
                        setEditingSchemeId(scheme.id);
                        setEditingCredits(String(scheme.totalCredits));
                      }}
                    >
                      <Badge
                        variant="neutral"
                        className="gap-1.5 group-hover:bg-surface-sunken"
                      >
                        {scheme.branch} · {scheme.admissionYear} ·{" "}
                        {semesterLabel(scheme.semester)} · {scheme.totalCredits}
                        cr
                        <Pencil className="size-3 text-ink-faint" />
                      </Badge>
                    </button>
                  ),
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Promote this cohort?"
        description={`${preview?.promoted ?? 0} students move up a semester and ${preview?.graduated ?? 0} become alumni. There is no undo — correcting it afterwards means editing students one at a time.`}
        confirmLabel="Promote"
        busy={busy}
        onConfirm={() => submit(false)}
      />
    </Page>
  );
}

function Stat({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span
        className={`font-heading text-2xl font-semibold tabular-nums ${danger ? "text-danger" : "text-ink"}`}
      >
        {value}
      </span>
      <span className="text-xs text-ink-faint">{label}</span>
    </div>
  );
}
