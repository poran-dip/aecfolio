import { Capability } from "@aecfolio/shared";
import { Placeholder } from "~/components/app/placeholder";
import { requireCapability } from "~/lib/guard";
import type { Route } from "./+types/student-detail";

export const handle = { title: "Student" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Student · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.STUDENT_READ);
  return null;
}

export default function StudentDetailRoute() {
  return <Placeholder name="Student" />;
}
