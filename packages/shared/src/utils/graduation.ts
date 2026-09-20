import { SEMESTER_MAX } from "../constants/limits";
import { StudentStatus } from "../enums";
import type { Student } from "../schemas/student";

export const COURSE_DURATION_YEARS = SEMESTER_MAX / 2;

export function expectedGraduationYear(
  student: Pick<Student, "status" | "admissionYear">,
): number | null {
  if (student.status !== StudentStatus.ACTIVE) return null;
  return student.admissionYear + COURSE_DURATION_YEARS;
}
