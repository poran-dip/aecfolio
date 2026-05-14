import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { redirectByRole } from "@/lib/auth-redirect";

const StudentLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  if (!session) redirect("/");
  if (session.user.role !== "STUDENT") redirectByRole(session.user.role);

  return <>{children}</>;
};

export default StudentLayout;
