import type { Route } from "./+types/dashboard";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Dashboard | AECFolio" }];
}

export default function DashboardPage() {
  return <div />;
}
