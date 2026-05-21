export interface ParsedRow {
  _id: string;
  name: string;
  email: string;
  rollNo: string;
  course: string;
  branch: string;
  semester: string;
  cgpa: string;
  _errors: string[];
}

export interface ImportResult {
  created: number;
  errors: { row: string; reason: string }[];
}
