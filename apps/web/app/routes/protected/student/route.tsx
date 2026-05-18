import { Outlet, redirect } from "react-router";
import { redirectByRole } from "~/lib/auth-redirect";
import { getSession } from "~/lib/session";
import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  if (!session) throw redirect("/");
  if (session.user.role !== "STUDENT") redirectByRole(session.user.role);
  return { user: session.user };
}

export default function StudentLayout() {
  return <Outlet />;
}
