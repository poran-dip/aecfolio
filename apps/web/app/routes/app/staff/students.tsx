import { Capability } from "@aecfolio/shared";
import { Placeholder } from "~/components/app/placeholder";
import { requireCapability } from "~/lib/guard";
import type { Route } from "./+types/students";

export const handle = { title: "Students" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Students · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.STUDENT_READ);
  return null;
}

export default function StudentsRoute() {
  return <Placeholder name="Students" />;
}
