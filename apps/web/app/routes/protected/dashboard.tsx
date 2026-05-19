import { redirect } from "react-router";
import { redirectByRole } from "~/lib/auth-redirect";
import { getSession } from "~/lib/session";
import type { Route } from "./+types/dashboard";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Dashboard | AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  if (!session) throw redirect("/");
  redirectByRole(session.user.role);
}

export default function DashboardPage() {
  return null;
}
