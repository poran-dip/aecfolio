import StudentProfile from "~/components/protected/students/profile";
import type { Route } from "./+types/profile";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Your Profile | AECFolio" }];
}

export default function StudentProfilePage() {
  return <StudentProfile />;
}
