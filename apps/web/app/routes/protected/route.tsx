import { Outlet, redirect } from "react-router";
import { AppSidebar } from "~/components/protected/sidebar/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { getSession } from "~/lib/session";
import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  if (!session) throw redirect("/");
  return { user: session.user };
}

export default function ProtectedLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="page-enter p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
