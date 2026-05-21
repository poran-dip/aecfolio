import FacultyProfile from "~/components/protected/faculty/profile";
import type { Route } from "./+types/profile";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Your Profile | AECFolio" }];
}

export default function FacultyProfilePage() {
  return <FacultyProfile />;
}
