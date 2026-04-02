import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/ui/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { name, email, image, role } = session.user as {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: "STUDENT" | "FACULTY" | "ADMIN";
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
