import { Sidebar } from "@/components/ui/sidebar";

const MOCK_USER = {
  name: "Ankur Das",
  email: "ankur@aec.ac.in",
  image: null,
  role: "STUDENT" as "STUDENT" | "FACULTY" | "ADMIN",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { name, email, image, role } = MOCK_USER;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar
        role={role}
        userName={name}
        userEmail={email}
        userImage={image}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="page-enter">{children}</div>
      </main>
    </div>
  );
}
