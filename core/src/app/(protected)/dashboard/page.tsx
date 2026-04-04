import FacultyDashboard from "@/components/dashboard/faculty/dashboard-home";
import StudentDashboard from "@/components/dashboard/student/dashboard-home";

const DashboardPage = () => {
  const role = "STUDENT";

  if (role === "STUDENT") return <StudentDashboard />
  if (role === "FACULTY") return <FacultyDashboard />

  return null
}

export default DashboardPage
