import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const MOCK_USER = {
    name: "Ankur Das",
    email: "ankur@aec.ac.in",
    image: null,
    role: "STUDENT" as "STUDENT" | "FACULTY",
  };

  const { name, email, image, role } = MOCK_USER as {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: "STUDENT" | "FACULTY";
  };

  return (
    <SidebarProvider>
      <AppSidebar
        role={role}
        userName={name ?? "User"}
        userEmail={email ?? ""}
        userImage={image}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="page-enter p-4 md:p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
