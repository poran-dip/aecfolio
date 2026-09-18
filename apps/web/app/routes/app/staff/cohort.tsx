import {
  ADMISSION_YEAR_MAX,
  ADMISSION_YEAR_MIN,
  BRANCH_LABELS,
  Branch,
  Capability,
} from "@aecfolio/shared";
import { ArrowUpRight, Eye, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
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

  return result.ok ? { ...result, dryRun } : result;
}

export default function CohortRoute({ loaderData }: Route.ComponentProps) {
  const { schemes } = loaderData;
  const fetcher = useFetcher<typeof action>();

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

  const busy = fetcher.state !== "idle";

  useEffect(() => {
    const result = fetcher.data;
    if (!result || fetcher.state !== "idle") return;

    if (!result.ok) {
      toast.error(result.message);
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
  }, [fetcher.data, fetcher.state]);

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

  const missing = preview?.missingSchemes ?? [];
  const allFilled = missing.every(
    (row) => (credits[`${row.branch}:${row.semester}`] ?? "").trim() !== "",
  );
  const yearValid =
    Number(admissionYear) >= ADMISSION_YEAR_MIN &&
    Number(admissionYear) <= ADMISSION_YEAR_MAX;

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
          <CardContent className="flex flex-wrap items-end gap-4">
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
              variant="secondary"
              disabled={busy || !yearValid}
              onClick={() => submit(true)}
            >
              <Eye />
              {busy && !confirming ? "Checking…" : "Preview promotion"}
            </Button>
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
                <div className="flex flex-col gap-3 rounded-lg border border-danger-line bg-danger-surface p-4">
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
                      size="sm"
                      variant="secondary"
                      disabled={busy || !allFilled}
                      onClick={() => submit(true)}
                    >
                      Re-check with these credits
                    </Button>
                  </div>
                </div>
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
              SGPA, and the total credits its CGPA is weighted by.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {schemes.items.length === 0 ? (
              <p className="text-sm text-ink-subtle">
                No credit schemes exist yet. They are created as part of a
                promotion.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {schemes.items.map((scheme) => (
                  <Badge key={scheme.id} variant="neutral">
                    {scheme.branch} · {scheme.admissionYear} ·{" "}
                    {semesterLabel(scheme.semester)} · {scheme.totalCredits}cr
                  </Badge>
                ))}
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
