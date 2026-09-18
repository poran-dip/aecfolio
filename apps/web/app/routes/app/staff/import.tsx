import { Capability, StudentStatus } from "@aecfolio/shared";
import { FileSpreadsheet, Plus, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useFetcher } from "react-router";
import { ImportGrid } from "~/components/app/import-grid";
import { Page } from "~/components/app/page";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";
import { toast } from "~/components/ui/toast";
import { api, attempt, unwrap } from "~/lib/api.server";
import { requireCapability } from "~/lib/guard";
import {
  emptyRow,
  isBlank,
  parseRawRows,
  withErrors,
} from "~/lib/import/parse-students";
import { readSpreadsheet } from "~/lib/import/read-spreadsheet";
import type { ImportField, ParsedRow } from "~/lib/import/types";
import type { Route } from "./+types/import";

export const handle = { title: "Import students" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Import students · AECFolio" }];
}

const IMPORT_MAX = 500;

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.STUDENT_MANAGE);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  await requireCapability(request, Capability.STUDENT_MANAGE);

  const form = await request.formData();
  const payload = String(form.get("students") ?? "[]");

  let students: unknown;
  try {
    students = JSON.parse(payload);
  } catch {
    return {
      ok: false as const,
      message: "Could not read the rows",
      code: "VALIDATION",
    };
  }

  if (!Array.isArray(students) || students.length === 0) {
    return {
      ok: false as const,
      message: "There is nothing to import",
      code: "VALIDATION",
    };
  }

  const client = api(request);
  return attempt(async () =>
    unwrap(
      await client.api.students.import.$post({
        // biome-ignore lint/suspicious/noExplicitAny: each row is validated by the API
        json: { students: students as any },
      }),
    ),
  );
}

