import { Capability, CvExportJobStatus } from "@aecfolio/shared";
import { Download, FileDown, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Link, useRevalidator, useSearchParams } from "react-router";
import { Page } from "~/components/app/page";
import { Badge, type BadgeVariant } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";
import { api, unwrap } from "~/lib/api.server";
import { formatDateTime, formatRelative } from "~/lib/format";
import { requireCapability } from "~/lib/guard";
import { usePublicApiUrl } from "~/lib/public-env";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/student-exports";

export const handle = { title: "Bulk exports" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Bulk exports · AECFolio" }];
}

const RUNNING: string[] = [CvExportJobStatus.QUEUED, CvExportJobStatus.RUNNING];

const STATUS: Record<string, { label: string; tone: BadgeVariant }> = {
  [CvExportJobStatus.QUEUED]: { label: "Queued", tone: "neutral" },
  [CvExportJobStatus.RUNNING]: { label: "Running", tone: "primary" },
  [CvExportJobStatus.SUCCEEDED]: { label: "Done", tone: "verified" },
  [CvExportJobStatus.FAILED]: { label: "Failed", tone: "rejected" },
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.CV_EXPORT_STANDARD);
  const client = api(request);
  const openId = new URL(request.url).searchParams.get("job");

  const jobs = await unwrap(await client.api.cv.jobs.$get());

  const failures =
    openId && jobs.some((job) => job.id === openId)
      ? await unwrap(
          await client.api.cv.jobs[":id"].failures.$get({
            param: { id: openId },
          }),
        ).catch(() => [])
      : null;

  return { jobs, openId, failures };
}

export default function StudentExportsRoute({
  loaderData,
}: Route.ComponentProps) {
  const { jobs, openId, failures } = loaderData;
  const revalidator = useRevalidator();
  const apiUrl = usePublicApiUrl();
  const [, setParams] = useSearchParams();

  const active = jobs.some((job) => RUNNING.includes(job.status));

  // A running job has no push channel, so the page checks back while one is
  // in flight and stops as soon as none is.
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => revalidator.revalidate(), 4000);
    return () => clearInterval(timer);
  }, [active, revalidator]);

  if (jobs.length === 0) {
    return (
      <Page>
        <EmptyState
          icon={FileDown}
          title="No exports yet"
          description="Select students and start a bulk export; it appears here so you can leave the page and come back to it."
          action={
            <Button asChild size="sm">
              <Link to="/students">Go to students</Link>
            </Button>
          }
        />
      </Page>
    );
  }

  return (
    <Page
      description="Your twenty most recent bulk exports. Jobs are deleted after seven days."
      actions={
        <Button
          variant="secondary"
          onClick={() => revalidator.revalidate()}
          disabled={revalidator.state !== "idle"}
        >
          <RefreshCw
            className={cn(revalidator.state !== "idle" && "animate-spin")}
          />
          Refresh
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {jobs.map((job) => {
          const done = job.completed + job.failed;
          const percent =
            job.total > 0 ? Math.round((done / job.total) * 100) : 0;
          const status = STATUS[job.status] ?? {
            label: job.status,
            tone: "neutral" as const,
          };
          const open = job.id === openId;

          return (
            <Card key={job.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={status.tone}>{status.label}</Badge>
                    <span className="text-sm text-ink">
                      {job.total} student{job.total === 1 ? "" : "s"}
                    </span>
                    <span className="text-xs text-ink-faint">
                      started {formatRelative(job.createdAt)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {job.failed > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setParams(
                            (previous) => {
                              const next = new URLSearchParams(previous);
                              if (open) next.delete("job");
                              else next.set("job", job.id);
                              return next;
                            },
                            { preventScrollReset: true },
                          )
                        }
                      >
                        {open ? "Hide" : "Show"} {job.failed} failed
                      </Button>
                    )}

                    {job.status === CvExportJobStatus.SUCCEEDED && (
                      <Button asChild size="sm">
                        <a
                          href={`${apiUrl}/api/cv/jobs/${job.id}/download`}
                          download
                        >
                          <Download />
                          Download zip
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {RUNNING.includes(job.status) ? (
                  <div className="flex items-center gap-3">
                    <div
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken"
                      role="progressbar"
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Export progress"
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-ink-subtle tabular-nums">
                      {done} / {job.total}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-ink-subtle">
                    {job.completed} rendered
                    {job.failed > 0 ? `, ${job.failed} failed` : ""}
                    {job.finishedAt
                      ? ` · finished ${formatDateTime(job.finishedAt)}`
                      : ""}
                  </p>
                )}

                {job.error && (
                  <p className="rounded-lg bg-danger-surface px-3 py-2 text-sm text-danger-text">
                    {job.error}
                  </p>
                )}

                {open && failures && failures.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-line">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line bg-surface text-left text-xs text-ink-faint">
                          <th scope="col" className="px-3 py-2 font-medium">
                            Roll no.
                          </th>
                          <th scope="col" className="px-3 py-2 font-medium">
                            Name
                          </th>
                          <th scope="col" className="px-3 py-2 font-medium">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {failures.map((row) => (
                          <tr
                            key={row.studentId}
                            className="border-b border-line last:border-b-0"
                          >
                            <th
                              scope="row"
                              className="px-3 py-2 text-left font-normal text-ink"
                            >
                              {row.rollNo}
                            </th>
                            <td className="px-3 py-2 text-ink-muted">
                              {row.name}
                            </td>
                            <td className="px-3 py-2 text-danger-text">
                              {row.error}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Page>
  );
}
