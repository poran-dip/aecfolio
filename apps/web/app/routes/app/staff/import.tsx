import { Capability } from "@aecfolio/shared";
import { Placeholder } from "~/components/app/placeholder";
import { requireCapability } from "~/lib/guard";
import type { Route } from "./+types/import";

export const handle = { title: "Import students" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Import students · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.STUDENT_MANAGE);
  return null;
}

export default function ImportRoute() {
  return <Placeholder name="Import students" />;
}
