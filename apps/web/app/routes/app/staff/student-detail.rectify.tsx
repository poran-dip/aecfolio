import {
  Branch,
  COURSE_LABELS,
  Course,
  SEMESTER_MAX,
  StudentStatus,
} from "@aecfolio/shared";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "~/components/ui/dialog";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { semesterLabel } from "~/lib/format";

const SEMESTERS = Array.from({ length: SEMESTER_MAX }, (_, i) => i + 1);

export type RectifyValues = {
  rollNo: string;
  branch: string;
  course: string;
  semester: number;
  admissionYear: number;
  status: string;
};

/**
 * Correcting one student's record, including their semester. Bulk promotion is
 * admin-only and lives on /cohort.
 */
export function RectifyDialog({
  open,
  onOpenChange,
  busy,
  student,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  student: RectifyValues;
  onSubmit: (values: RectifyValues) => void;
}) {
  const [values, setValues] = useState<RectifyValues>(student);

  function update<K extends keyof RectifyValues>(
    key: K,
    value: RectifyValues[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) setValues(student);
      }}
    >
      <DialogContent>
        <DialogHeader
          title="Rectify academic record"
          description="Corrections are audit-logged. Changing the semester here moves this student only."
        />
        <form
          className="flex flex-1 flex-col overflow-hidden"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(values);
          }}
        >
          <DialogBody className="flex flex-col gap-4">
            <Field label="Roll number" required>
              {(props) => (
                <Input
                  {...props}
                  value={values.rollNo}
                  onChange={(event) => update("rollNo", event.target.value)}
                />
              )}
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Course">
                {(props) => (
                  <Select
                    {...props}
                    value={values.course}
                    onValueChange={(value) =>
                      update("course", value ?? values.course)
                    }
                    options={Object.values(Course).map((course) => ({
                      value: course,
                      label: COURSE_LABELS[course],
                    }))}
                  />
                )}
              </Field>

              <Field label="Department">
                {(props) => (
                  <Select
                    {...props}
                    value={values.branch}
                    onValueChange={(value) =>
                      update("branch", value ?? values.branch)
                    }
                    options={Object.values(Branch).map((branch) => ({
                      value: branch,
                      label: branch,
                    }))}
                  />
                )}
              </Field>

              <Field label="Semester">
                {(props) => (
                  <Select
                    {...props}
                    value={String(values.semester)}
                    onValueChange={(value) =>
                      update("semester", Number(value ?? values.semester))
                    }
                    options={SEMESTERS.map((semester) => ({
                      value: String(semester),
                      label: semesterLabel(semester),
                    }))}
                  />
                )}
              </Field>

              <Field label="Admission year">
                {(props) => (
                  <Input
                    {...props}
                    type="number"
                    value={values.admissionYear}
                    onChange={(event) =>
                      update("admissionYear", Number(event.target.value))
                    }
                  />
                )}
              </Field>
            </div>

            <Field
              label="Status"
              hint="Alumni keep full access; they may need a CV years later."
            >
              {(props) => (
                <Select
                  {...props}
                  value={values.status}
                  onValueChange={(value) =>
                    update("status", value ?? values.status)
                  }
                  options={Object.values(StudentStatus).map((status) => ({
                    value: status,
                    label: status.charAt(0) + status.slice(1).toLowerCase(),
                  }))}
                />
              )}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              Save record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
