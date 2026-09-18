import { Capability, CvExportKind } from "@aecfolio/shared";
import { getTemplateManifest } from "@aecfolio/ui";
import { Download, FileText } from "lucide-react";
import { Link } from "react-router";
import { Page } from "~/components/app/page";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import { api, unwrap } from "~/lib/api.server";
import { apiBase } from "~/lib/config";
import { formatBytes, formatDateTime } from "~/lib/format";
import { requireCapability } from "~/lib/guard";
import type { Route } from "./+types/history";

export const handle = { title: "Export history" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Export history · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.CV_EXPORT_SELF);
  const exports = await unwrap(await api(request).api.cv.exports.$get());
  return { exports };
}

export default function HistoryRoute({ loaderData }: Route.ComponentProps) {
  const { exports } = loaderData;

  return (
    <Page
      description="Every CV built from your profile, newest first. A file never changes after it is built, so an old one still reads the way it did when you sent it."
      actions={
        <Button asChild variant="secondary">
          <Link to="/export">Build a new one</Link>
        </Button>
      }
    >
      {exports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No CVs yet"
          description="Arrange one on the CV builder and it will show up here."
          action={
            <Button asChild>
              <Link to="/export">Go to the CV builder</Link>
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {exports.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-surface-raised px-4 py-3 shadow-xs"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-ink-faint">
                <FileText className="size-4" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {getTemplateManifest(row.templateId)?.name ?? row.templateId}
                </p>
                <p className="text-xs text-ink-subtle">
                  {formatDateTime(row.createdAt)} · {formatBytes(row.sizeBytes)}
                </p>
              </div>

              {row.kind === CvExportKind.STANDARD && (
                <Badge variant="neutral">Built by the college</Badge>
              )}

              <Button asChild size="sm" variant="secondary">
                <a href={`${apiBase}/api/cv/exports/${row.id}/download`}>
                  <Download />
                  Download
                </a>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
