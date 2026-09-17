import { Capability } from "@aecfolio/shared";
import { Placeholder } from "~/components/app/placeholder";
import { requireCapability } from "~/lib/guard";
import type { Route } from "./+types/cohort";

export const handle = { title: "Cohorts" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "Cohorts · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.COHORT_PROMOTE);
  return null;
}

export default function CohortRoute() {
  return <Placeholder name="Cohorts" />;
}
