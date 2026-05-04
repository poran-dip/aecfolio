import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { redirectByRole } from "@/lib/auth-redirect";

const DashboardPage = async () => {
  const session = await auth();
  if (!session) redirect("/");
  redirectByRole(session.user.role);
};

export default DashboardPage;
