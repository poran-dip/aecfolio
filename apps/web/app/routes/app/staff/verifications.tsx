import { Capability } from "@aecfolio/shared";
import { Placeholder } from "~/components/app/placeholder";
import { requireCapability } from "~/lib/guard";
import type { Route } from "./+types/verifications";

export const handle = { title: "Verifications" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Verifications · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.CLAIM_REVIEW);
  return null;
}

export default function VerificationsRoute() {
  return <Placeholder name="Verifications" />;
}