export default function ImportRoute() {
  const fetcher = useFetcher<typeof action>();
  const fileInput = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const busy = fetcher.state !== "idle";
  const result = fetcher.data?.ok ? fetcher.data.data : null;
  const invalid = rows.filter((row) => row._errors.length > 0);
  const ready = rows.length > 0 && invalid.length === 0;

  useEffect(() => {
    const data = fetcher.data;
    if (!data || fetcher.state !== "idle") return;

    if (!data.ok) {
      toast.error(data.message);
      return;
    }

    const { created, failed } = data.data;
    if (failed.length === 0) {
      toast.success(`Imported ${created.length} students`);
      setRows([]);
      setFileName(null);
    } else {
      toast.error(
        `${created.length} imported, ${failed.length} could not be created`,
      );
      // Keep only what failed, so the grid becomes the fix-up list.
      const failedRolls = new Set(failed.map((row) => row.rollNo));
      setRows((previous) =>
        previous.filter((row) => failedRolls.has(row.rollNo)),
      );
    }
  }, [fetcher.data, fetcher.state]);

  async function onFiles(file: File) {
    setReading(true);
    try {
      const raw = await readSpreadsheet(file);
      const parsed = parseRawRows(raw);
      if (parsed.length === 0) {
        toast.error("That file has no rows this app recognises");
        return;
      }
      setRows(parsed.slice(0, IMPORT_MAX));
      setFileName(file.name);
      if (parsed.length > IMPORT_MAX) {
        toast.error(
          `Only the first ${IMPORT_MAX} rows were loaded — that is the per-import limit.`,
        );
      }
    } catch {
      toast.error("That file could not be read. CSV and XLSX are supported.");
    } finally {
      setReading(false);
    }
  }

  function update(id: string, field: ImportField, value: string) {
    setRows((previous) =>
      previous.map((row) =>
        row._id === id ? withErrors({ ...row, [field]: value }) : row,
      ),
    );
  }

  function addRow() {
    const last = rows.at(-1);
    setRows((previous) => [
      ...previous,
      // Carry the cohort down: only the person changes between adjacent rows.
      emptyRow(
        last
          ? {
              course: last.course,
              branch: last.branch,
              semester: last.semester,
              admissionYear: last.admissionYear,
            }
          : {},
      ),
    ]);
  }

  function submit() {
    const payload = rows
      .filter((row) => !isBlank(row))
      .map((row) => ({
        name: row.name.trim(),
        email: row.email.trim(),
        rollNo: row.rollNo.trim(),
        course: row.course,
        branch: row.branch,
        semester: Number(row.semester),
        admissionYear: Number(row.admissionYear),
        status: StudentStatus.ACTIVE,
      }));

    const body = new FormData();
    body.set("students", JSON.stringify(payload));
    fetcher.submit(body, { method: "post" });
  }

  return (
    <Page
      description="Drop a CSV or XLSX of students, correct anything the grid flags, then import. Adding one student is the same screen: use Add row."
      actions={
        rows.length > 0 && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setRows([]);
              setFileName(null);
            }}
          >
            <X />
            Start over
          </Button>
        )
      }
    >
      {rows.length === 0 ? (
        <Dropzone
          reading={reading}
          onFile={onFiles}
          onAddRow={addRow}
          inputRef={fileInput}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-muted">
              {fileName ? `${fileName} · ` : ""}
              {rows.length} row{rows.length === 1 ? "" : "s"}
              {invalid.length > 0 && (
                <span className="text-danger-text">
                  {" "}
                  · {invalid.length} need fixing
                </span>
              )}
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={addRow}
                disabled={busy}
              >
                <Plus />
                Add row
              </Button>
              <Button size="sm" onClick={submit} disabled={busy || !ready}>
                <Upload />
                {busy ? "Importing…" : `Import ${rows.length}`}
              </Button>
            </div>
          </div>

          <ImportGrid
            rows={rows}
            onChange={update}
            onRemove={(id) =>
              setRows((previous) => previous.filter((row) => row._id !== id))
            }
            disabled={busy}
          />

          {invalid.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>What needs fixing</CardTitle>
                <CardDescription>
                  Rows are checked here before anything is sent, so the import
                  either runs clean or tells you exactly which rows the server
                  refused.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 pt-0">
                {invalid.slice(0, 10).map((row) => (
                  <p key={row._id} className="text-sm text-ink-muted">
                    <span className="font-medium text-ink">
                      {row.rollNo || row.email || "Untitled row"}
                    </span>{" "}
                    — {row._errors.join(", ")}
                  </p>
                ))}
                {invalid.length > 10 && (
                  <p className="text-sm text-ink-faint">
                    and {invalid.length - 10} more
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {result && result.failed.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Rows the server refused</CardTitle>
            <CardDescription>
              {result.created.length} of {result.total} were created. These are
              still in the grid above so they can be corrected and re-sent.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0 sm:p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-faint">
                  <th scope="col" className="px-5 py-2 font-medium sm:px-6">
                    Roll no.
                  </th>
                  <th scope="col" className="px-5 py-2 font-medium sm:px-6">
                    Email
                  </th>
                  <th scope="col" className="px-5 py-2 font-medium sm:px-6">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.failed.map((row) => (
                  <tr
                    key={`${row.rollNo}-${row.row}`}
                    className="border-b border-line last:border-b-0"
                  >
                    <th
                      scope="row"
                      className="px-5 py-2.5 text-left font-normal text-ink sm:px-6"
                    >
                      {row.rollNo}
                    </th>
                    <td className="px-5 py-2.5 text-ink-muted sm:px-6">
                      {row.email}
                    </td>
                    <td className="px-5 py-2.5 text-danger-text sm:px-6">
                      {row.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {result && result.failed.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title={`${result.created.length} students imported`}
            description="They can sign in with their college Google account straight away."
            action={
              <Button asChild size="sm">
                <Link to="/students">View students</Link>
              </Button>
            }
          />
        </div>
      )}
    </Page>
  );
}

function Dropzone({
  reading,
  onFile,
  onAddRow,
  inputRef,
}: {
  reading: boolean;
  onFile: (file: File) => void;
  onAddRow: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [over, setOver] = useState(false);

  return (
    // Dragging is an enhancement; the button below is the accessible path.
    // biome-ignore lint/a11y/noStaticElementInteractions: drop target has no keyboard equivalent
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={cnDropzone(over)}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-sunken text-ink-faint">
        <FileSpreadsheet className="size-6" />
      </span>

      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-ink">
          Drop a CSV or XLSX here
        </p>
        <p className="max-w-md text-sm text-ink-muted">
          Columns are matched by name, so "Roll No", "Registration Number" and
          "roll_no" all work. Up to {IMPORT_MAX} students at a time.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button
          disabled={reading}
          onClick={() => inputRef.current?.click()}
          variant="secondary"
        >
          {reading ? "Reading…" : "Choose a file"}
        </Button>
        <Button variant="ghost" onClick={onAddRow}>
          <Plus />
          Add a row by hand
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </div>
  );
}

function cnDropzone(over: boolean): string {
  return [
    "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors",
    over
      ? "border-primary bg-primary-surface"
      : "border-line-strong bg-surface-raised",
  ].join(" ");
}
