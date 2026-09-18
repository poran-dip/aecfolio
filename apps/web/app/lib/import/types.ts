export const IMPORT_FIELDS = [
  "name",
  "email",
  "rollNo",
  "course",
  "branch",
  "semester",
  "admissionYear",
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];

export type RowValues = Record<ImportField, string>;

export interface ParsedRow extends RowValues {
  _id: string;
  _errors: string[];
}

export const FIELD_LABELS: Record<ImportField, string> = {
  name: "Name",
  email: "Email",
  rollNo: "Roll no.",
  course: "Course",
  branch: "Branch",
  semester: "Sem",
  admissionYear: "Admitted",
};
