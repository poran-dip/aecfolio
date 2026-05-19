import { Outlet, redirect } from "react-router";
import { getSession } from "~/lib/session";
import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  if (!session) throw redirect("/");
}

export default function ProtectedLayout() {
  return <Outlet />;
}
