import { Outlet } from "react-router";
import type { Route } from "./+types/route";

export async function loader(_: Route.LoaderArgs) {}

export default function MarketingLayout() {
  return <Outlet />;
}
