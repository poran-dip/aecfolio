import { Placeholder } from "~/components/app/placeholder";
import { requireStaff } from "~/lib/guard";
import type { Route } from "./+types/profile";

export const handle = { title: "My account" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "My account · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireStaff(request);
  return null;
}

export default function ProfileRoute() {
  return <Placeholder name="My account" />;
}
