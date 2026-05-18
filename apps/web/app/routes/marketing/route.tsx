import { Outlet } from "react-router";
import { MarketingFooter } from "~/components/marketing/footer";
import { MarketingNavbar } from "~/components/marketing/navbar";
import { getSession } from "~/lib/session";
import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  return { session };
}

export default function MarketingLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingNavbar />
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <img
          src="/background.jpg"
          alt="background"
          className="w-full h-full object-cover brightness-50 blur-sm scale-105"
        />
      </div>
      <main className="flex-1">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_40%,black_100%)] -z-5" />
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}
