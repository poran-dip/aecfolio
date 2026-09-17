import { Outlet, redirect } from "react-router";
import { getSession } from "~/lib/session";
import type { Route } from "./+types/layout";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  if (!session) throw redirect("/");
  return { user: session.user };
}

export default function AppLayout() {
  return <Outlet />;
}
