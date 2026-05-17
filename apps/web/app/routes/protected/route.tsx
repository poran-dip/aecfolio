import { Outlet } from "react-router";
import type { Route } from "./+types/route";

export async function loader(_: Route.LoaderArgs) {
  // check session, redirect if not authed
}

export default function ProtectedLayout() {
  return <Outlet />;
}
