import { Capability } from "@aecfolio/shared";
import { Placeholder } from "~/components/app/placeholder";
import { requireCapability } from "~/lib/guard";
import type { Route } from "./+types/faculty-detail";

export const handle = { title: "Faculty member" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Faculty member · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.FACULTY_MANAGE);
  return null;
}

export default function FacultyDetailRoute() {
  return <Placeholder name="Faculty member" />;
}
