import {
  BRANCH_LABELS,
  Branch,
  Capability,
  COURSE_LABELS,
  Course,
  SEMESTER_MAX,
  StudentStatus,
} from "@aecfolio/shared";
import { FileDown, GraduationCap, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useFetcher, useNavigate } from "react-router";
import {
  FilterBar,
  SearchField,
  useFilterNavigation,
} from "~/components/app/filter-bar";
import { Page } from "~/components/app/page";
import { StudentCard, type StudentRow } from "~/components/app/student-card";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { EmptyState } from "~/components/ui/empty-state";
import { Pagination } from "~/components/ui/pagination";
import { Select } from "~/components/ui/select";
import { SkeletonList } from "~/components/ui/skeleton";
import { toast } from "~/components/ui/toast";
import { api, attempt, unwrap } from "~/lib/api.server";
import { semesterLabel } from "~/lib/format";
import { can, requireCapability } from "~/lib/guard";
import {
  boolParam,
  enumParam,
  intParam,
  queryOf,
  stringParam,
} from "~/lib/query";
import type { Route } from "./+types/students";

export const handle = { title: "Students" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Students · AECFolio" }];
}

const SEMESTERS = Array.from({ length: SEMESTER_MAX }, (_, i) => i + 1);

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireCapability(request, Capability.STUDENT_READ);
  const params = new URL(request.url).searchParams;
  const client = api(request);

  const filters = {
    q: stringParam(params, "q"),
    branch: enumParam(params, "branch", Object.values(Branch)),
    course: enumParam(params, "course", Object.values(Course)),
    semester: intParam(params, "semester"),
    admissionYear: intParam(params, "admissionYear"),
    status: enumParam(params, "status", Object.values(StudentStatus)),
    allDepartments: boolParam(params, "allDepartments"),
    page: intParam(params, "page", 1),
  };

  const [page, me] = await Promise.all([
    unwrap(
      await client.api.students.$get({
        query: queryOf({ ...filters, allDepartments: filters.allDepartments }),
      }),
    ),
    unwrap(await client.api.me.$get()),
  ]);

  return {
    page,
    filters,
    ownDepartment: me.faculty?.department ?? null,
    canManage: can(session.user, Capability.STUDENT_MANAGE),
    canExport: can(session.user, Capability.CV_EXPORT_STANDARD),
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireCapability(request, Capability.CV_EXPORT_STANDARD);
  const form = await request.formData();
  const studentIds = form.getAll("studentId").map(String);

  if (studentIds.length === 0) {
    return {
      ok: false as const,
      message: "Select at least one student",
      code: "VALIDATION",
    };
  }

  const client = api(request);
  return attempt(async () =>
    unwrap(await client.api.cv.jobs.$post({ json: { studentIds } })),
  );
}

export default function StudentsRoute({ loaderData }: Route.ComponentProps) {
  const { page, filters, ownDepartment, canManage, canExport } = loaderData;
  const { set } = useFilterNavigation();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const students = page.items as StudentRow[];
  const allSelected =
    students.length > 0 && students.every((s) => selected.has(s.id));
  const busy = fetcher.state !== "idle";

  const activeFilters = [
    filters.q,
    filters.branch,
    filters.course,
    filters.semester,
    filters.admissionYear,
    filters.status,
    filters.allDepartments || undefined,
  ].filter(Boolean).length;

  function toggle(id: string, on: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function startExport() {
    const body = new FormData();
    for (const id of selected) body.append("studentId", id);

    fetcher.submit(body, { method: "post" });
  }

  useEffect(() => {
    const result = fetcher.data;
    if (!result || fetcher.state !== "idle") return;

    if (result.ok) {
      setSelected(new Set());
      toast.success(
        `Export started for ${result.data.total} student${result.data.total === 1 ? "" : "s"}`,
        {
          action: {
            label: "View progress",
            onClick: () => navigate("/students/exports"),
          },
        },
      );
    } else {
      toast.error(result.message);
    }
  }, [fetcher.data, fetcher.state, navigate]);

  return (
    <Page
      description={
        filters.allDepartments || filters.branch
          ? undefined
          : ownDepartment
            ? `Showing ${BRANCH_LABELS[ownDepartment]}. Switch the department filter to see others.`
            : undefined
      }
      actions={
        canManage && (
          <Button asChild>
            <Link to="/import">
              <Upload />
              Import students
            </Link>
          </Button>
        )
      }
    >
      <FilterBar
        activeCount={activeFilters}
        onClear={() =>
          set({
            q: null,
            branch: null,
            course: null,
            semester: null,
            admissionYear: null,
            status: null,
            allDepartments: null,
          })
        }
      >
        <SearchField placeholder="Roll number, name or email" />

        <Select
          value={
            filters.branch ??
            (filters.allDepartments ? undefined : (ownDepartment ?? undefined))
          }
          onValueChange={(value) =>
            set({
              branch: value ?? null,
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

        <Select
          value={filters.course}
          onValueChange={(value) => set({ course: value ?? null })}
          anyLabel="Any course"
          placeholder="Course"
          className="w-36"
          options={Object.values(Course).map((course) => ({
            value: course,
            label: COURSE_LABELS[course],
          }))}
        />

        <Select
          value={filters.semester ? String(filters.semester) : undefined}
          onValueChange={(value) => set({ semester: value ?? null })}
          anyLabel="Any semester"
          placeholder="Semester"
          className="w-36"
          options={SEMESTERS.map((semester) => ({
            value: String(semester),
            label: semesterLabel(semester),
          }))}
        />

        <Select
          value={filters.status ?? StudentStatus.ACTIVE}
          onValueChange={(value) => set({ status: value ?? null })}
          placeholder="Status"
          className="w-32"
          options={Object.values(StudentStatus).map((status) => ({
            value: status,
            label: status.charAt(0) + status.slice(1).toLowerCase(),
          }))}
        />
      </FilterBar>

      {canExport && students.length > 0 && (
        <div className="mb-3 flex items-center justify-between gap-4 rounded-lg border border-line bg-surface px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Checkbox
              checked={
                allSelected
                  ? true
                  : students.some((s) => selected.has(s.id))
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={(next) => {
                setSelected((previous) => {
                  const updated = new Set(previous);
                  for (const student of students) {
                    if (next === true) updated.add(student.id);
                    else updated.delete(student.id);
                  }
                  return updated;
                });
              }}
              aria-label="Select every student on this page"
            />
            <span>
              {selected.size > 0
                ? `${selected.size} selected`
                : "Select for bulk export"}
            </span>
          </div>

          {selected.size > 0 && (
            <Button size="sm" onClick={startExport} disabled={busy}>
              <FileDown />
              {busy ? "Starting…" : `Export ${selected.size} CVs`}
            </Button>
          )}
        </div>
      )}

      {students.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No students match"
          description={
            activeFilters > 0
              ? "Try widening the filters, or search across all departments."
              : "Once students are imported they appear here."
          }
          action={
            canManage && activeFilters === 0 ? (
              <Button asChild size="sm">
                <Link to="/import">Import students</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              selected={canExport ? selected.has(student.id) : undefined}
              onSelectedChange={
                canExport ? (on) => toggle(student.id, on) : undefined
              }
            />
          ))}
        </div>
      )}

      <Pagination info={page} unit="students" className="mt-4" />
    </Page>
  );
}

export function HydrateFallback() {
  return (
    <Page>
      <SkeletonList count={6} />
    </Page>
  );
}
