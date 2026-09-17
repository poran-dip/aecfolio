import { Capability } from "@aecfolio/shared";
import { Placeholder } from "~/components/app/placeholder";
import { requireCapability } from "~/lib/guard";
import type { Route } from "./+types/audit";

export const handle = { title: "Audit log" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Audit log · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.AUDIT_READ);
  return null;
}

export default function AuditRoute() {
  return <Placeholder name="Audit log" />;
}
