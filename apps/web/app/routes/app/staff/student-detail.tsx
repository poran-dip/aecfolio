import {
  BRANCH_LABELS,
  Capability,
  COURSE_LABELS,
  type StudentStatus,
  VerificationStatus,
} from "@aecfolio/shared";
import { FileDown, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { ClaimCard, type ClaimView } from "~/components/app/claim-card";
import { Page } from "~/components/app/page";
import {
  ReviewActions,
  reviewSubmitter,
} from "~/components/app/review-actions";
import { StudentStatusBadge } from "~/components/app/status-badge";
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
import { EmptyState } from "~/components/ui/empty-state";
import { toast } from "~/components/ui/toast";
import { api, attempt, unwrap, unwrapOr404 } from "~/lib/api.server";
import {
  CLAIM_KIND_LABELS,
  type ClaimKind,
  describeReview,
} from "~/lib/claims";
import { formatDateTime, formatGpa, semesterLabel } from "~/lib/format";
import { can, requireCapability } from "~/lib/guard";
import { reviewFromForm } from "~/lib/review.server";
import type { Route } from "./+types/student-detail";
import { RectifyDialog } from "./student-detail.rectify";

export const handle = { title: "Student" };

export function meta({ loaderData }: Route.MetaArgs) {
  const name = loaderData?.student.user.name;
  return [{ title: name ? `${name} · AECFolio` : "Student · AECFolio" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireCapability(request, Capability.STUDENT_READ);
  const client = api(request);

  const student = await unwrapOr404(
    await client.api.students[":id"].$get({ param: { id: params.id } }),
  );

  const canReview = can(session.user, Capability.CLAIM_REVIEW);
  const timeline = canReview
    ? await unwrap(
        await client.api["audit-logs"].$get({
          query: {
            entity: "Student",
            entityId: params.id,
            pageSize: "20",
          },
        }),
      ).catch(() => null)
    : null;

  return {
    student,
    timeline,
    canReview,
    canRectify: can(session.user, Capability.ACADEMIC_RECTIFY),
    canManage: can(session.user, Capability.STUDENT_MANAGE),
    canExport: can(session.user, Capability.CV_EXPORT_STANDARD),
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireCapability(request, Capability.STUDENT_READ);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const client = api(request);

  if (intent === "review") {
    if (!can(session.user, Capability.CLAIM_REVIEW)) {
      return {
        ok: false as const,
        message: "Not permitted",
        code: "FORBIDDEN",
      };
    }
    return reviewFromForm(request, form);
  }

  if (intent === "rectify") {
    if (!can(session.user, Capability.ACADEMIC_RECTIFY)) {
      return {
        ok: false as const,
        message: "Not permitted",
        code: "FORBIDDEN",
      };
    }

    const json: Record<string, unknown> = {};
    for (const key of ["rollNo", "branch", "course", "status"]) {
      const value = form.get(key);
      if (value) json[key] = String(value);
    }
    for (const key of ["semester", "admissionYear"]) {
      const value = form.get(key);
      if (value) json[key] = Number(value);
    }

    return attempt(async () =>
      unwrap(
        await client.api.students[":id"].$patch({
          param: { id: params.id },
          // biome-ignore lint/suspicious/noExplicitAny: fields are validated by the API
          json: json as any,
        }),
      ),
    );
  }

  if (intent === "delete") {
    if (!can(session.user, Capability.STUDENT_MANAGE)) {
      return {
        ok: false as const,
        message: "Not permitted",
        code: "FORBIDDEN",
      };
    }
    return attempt(async () =>
      unwrap(
        await client.api.students[":id"].$delete({ param: { id: params.id } }),
      ),
    );
  }

  if (intent === "export") {
    if (!can(session.user, Capability.CV_EXPORT_STANDARD)) {
      return {
        ok: false as const,
        message: "Not permitted",
        code: "FORBIDDEN",
      };
    }
    return attempt(async () =>
      unwrap(
        await client.api.cv.exports.standard.$post({
          json: { studentId: params.id },
        }),
      ),
    );
  }

  return { ok: false as const, message: "Unknown action", code: "VALIDATION" };
}

export default function StudentDetailRoute({
  loaderData,
}: Route.ComponentProps) {
  const { student, timeline, canReview, canRectify, canManage, canExport } =
    loaderData;
  const fetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rectifying, setRectifying] = useState(false);
  const busy = fetcher.state !== "idle";
  const submitReview = reviewSubmitter(fetcher);
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

    const data = result.data as Record<string, unknown>;
    if (data && "reviewed" in data) {
      toast.success(
        describeReview(
          data as {
            reviewed: string[];
            skipped: { id: string; reason: string }[];
          },
          "VERIFIED",
        ),
      );
    } else if (data && "export" in data) {
      toast.success("CV ready", {
        action: {
          label: "Download",
          onClick: () => {
            const row = data.export as { id: string };
            window.location.href = `/api/cv/exports/${row.id}/download`;
          },
        },
      });
    } else {
      toast.success("Saved");
    }

    revalidator.revalidate();
    setRectifying(false);
    setConfirmDelete(false);
  }, [fetcher.data, fetcher.state, revalidator]);

  const claims: Record<ClaimKind, ClaimView[]> = {
    results: [],
    achievements: student.achievements.map((row) => ({
      id: row.id,
      kind: "achievements" as const,
      title: row.title,
      detail: row.description,
      status: row.status as VerificationStatus,
      reviewedAt: row.reviewedAt,
      reviewer: row.reviewer,
      rejectionReason: "rejectionReason" in row ? row.rejectionReason : null,
      hasProof: Boolean(row.proofKey),
    })),
    certifications: student.certifications.map((row) => ({
      id: row.id,
      kind: "certifications" as const,
      title: row.name,
      detail: row.issuer,
      status: row.status as VerificationStatus,
      reviewedAt: row.reviewedAt,
      reviewer: row.reviewer,
      rejectionReason: "rejectionReason" in row ? row.rejectionReason : null,
      hasProof: Boolean(row.proofKey),
    })),
  };

  return (
    <Page
      actions={
        <div className="flex flex-wrap gap-2">
          {canExport && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                const body = new FormData();
                body.set("intent", "export");
                fetcher.submit(body, { method: "post" });
              }}
            >
              <FileDown />
              Export CV
            </Button>
          )}
          {canRectify && (
            <Button variant="secondary" onClick={() => setRectifying(true)}>
              <Pencil />
              Rectify record
            </Button>
          )}
          {canManage && (
            <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
              <Trash2 />
              Remove
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <UserAvatar
              userId={student.user.id}
              name={student.user.name}
              hasImage={Boolean(student.user.image)}
              size="xl"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-xl font-semibold text-ink">
                  {student.user.name}
                </h2>
                <StudentStatusBadge status={student.status as StudentStatus} />
              </div>
              <p className="text-sm text-ink-muted">
                {student.rollNo} · {COURSE_LABELS[student.course]}{" "}
                {BRANCH_LABELS[student.branch]}
              </p>
              <p className="text-sm text-ink-subtle">
                {semesterLabel(student.semester)} semester · admission year{" "}
                {student.admissionYear} · {student.user.email}
                {student.user.phone ? ` · ${student.user.phone}` : ""}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-heading text-2xl font-semibold text-ink tabular-nums">
                {formatGpa(student.cgpa)}
              </p>
              <p className="text-xs text-ink-faint">CGPA</p>
            </div>
          </CardContent>
        </Card>

        <ResultsCard results={student.results} />

        {(["achievements", "certifications"] as const).map((kind) => (
          <Card key={kind}>
            <CardHeader>
              <CardTitle>{CLAIM_KIND_LABELS[kind]}</CardTitle>
              <CardDescription>
                {canReview
                  ? "Every status is shown. Verify or reject each claim here."
                  : "Verified claims only. The proof link opens the file behind each one."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {claims[kind].length === 0 ? (
                <p className="text-sm text-ink-subtle">
                  Nothing submitted yet.
                </p>
              ) : (
                claims[kind].map((claim) => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    actions={
                      canReview &&
                      claim.status === VerificationStatus.PENDING ? (
                        <ReviewActions
                          kind={kind}
                          ids={[claim.id]}
                          busy={busy}
                          onSubmit={submitReview}
                        />
                      ) : undefined
                    }
                  />
                ))
              )}
            </CardContent>
          </Card>
        ))}

        <PortfolioCard student={student} />

        {canReview && timeline && (
          <Card>
            <CardHeader>
              <CardTitle>Record history</CardTitle>
              <CardDescription>
                Changes to this student's academic record. Claim decisions are
                logged against the claim, not the student.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeline.items.length === 0 ? (
                <p className="text-sm text-ink-subtle">
                  Nothing has changed since the record was created.
                </p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {timeline.items.map((entry) => (
                    <li key={entry.id} className="flex gap-3 text-sm">
                      <Badge variant="outline" size="sm" className="mt-0.5">
                        {entry.action}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-ink">
                          {entry.actorName}
                          <span className="text-ink-faint">
                            {" "}
                            · {formatDateTime(entry.createdAt)}
                          </span>
                        </p>
                        {entry.metadata ? (
                          <pre className="mt-1 overflow-x-auto rounded-md bg-surface-sunken px-2 py-1 text-xs text-ink-muted">
                            {JSON.stringify(entry.metadata)}
                          </pre>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {canRectify && (
        <RectifyDialog
          open={rectifying}
          onOpenChange={setRectifying}
          busy={busy}
          student={student}
          onSubmit={(values) => {
            const body = new FormData();
            body.set("intent", "rectify");
            for (const [key, value] of Object.entries(values)) {
              if (value !== undefined && value !== "")
                body.set(key, String(value));
            }
            fetcher.submit(body, { method: "post" });
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Remove this student?"
        description="The record is soft-deleted: it stops appearing anywhere in the app, and an administrator can restore it in the database. Their CV exports are kept."
        confirmLabel="Remove student"
        danger
        busy={busy}
        onConfirm={() => {
          const body = new FormData();
          body.set("intent", "delete");
          fetcher.submit(body, { method: "post" });
        }}
      />
    </Page>
  );
}

type ResultRow = {
  id: string;
  semester: number;
  sgpa: number | null;
  pendingSgpa: number | null;
  status: string;
  scheme: { totalCredits: number } | null;
};

function ResultsCard({ results }: { results: ResultRow[] }) {
  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Semester results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-subtle">No results submitted yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Semester results</CardTitle>
        <CardDescription>
          A pending SGPA does not count toward the CGPA until it is verified.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0 sm:p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-faint">
              <th scope="col" className="px-5 py-2 font-medium sm:px-6">
                Semester
              </th>
              <th scope="col" className="px-5 py-2 font-medium sm:px-6">
                SGPA
              </th>
              <th scope="col" className="px-5 py-2 font-medium sm:px-6">
                Credits
              </th>
              <th scope="col" className="px-5 py-2 font-medium sm:px-6">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-b-0">
                <th
                  scope="row"
                  className="px-5 py-2.5 text-left font-normal text-ink sm:px-6"
                >
                  {semesterLabel(row.semester)}
                </th>
                <td className="px-5 py-2.5 text-ink tabular-nums sm:px-6">
                  {formatGpa(row.sgpa ?? row.pendingSgpa)}
                </td>
                <td className="px-5 py-2.5 text-ink-muted tabular-nums sm:px-6">
                  {row.scheme?.totalCredits ?? "—"}
                </td>
                <td className="px-5 py-2.5 sm:px-6">
                  <Badge
                    size="sm"
                    variant={
                      row.status === VerificationStatus.VERIFIED
                        ? "verified"
                        : row.status === VerificationStatus.REJECTED
                          ? "rejected"
                          : "pending"
                    }
                  >
                    {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function PortfolioCard({
  student,
}: {
  student: {
    projects: { id: string; title: string; description: string }[];
    experiences: {
      id: string;
      title: string;
      organization: string;
      type: string;
    }[];
    skills: string[];
  };
}) {
  const empty =
    student.projects.length === 0 &&
    student.experiences.length === 0 &&
    student.skills.length === 0;

  if (empty) {
    return (
      <EmptyState
        title="Nothing on the portfolio yet"
        description="Projects, experience and skills appear here once the student adds them."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio</CardTitle>
        <CardDescription>
          Projects, experience and skills carry no verification status, so they
          are shown to everyone who can read this page.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {student.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {student.skills.map((skill) => (
              <Badge key={skill} variant="outline">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        {student.experiences.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-medium tracking-wide text-ink-faint uppercase">
              Experience
            </h3>
            <ul className="flex flex-col gap-2">
              {student.experiences.map((row) => (
                <li key={row.id} className="text-sm">
                  <span className="font-medium text-ink">{row.title}</span>
                  <span className="text-ink-muted"> · {row.organization}</span>
                  <span className="text-ink-faint"> · {row.type}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {student.projects.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-medium tracking-wide text-ink-faint uppercase">
              Projects
            </h3>
            <ul className="flex flex-col gap-2">
              {student.projects.map((row) => (
                <li key={row.id} className="text-sm">
                  <p className="font-medium text-ink">{row.title}</p>
                  {row.description && (
                    <p className="line-clamp-2 text-ink-muted">
                      {row.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
