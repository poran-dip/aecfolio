import type { ParsedRow } from "./types";

export const COURSES = ["BTECH", "MTECH", "BCA", "MCA"] as const;
export const BRANCHES = [
  "CSE",
  "ETE",
  "EE",
  "IE",
  "ME",
  "CE",
  "IPE",
  "CHE",
  "CA",
] as const;

type Course = (typeof COURSES)[number];
type Branch = (typeof BRANCHES)[number];

const FIELD_ALIASES: Record<string, string> = {};

const addAliases = (canonical: string, aliases: string[]) => {
  for (const a of aliases)
    FIELD_ALIASES[a.toLowerCase().replace(/[\s_\-.]/g, "")] = canonical;
};

addAliases("name", [
  "name",
  "fullname",
  "full name",
  "studentname",
  "student name",
  "firstname",
  "first name",
  "lastname",
  "last name",
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
addAliases("cgpa", ["cgpa", "gpa", "cpi", "aggregate", "percentage"]);
addAliases("firstName", [
  "firstname",
  "first name",
  "fname",
  "given name",
  "givenname",
]);
addAliases("lastName", [
  "lastname",
  "last name",
  "lname",
  "surname",
  "family name",
  "familyname",
]);

function normalizeKey(raw: string): string {
  return raw.toLowerCase().replace(/[\s_\-.]/g, "");
}

function mapColumns(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const h of headers) {
    const normalized = normalizeKey(h);
    if (FIELD_ALIASES[normalized]) map[h] = FIELD_ALIASES[normalized];
  }
  return map;
}

function normalizeValue(field: string, raw: string): string {
  const v = raw.trim();
  if (field === "course") {
    const upper = v.toUpperCase();
    if (upper === "B.TECH" || upper === "BE") return "BTECH";
    if (upper === "M.TECH" || upper === "ME") return "MTECH";
    return upper;
  }
  if (field === "branch") return v.toUpperCase();
  return v;
}

export function validateRow(row: Omit<ParsedRow, "_errors" | "_id">): string[] {
  const errors: string[] = [];
  if (!row.name.trim()) errors.push("Missing name");
  if (!row.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email))
    errors.push("Invalid email");
  if (!row.rollNo.trim()) errors.push("Missing roll number");
  if (!COURSES.includes(row.course as Course))
    errors.push(`Invalid course: ${row.course || "empty"}`);
  if (!BRANCHES.includes(row.branch as Branch))
    errors.push(`Invalid branch: ${row.branch || "empty"}`);
  const sem = parseInt(row.semester, 10);
  if (Number.isNaN(sem) || sem < 1 || sem > 8)
    errors.push("Semester must be 1–8");
  if (
    row.cgpa &&
    (Number.isNaN(parseFloat(row.cgpa)) ||
      parseFloat(row.cgpa) < 0 ||
      parseFloat(row.cgpa) > 10)
  )
    errors.push("CGPA must be 0–10");
  return errors;
}

export function parseRawRows(rawRows: Record<string, string>[]): ParsedRow[] {
  if (rawRows.length === 0) return [];
  const colMap = mapColumns(Object.keys(rawRows[0]));

  return rawRows.map((raw, i) => {
    const get = (field: string) => {
      const header = Object.entries(colMap).find(([, f]) => f === field)?.[0];
      return header ? normalizeValue(field, raw[header] ?? "") : "";
    };

    let name = get("name");
    if (!name) {
      const first = get("firstName");
      const last = get("lastName");
      name = [first, last].filter(Boolean).join(" ");
    }

    const row = {
      name,
      email: get("email"),
      rollNo: get("rollNo"),
      course: get("course"),
      branch: get("branch"),
      semester: get("semester"),
      cgpa: get("cgpa"),
    };

    return { _id: `row-${i}-${Date.now()}`, ...row, _errors: validateRow(row) };
  });
}
