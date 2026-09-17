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
  layout("routes/app/layout.tsx", [
    route("dashboard", "routes/app/dashboard.tsx"),
  ]),
] satisfies RouteConfig;
