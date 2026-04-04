import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"

const MOCK_USER = {
  name: "Ankur Das",
  email: "ankur@aec.ac.in",
  image: null,
  role: "STUDENT" as "STUDENT" | "FACULTY" | "ADMIN",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar user={MOCK_USER} />
      <main className="flex-1 overflow-y-auto">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}
