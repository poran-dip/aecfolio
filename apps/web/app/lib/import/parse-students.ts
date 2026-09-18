import {
  ADMISSION_YEAR_MAX,
  ADMISSION_YEAR_MIN,
  Branch,
  Course,
  SEMESTER_MAX,
  SEMESTER_MIN,
} from "@aecfolio/shared";
import type { ImportField, ParsedRow, RowValues } from "./types";

export const COURSES = Object.values(Course);
export const BRANCHES = Object.values(Branch);

const FIELD_ALIASES: Record<string, string> = {};

function addAliases(canonical: string, aliases: string[]) {
  for (const alias of aliases)
    FIELD_ALIASES[alias.toLowerCase().replace(/[\s_\-.]/g, "")] = canonical;
}

addAliases("name", [
  "name",
  "fullname",
  "full name",
  "studentname",
  "student name",
]);
addAliases("email", [
  "email",
  "emailaddress",
  "email address",
  "mail",
  "emailid",
  "email id",
]);
addAliases("rollNo", [
  "rollno",
  "roll no",
  "roll",
  "rollnumber",
  "roll number",
  "enrollment",
  "enrollmentno",
  "enrollment no",
  "regno",
  "reg no",
  "registrationno",
]);
addAliases("course", ["course", "program", "programme", "degree"]);
addAliases("branch", [
  "branch",
  "dept",
  "department",
  "discipline",
  "specialization",
  "stream",
]);
addAliases("semester", [
  "semester",
  "sem",
  "currentsemester",
  "current semester",
  "semno",
  "sem no",
]);
addAliases("admissionYear", [
  "admissionyear",
  "admission year",
  "yearofadmission",
  "year of admission",
  "admitted",
  "batch",
  "batchyear",
  "joiningyear",
  "joining year",
  "intakeyear",
]);
addAliases("firstName", ["firstname", "first name", "fname", "givenname"]);
addAliases("lastName", [
  "lastname",
  "last name",
  "lname",
  "surname",
  "familyname",
]);

function normalizeKey(raw: string): string {
  return raw.toLowerCase().replace(/[\s_\-.]/g, "");
}

function mapColumns(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const header of headers) {
    const canonical = FIELD_ALIASES[normalizeKey(header)];
    if (canonical) map[header] = canonical;
  }

  return map;
}

function normalizeValue(field: string, raw: string): string {
  const value = raw.trim();

  if (field === "course") {
    const upper = value.toUpperCase().replace(/[\s.]/g, "");
    if (upper === "BTECH" || upper === "BE") return Course.BTECH;
    if (upper === "MTECH" || upper === "ME") return Course.MTECH;
    return upper;
  }

  if (field === "branch") return value.toUpperCase();

  if (field === "admissionYear") {
    const match = value.match(/\d{4}/);
    return match ? match[0] : value;
  }

  return value;
}

export function validateRow(row: RowValues): string[] {
  const errors: string[] = [];

  if (!row.name.trim()) errors.push("Missing name");

  if (!row.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email))
    errors.push("Invalid email");

  if (!row.rollNo.trim()) errors.push("Missing roll number");

  if (!(COURSES as string[]).includes(row.course))
    errors.push(`Invalid course: ${row.course || "empty"}`);

  if (!(BRANCHES as string[]).includes(row.branch))
    errors.push(`Invalid branch: ${row.branch || "empty"}`);

  const semester = Number.parseInt(row.semester, 10);
  if (
    Number.isNaN(semester) ||
    semester < SEMESTER_MIN ||
    semester > SEMESTER_MAX
  )
    errors.push(`Semester must be ${SEMESTER_MIN}–${SEMESTER_MAX}`);

  const year = Number.parseInt(row.admissionYear, 10);
  if (
    Number.isNaN(year) ||
    year < ADMISSION_YEAR_MIN ||
    year > ADMISSION_YEAR_MAX
  )
    errors.push(
      `Admission year must be ${ADMISSION_YEAR_MIN}–${ADMISSION_YEAR_MAX}`,
    );

  return errors;
}

export function emptyRow(defaults: Partial<RowValues> = {}): ParsedRow {
  const values: RowValues = {
    name: "",
    email: "",
    rollNo: "",
    course: "",
    branch: "",
    semester: "",
    admissionYear: "",
    ...defaults,
  };

  return {
    _id: `row-${crypto.randomUUID()}`,
    ...values,
    _errors: [],
  };
}

export function withErrors(row: ParsedRow): ParsedRow {
  return { ...row, _errors: validateRow(row) };
}

export function isBlank(row: ParsedRow): boolean {
  return (
    !row.name.trim() &&
    !row.email.trim() &&
    !row.rollNo.trim() &&
    !row.course &&
    !row.branch &&
    !row.semester &&
    !row.admissionYear
  );
}

export function parseRawRows(rawRows: Record<string, string>[]): ParsedRow[] {
  if (rawRows.length === 0) return [];
  const columns = mapColumns(Object.keys(rawRows[0]));

  return rawRows.map((raw) => {
    const read = (field: ImportField | "firstName" | "lastName") => {
      const header = Object.entries(columns).find(
        ([, mapped]) => mapped === field,
      )?.[0];
      return header ? normalizeValue(field, raw[header] ?? "") : "";
    };

    let name = read("name");
    if (!name) {
      name = [read("firstName"), read("lastName")].filter(Boolean).join(" ");
    }

    return withErrors(
      emptyRow({
        name,
        email: read("email"),
        rollNo: read("rollNo"),
        course: read("course"),
        branch: read("branch"),
        semester: read("semester"),
        admissionYear: read("admissionYear"),
      }),
    );
  });
}
