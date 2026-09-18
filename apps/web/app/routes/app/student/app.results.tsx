import { SEMESTER_MAX, VerificationStatus } from "@aecfolio/shared";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ClaimStatusBadge } from "~/components/app/status-badge";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { toast } from "~/components/ui/toast";
import { ApiErrorWithDetails } from "~/lib/api";
import { formatGpa, semesterLabel } from "~/lib/format";
import { studentApi } from "~/lib/student-api";

export type ResultRow = {
  id: string;
  semester: number;
  sgpa: number | null;
  pendingSgpa: number | null;
  status: VerificationStatus;
  rejectionReason?: string | null;
};

export function ResultsSection({
  results,
  cgpa,
  currentSemester,
}: {
  results: ResultRow[];
  cgpa: number | null;
  currentSemester: number;
}) {
  const [rows, setRows] = useState(results);
  const [semester, setSemester] = useState<string | undefined>();
  const [sgpa, setSgpa] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const taken = new Set(rows.map((row) => row.semester));
  const open = Array.from({ length: SEMESTER_MAX }, (_, i) => i + 1).filter(
    (value) => !taken.has(value) && value <= currentSemester,
  );

  async function submit() {
    const value = Number(sgpa);
    if (!semester || !Number.isFinite(value)) return;

    setBusy(true);
    setError(null);
    try {
      const row = await studentApi.create<ResultRow>("results", {
        semester: Number(semester),
        pendingSgpa: value,
      });
      setRows((previous) =>
        [...previous, row].sort((a, b) => a.semester - b.semester),
      );
      setSemester(undefined);
      setSgpa("");
      toast.success("Sent for verification");
    } catch (thrown) {
      const message =
        thrown instanceof ApiErrorWithDetails
          ? thrown.message
          : "That could not be submitted.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Semester results</CardTitle>
          <div className="text-right">
            <p className="font-heading text-xl font-semibold text-ink tabular-nums">
              {formatGpa(cgpa)}
            </p>
            <p className="text-xs text-ink-faint">CGPA</p>
          </div>
        </div>
        <CardDescription>
          An SGPA counts toward your CGPA only once a moderator has verified it.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {rows.length > 0 && (
          <div className="flex flex-col gap-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-line px-3 py-2"
              >
                <span className="w-28 text-sm text-ink">
                  {semesterLabel(row.semester)} semester
                </span>
                <Badge variant="neutral">
                  {formatGpa(row.sgpa ?? row.pendingSgpa)}
                </Badge>
                <ClaimStatusBadge status={row.status} size="sm" />
                {row.status === VerificationStatus.REJECTED &&
                  row.rejectionReason && (
                    <span className="text-xs text-rejected">
                      {row.rejectionReason}
                    </span>
                  )}
              </div>
            ))}
          </div>
        )}

        {open.length === 0 ? (
          <p className="text-sm text-ink-subtle">
            Every semester up to your current one has a result submitted.
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Semester" className="w-40">
              {(props) => (
                <Select
                  {...props}
                  value={semester}
                  onValueChange={setSemester}
                  placeholder="Pick one"
                  options={open.map((value) => ({
                    value: String(value),
                    label: `${semesterLabel(value)} semester`,
                  }))}
                />
              )}
            </Field>

            <Field label="SGPA" className="w-32" error={error ?? undefined}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  step="0.01"
                  min={0}
                  max={10}
                  value={sgpa}
                  tone={error ? "invalid" : "normal"}
                  onChange={(event) => setSgpa(event.target.value)}
                />
              )}
            </Field>

            <Button
              disabled={busy || !semester || sgpa.trim() === ""}
              onClick={() => void submit()}
            >
              <Plus />
              {busy ? "Sending…" : "Submit for review"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
