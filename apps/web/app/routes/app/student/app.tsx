import { Capability } from "@aecfolio/shared";
import { Placeholder } from "~/components/app/placeholder";
import { requireCapability } from "~/lib/guard";
import type { Route } from "./+types/app";

export const handle = { title: "My profile" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "My profile · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.PROFILE_WRITE_SELF);
  return null;
}

export default function AppRoute() {
  return <Placeholder name="My profile" />;
}
