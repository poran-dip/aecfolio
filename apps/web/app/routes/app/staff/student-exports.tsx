import { Capability } from "@aecfolio/shared";
import { Placeholder } from "~/components/app/placeholder";
import { requireCapability } from "~/lib/guard";
import type { Route } from "./+types/student-exports";

export const handle = { title: "Bulk exports" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Bulk exports · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.CV_EXPORT_STANDARD);
  return null;
}

export default function StudentExportsRoute() {
  return <Placeholder name="Bulk exports" />;
}
