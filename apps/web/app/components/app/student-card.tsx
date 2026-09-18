import {
  type Branch,
  COURSE_LABELS,
  type Course,
  type StudentStatus,
} from "@aecfolio/shared";
import { Link } from "react-router";
import { StudentStatusBadge } from "~/components/app/status-badge";
import { UserAvatar } from "~/components/ui/avatar";
import { Checkbox } from "~/components/ui/checkbox";
import { formatGpa, semesterLabel } from "~/lib/format";
import { cn } from "~/lib/utils";

export type StudentRow = {
  id: string;
  userId: string;
  rollNo: string;
  name: string;
  email: string;
  image: string | null;
  course: Course;
  branch: Branch;
  semester: number;
  admissionYear: number;
  status: StudentStatus;
  cgpa: number | null;
  titleSought: string | null;
};

export function StudentCard({
  student,
  selected,
  onSelectedChange,
}: {
  student: StudentRow;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
}) {
  const selectable = Boolean(onSelectedChange);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-surface-raised p-3 shadow-xs transition-colors sm:gap-4 sm:p-4",
        selected ? "border-primary bg-primary-surface/40" : "border-line",
      )}
    >
      {selectable && (
        <Checkbox
          checked={selected}
          onCheckedChange={(next) => onSelectedChange?.(next === true)}
          aria-label={`Select ${student.name}`}
        />
      )}

      <UserAvatar
        userId={student.userId}
        name={student.name}
        hasImage={Boolean(student.image)}
        size="md"
        className="hidden sm:inline-flex"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
          <Link
            to={`/students/${student.id}`}
            className="truncate font-medium text-ink hover:text-primary-text"
          >
            {student.name}
          </Link>
          <span className="shrink-0 font-mono text-xs text-ink-faint tabular-nums">
            {student.rollNo}
          </span>
        </div>
        <p className="truncate text-sm text-ink-muted">
          {COURSE_LABELS[student.course]} {student.branch} ·{" "}
          {semesterLabel(student.semester)} semester
          {student.titleSought ? ` · ${student.titleSought}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-ink tabular-nums">
            {formatGpa(student.cgpa)}
          </p>
          <p className="text-xs text-ink-faint">CGPA</p>
        </div>
        <StudentStatusBadge status={student.status} />
      </div>
    </div>
  );
}
