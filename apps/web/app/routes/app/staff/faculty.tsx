import { Capability } from "@aecfolio/shared";
import { Placeholder } from "~/components/app/placeholder";
import { requireCapability } from "~/lib/guard";
import type { Route } from "./+types/faculty";

export const handle = { title: "Faculty" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Faculty · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.FACULTY_MANAGE);
  return null;
}

export default function FacultyRoute() {
  return <Placeholder name="Faculty" />;
}
