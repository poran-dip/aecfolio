import { Briefcase, GraduationCap, Hourglass, Settings } from "lucide-react";

export const studentNav = [
  {
    title: "Dashboard",
    icon: GraduationCap,
    items: [
      { title: "Profile", url: "/student" },
      { title: "Generate CV", url: "/student/cv" },
    ],
  },
];

export const facultyNav = [
  {
    title: "Students",
    icon: GraduationCap,
    items: [
      { title: "All Students", url: "/faculty" },
      { title: "Verification Queue", url: "/faculty/verify" },
    ],
  },
  {
    title: "Access",
    icon: Briefcase,
    items: [
      { title: "Pending Users", url: "/faculty/users" },
      { title: "Bulk Import", url: "/faculty/import" },
    ],
  },
  {
    title: "Account",
    icon: Settings,
    items: [{ title: "Profile", url: "/faculty/profile" }],
  },
];

export const pendingNav = [
  {
    title: "Pending",
    icon: Hourglass,
    items: [{ title: "Pending", url: "/pending" }],
  },
];

export const adminNav = [
  {
    title: "Admin",
    icon: GraduationCap,
    items: [
      { title: "Students", url: "/admin" },
      { title: "Faculty", url: "/admin/faculty" },
      { title: "Pending", url: "/admin/pending" },
      { title: "Admins", url: "/admin/access" },
    ],
  },
  {
    title: "Account",
    icon: Settings,
    items: [{ title: "Profile", url: "/admin/profile" }],
  },
];

export const NAV_ITEMS = {
  STUDENT: studentNav,
  FACULTY: facultyNav,
  PENDING: pendingNav,
  ADMIN: adminNav,
} as const;

export const PLAN_LABELS = {
  STUDENT: "Student Portal",
  FACULTY: "Faculty Portal",
  PENDING: "Pending Approval",
  ADMIN: "Admin Portal",
} as const;
