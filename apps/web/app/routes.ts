import {
  index,
  layout,
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/marketing/layout.tsx", [
    index("routes/marketing/home.tsx"),
    route("about", "routes/marketing/about.tsx"),
    route("*", "routes/marketing/not-found.tsx"),
  ]),
  route("dashboard", "routes/app/dashboard.tsx"),

  layout("routes/app/layout.tsx", [
    // Student
    route("app", "routes/app/student/app.tsx"),
    route("export", "routes/app/student/export.tsx"),
    route("history", "routes/app/student/history.tsx"),

    // Staff
    route("profile", "routes/app/staff/profile.tsx"),
    route("students", "routes/app/staff/students.tsx"),
    route("students/exports", "routes/app/staff/student-exports.tsx"),
    route("students/:id", "routes/app/staff/student-detail.tsx"),
    route("verifications", "routes/app/staff/verifications.tsx"),
    route("import", "routes/app/staff/import.tsx"),
    route("faculty", "routes/app/staff/faculty.tsx"),
    route("faculty/:id", "routes/app/staff/faculty-detail.tsx"),
    route("audit", "routes/app/staff/audit.tsx"),
    route("cohort", "routes/app/staff/cohort.tsx"),
  ]),
] satisfies RouteConfig;
