import { redirect } from "react-router";
import { redirectByRole } from "~/lib/auth-redirect";
import { getSession } from "~/lib/session";
import type { Route } from "./+types/pending";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Pending | AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  if (!session) throw redirect("/");
  if (session.user.role !== "PENDING") redirectByRole(session.user.role);
  return { user: session.user };
}

export default function PendingPage() {
  return <div />;
}
