import { Outlet } from "react-router";
import { AppShell } from "~/components/app/app-shell";
import { requireSession } from "~/lib/guard";
import type { Route } from "./+types/layout";

function readCollapsed(request: Request): boolean {
  const cookie = request.headers.get("cookie") ?? "";
  return /(?:^|;\s*)sidebar_collapsed=1(?:;|$)/.test(cookie);
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request);

  return {
    user: session.user,
    sidebarCollapsed: readCollapsed(request),
  };
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  return (
    <AppShell
      user={loaderData.user}
      defaultCollapsed={loaderData.sidebarCollapsed}
    >
      <Outlet />
    </AppShell>
  );
}
