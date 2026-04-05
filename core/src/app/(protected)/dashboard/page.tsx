import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import FacultyDashboard from "@/components/dashboard/faculty/dashboard-home";
import StudentDashboard from "@/components/dashboard/student/dashboard-home";

const DashboardPage = async () => {
  const session = await auth();
  if (!session) redirect("/");

  const { role } = session.user;

  if (role === "STUDENT") return <StudentDashboard />
  if (role === "FACULTY") return <FacultyDashboard />

  return null;
}

export default DashboardPage;
