import { Sidebar } from "@/components/dashboard/ui/Sidebar";

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
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar
        role={role}
        userName={name ?? "User"}
        userEmail={email ?? ""}
        userImage={image}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
