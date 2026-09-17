import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import { Outlet } from "react-router";
import { Footer } from "~/components/marketing/footer";
import { Navbar } from "~/components/marketing/navbar";
import { getSession } from "~/lib/session";
import type { Route } from "./+types/layout";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  return { user: session?.user ?? null };
}

export default function MarketingLayout({ loaderData }: Route.ComponentProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="flex min-h-svh flex-col">
          <Navbar signedIn={Boolean(loaderData.user)} />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
