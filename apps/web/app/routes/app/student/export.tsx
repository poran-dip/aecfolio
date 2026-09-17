import { Capability } from "@aecfolio/shared";
import { Placeholder } from "~/components/app/placeholder";
import { requireCapability } from "~/lib/guard";
import type { Route } from "./+types/export";

export const handle = { title: "CV builder" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "CV builder · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.CV_EXPORT_SELF);
  return null;
}

export default function ExportRoute() {
  return <Placeholder name="CV builder" />;
}
