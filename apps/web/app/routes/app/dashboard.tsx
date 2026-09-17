import { redirect } from "react-router";
import { requireSession } from "~/lib/guard";
import { homeFor } from "~/lib/nav";
import type { Route } from "./+types/dashboard";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request);
  return redirect(homeFor(session.user.role));
}
