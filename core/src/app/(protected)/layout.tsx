import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SessionProvider } from "next-auth/react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/");

  const { name, email, image, role } = session.user;

  return (
    <SessionProvider>
      <SidebarProvider>
        <AppSidebar
          role={role}
          userName={name ?? "User"}
          userEmail={email ?? ""}
          userImage={image ?? null}
        />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          <main className="flex-1 overflow-y-auto bg-slate-50">
            <div className="page-enter p-4 md:p-6">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
