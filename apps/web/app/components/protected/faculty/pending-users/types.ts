export interface PendingStudent {
  id: string;
  rollNo: string;
  course: string;
  branch: string;
  semester: number;
  cgpa: number | null;
  user: { id: string; name: string | null; email: string; createdAt: string };
}

export type EditableField =
  | "rollNo"
  | "course"
  | "branch"
  | "semester"
  | "cgpa";
