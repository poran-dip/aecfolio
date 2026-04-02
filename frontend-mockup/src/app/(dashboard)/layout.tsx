import { Sidebar } from "@/components/ui/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar
        role="STUDENT"
        userName="Current User"
        userEmail="user@aecian.ac.in"
      />
      <main className="flex-1 overflow-y-auto">
        <div className="page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
