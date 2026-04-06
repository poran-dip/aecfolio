import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import FacultyDashboard from "@/components/dashboard/faculty/dashboard-home";
import StudentDashboard from "@/components/dashboard/student/dashboard-home";
import PendingApprovalScreen from "@/components/dashboard/pending-approval";

const DashboardPage = async () => {
  const session = await auth();
  if (!session) redirect("/");

  const { role } = session.user;

  if (role === "PENDING") return <PendingApprovalScreen />;
  if (role === "STUDENT") return <StudentDashboard />;
  if (role === "FACULTY") return <FacultyDashboard />;

  return null;
};

export default DashboardPage;
