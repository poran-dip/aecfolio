import {
  index,
  layout,
  prefix,
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/marketing/route.tsx", [
    index("routes/marketing/landing.tsx"),
    route("info", "routes/marketing/info.tsx"),
  ]),
  layout("routes/protected/route.tsx", [
    route("dashboard", "routes/protected/dashboard.tsx"),
    route("pending", "routes/protected/pending.tsx"),
    layout("routes/protected/student/route.tsx", [
      ...prefix("student", [
        index("routes/protected/student/profile.tsx"),
        route("cv", "routes/protected/student/cv.tsx"),
      ]),
    ]),
    layout("routes/protected/faculty/route.tsx", [
      ...prefix("faculty", [
        index("routes/protected/faculty/all-students.tsx"),
        route(":id", "routes/protected/faculty/view-student.tsx"),
        route(
          "verifications",
          "routes/protected/faculty/pending-verifications.tsx",
        ),
        route("import", "routes/protected/faculty/import-students.tsx"),
        route("users", "routes/protected/faculty/approve-users.tsx"),
        route("profile", "routes/protected/faculty/profile.tsx"),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
