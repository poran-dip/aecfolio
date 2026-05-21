import FacultyAllStudents from "~/components/protected/faculty/all-students";
import type { Route } from "./+types/all-students";

export function meta(_: Route.MetaArgs) {
  return [{ title: "All Students | AECFolio" }];
}

export default function FacultyAllStudentsPage() {
  return <FacultyAllStudents />;
}
