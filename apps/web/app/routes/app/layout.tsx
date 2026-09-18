import { Capability } from "@aecfolio/shared";
import { Outlet } from "react-router";
import { AppShell } from "~/components/app/app-shell";
import { api, unwrap } from "~/lib/api.server";
import { can, requireSession } from "~/lib/guard";
import type { Route } from "./+types/layout";

function readCollapsed(request: Request): boolean {
  const cookie = request.headers.get("cookie") ?? "";
  return /(?:^|;\s*)sidebar_collapsed=1(?:;|$)/.test(cookie);
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request);
  const client = api(request);

  const pendingClaims = can(session.user, Capability.CLAIM_REVIEW)
    ? unwrap(await client.api.verifications.$get({ query: { pageSize: "1" } }))
        .then((queue) => queue.total)
        .catch(() => undefined)
    : undefined;

  return {
    user: session.user,
    sidebarCollapsed: readCollapsed(request),
    counts: { verifications: await pendingClaims },
  };
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  return (
    <AppShell
      user={loaderData.user}
      defaultCollapsed={loaderData.sidebarCollapsed}
      counts={loaderData.counts}
    >
      <Outlet />
    </AppShell>
  );
}
