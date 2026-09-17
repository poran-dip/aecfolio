import { Capability } from "@aecfolio/shared";
import { Placeholder } from "~/components/app/placeholder";
import { requireCapability } from "~/lib/guard";
import type { Route } from "./+types/history";

export const handle = { title: "Export history" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Export history · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.CV_EXPORT_SELF);
  return null;
}

export default function HistoryRoute() {
  return <Placeholder name="Export history" />;
}
