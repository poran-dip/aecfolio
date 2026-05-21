import PendingVerifications from "~/components/protected/faculty/verification-queue";
import type { Route } from "./+types/pending-verifications";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Pending Verifications | AECFolio" }];
}

export default function FacultyPendingVerificationsPage() {
  return <PendingVerifications />;
}
