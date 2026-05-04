import { redirect } from "next/navigation";
import PendingApprovalScreen from "@/components/dashboard/pending-approval";
import { auth } from "@/lib/auth";
import { redirectByRole } from "@/lib/auth-redirect";

const PendingPage = async () => {
  const session = await auth();
  if (!session) redirect("/");
  if (session.user.role !== "PENDING") redirectByRole(session.user.role);

  return <PendingApprovalScreen />;
};

export default PendingPage;
